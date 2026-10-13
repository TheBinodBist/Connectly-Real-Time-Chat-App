from django.urls import path
from .views import message_view

urlpatterns = [
    path(
        "<uuid:conversation_id>/messages/", message_view, name="conversation-messages"
    ),
]
