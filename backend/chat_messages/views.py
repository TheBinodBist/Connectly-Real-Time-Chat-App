from django.shortcuts import get_object_or_404

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


from conversation.models import Conversation, ConversationMember
from .models import Message
from .serializers import MessageSerializer


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def message_view(request, conversation_id):
    conversation = get_object_or_404(Conversation, id=conversation_id)

    is_member = Conversation.objects.filter(
        conversation=conversation, user=request.user
    ).exists()

    if not is_member:
        return Response(
            {"error": "You are not member if this converations"},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == "GET":
        message = Message.objects.filter(conversation=conversation).select_related(
            "sender"
        )

        serializer = MessageSerializer(message, many=True)

        return Response(serializer.data)

    if request.method == "POST":
        serializer = MessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(sender=request.user, conversation=conversation)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
