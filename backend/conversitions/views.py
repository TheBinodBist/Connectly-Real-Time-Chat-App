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
def conversation_list(request):

    conversations = Conversation.objects.filter(
        memberships__user=request.user
    ).prefetch_related("memberships__user")

    serializer = ConversationSerializer(conversations, many=True)

    return Response(serializer.data)


# Create conversation
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def conversation_create(request):

    serializer = ConversationCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    data = serializer.validated_data

    conversation_type = data["conversation_type"]
    name = data.get("name")
    member_ids = set(data["member_ids"])

    member_ids.discard(request.user.pk)

    if not member_ids:
        return Response({"error": "Select at least one user"}, status=400)

    if conversation_type == "direct" and len(member_ids) != 1:
        return Response({"error": "Direct chat requires one other user"}, status=400)

    if conversation_type == "group" and not (name or "").strip():
        return Response({"error": "Group name is required"}, status=400)

    users = list(User.objects.filter(id__in=member_ids))

    if len(users) != len(member_ids):
        return Response({"error": "Some users do not exist"}, status=400)

    # Avoid duplicate direct conversations
    if conversation_type == "direct":

        existing = (
            Conversation.objects.filter(
                conversation_type="direct", memberships__user=request.user
            )
            .filter(memberships__user=users[0])
            .first()
        )

        if existing:
            return Response(ConversationSerializer(existing).data)

    with transaction.atomic():

        conversation = Conversation.objects.create(
            conversation_type=conversation_type,
            name=name if conversation_type == "group" else None,
            created_by=request.user,
        )

        ConversationMember.objects.create(
            conversation=conversation,
            user=request.user,
            role="admin" if conversation_type == "group" else "member",
        )

        for user in users:
            ConversationMember.objects.create(
                conversation=conversation, user=user, role="member"
            )

    return Response(
        ConversationSerializer(conversation).data, status=status.HTTP_201_CREATED
    )


# Get single conversation
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def conversation_detail(request, conversation_id):

    conversation = get_object_or_404(
        Conversation.objects.prefetch_related("memberships__user"),
        id=conversation_id,
        memberships__user=request.user,
    )

    serializer = ConversationSerializer(conversation)

    return Response(serializer.data)


# Add member to group
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_member(request, conversation_id):

    conversation = get_object_or_404(
        Conversation, id=conversation_id, conversation_type="group"
    )

    membership = get_object_or_404(
        ConversationMember, conversation=conversation, user=request.user, role="admin"
    )

    user_id = request.data.get("user_id")
    user = get_object_or_404(User, id=user_id)

    member, created = ConversationMember.objects.get_or_create(
        conversation=conversation, user=user, defaults={"role": "member"}
    )

    if not created:
        return Response({"error": "User already belongs to this group"}, status=400)

    return Response({"message": "Member added successfully"}, status=201)


# Remove member from group
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def remove_member(request, conversation_id, user_id):

    conversation = get_object_or_404(
        Conversation, id=conversation_id, conversation_type="group"
    )

    my_membership = get_object_or_404(
        ConversationMember, conversation=conversation, user=request.user
    )

    if request.user.pk != user_id and my_membership.role != "admin":
        return Response({"error": "Only admins can remove other members"}, status=403)

    member = get_object_or_404(
        ConversationMember, conversation=conversation, user_id=user_id
    )

    member.delete()

    # Keep at least one admin in a nonempty group
    remaining = ConversationMember.objects.filter(conversation=conversation).order_by(
        "joined_at"
    )

    if not remaining.exists():
        conversation.delete()
    elif not remaining.filter(role="admin").exists():
        new_admin = remaining.first()
        new_admin.role = "admin"
        new_admin.save(update_fields=["role"])

    return Response({"message": "Member removed successfully"})
