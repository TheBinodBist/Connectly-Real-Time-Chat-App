from django.shortcuts import get_object_or_404

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from conversation.models import Conversation
from .models import Message
from .serializers import MessageSerializer


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def message_view(request, conversation_id):
    conversation = get_object_or_404(
        Conversation,
        id=conversation_id,
    )

    # Check whether the current user belongs to this conversation.
    is_member = conversation.members.filter(id=request.user.id).exists()

    if not is_member:
        return Response(
            {"error": "You are not a member of this conversation."},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Fetch messages.
    if request.method == "GET":
        messages = (
            Message.objects.filter(conservation=conversation)
            .select_related("sender")
            .order_by("created_at")
        )

        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # Create a message.
    serializer = MessageSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save(
            sender=request.user,
            conservation=conversation,
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )
