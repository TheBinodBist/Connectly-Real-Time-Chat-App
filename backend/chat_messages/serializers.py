from rest_framework import serializers
from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = [
            "id",
            "conservation",
            "sender",
            "content",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "conservation",
            "sender",
            "created_at",
        ]
