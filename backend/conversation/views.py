from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.db import transaction

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Conversation, ConversationMember
from .serializers import ConversationSerializer, ConversationCreateSerializer

User = get_user_model()


# Get all my conversations
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def Conversation_list(request):
    conversations = (
        Conversation.objects.filter(memberships__user=request.user)
        .prefetch_related("memberships__user")
        .distinct()
    )

    serializer = ConversationSerializer(conversations, many=True)
    return Response(serializer.data)


# Create conversation
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def Conversation_create(request):
    serializer = ConversationCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    data = serializer.validated_data

    conversation_type = data["Conversation_type"]
    name = data.get("name")
    member_ids = set(data["member_ids"])

    # Remove current user from supplied member IDs
    member_ids.discard(request.user.pk)

    if not member_ids:
        return Response(
            {"error": "Select at least one user"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if conversation_type == "direct" and len(member_ids) != 1:
        return Response(
            {"error": "Direct chat requires one other user"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if conversation_type == "group" and not (name or "").strip():
        return Response(
            {"error": "Group name is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    users = list(User.objects.filter(pk__in=member_ids))

    if len(users) != len(member_ids):
        return Response(
            {"error": "Some users do not exist"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Avoid duplicate direct conversations
    if conversation_type == "direct":
        existing = (
            Conversation.objects.filter(
                Conversation_type="direct",
                memberships__user=request.user,
            )
            .filter(memberships__user=users[0])
            .distinct()
            .first()
        )

        if existing:
            return Response(ConversationSerializer(existing).data)

    with transaction.atomic():
        conversation = Conversation.objects.create(
            Conversation_type=conversation_type,
            name=name if conversation_type == "group" else None,
            created_by=request.user,
        )

        # Add creator
        ConversationMember.objects.create(
            Conversation=conversation,
            user=request.user,
            role="admin" if conversation_type == "group" else "member",
        )

        # Add selected users
        for user in users:
            ConversationMember.objects.create(
                Conversation=conversation,
                user=user,
                role="member",
            )

    return Response(
        ConversationSerializer(conversation).data,
        status=status.HTTP_201_CREATED,
    )


# Get single conversation
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def Conversation_detail(request, conversation_id):
    conversation = get_object_or_404(
        Conversation.objects.prefetch_related("memberships__user"),
        pk=conversation_id,
        memberships__user=request.user,
    )

    serializer = ConversationSerializer(conversation)
    return Response(serializer.data)


# Add member to group
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_member(request, conversation_id):
    conversation = get_object_or_404(
        Conversation,
        pk=conversation_id,
        Conversation_type="group",
    )

    # Only group admins can add members
    get_object_or_404(
        ConversationMember,
        Conversation=conversation,
        user=request.user,
        role="admin",
    )

    user_id = request.data.get("user_id")

    if not user_id:
        return Response(
            {"error": "user_id is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = get_object_or_404(User, pk=user_id)

    member, created = ConversationMember.objects.get_or_create(
        Conversation=conversation,
        user=user,
        defaults={"role": "member"},
    )

    if not created:
        return Response(
            {"error": "User already belongs to this group"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {"message": "Member added successfully"},
        status=status.HTTP_201_CREATED,
    )


# Remove member from group
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def remove_member(request, conversation_id, user_id):
    with transaction.atomic():
        conversation = get_object_or_404(
            Conversation,
            pk=conversation_id,
            Conversation_type="group",
        )

        my_membership = get_object_or_404(
            ConversationMember,
            Conversation=conversation,
            user=request.user,
        )

        # Admins can remove others; members can remove themselves
        if request.user.pk != user_id and my_membership.role != "admin":
            return Response(
                {"error": "Only admins can remove other members"},
                status=status.HTTP_403_FORBIDDEN,
            )

        member = get_object_or_404(
            ConversationMember,
            Conversation=conversation,
            user_id=user_id,
        )

        member.delete()

        remaining = ConversationMember.objects.filter(
            Conversation=conversation
        ).order_by("joined_at")

        if not remaining.exists():
            conversation.delete()

        elif not remaining.filter(role="admin").exists():
            new_admin = remaining.first()
            new_admin.role = "admin"
            new_admin.save(update_fields=["role"])

    return Response(
        {"message": "Member removed successfully"},
        status=status.HTTP_200_OK,
    )
