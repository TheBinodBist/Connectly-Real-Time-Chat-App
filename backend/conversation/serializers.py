from rest_framework import serializers
from django.contrib.auth import get_user_model

from .models import Conversation, ConversationMember

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class ConversationMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = ConversationMember
        fields = ["user", "role"]


class ConversationSerializer(serializers.ModelSerializer):
    members = ConversationMemberSerializer(
        source="memberships", many=True, read_only=True
    )

    class Meta:
        model = Conversation
        fields = [
            "id",
            "Conversation_type",
            "name",
            "created_by",
            "members",
            "created_at",
        ]


class ConversationCreateSerializer(serializers.Serializer):
    Conversation_type = serializers.ChoiceField(choices=["direct", "group"])

    name = serializers.CharField(required=False, allow_blank=True)

    member_ids = serializers.ListField(child=serializers.UUIDField())
