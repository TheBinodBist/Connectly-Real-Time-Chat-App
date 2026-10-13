from django.urls import path
from . import views

urlpatterns = [
    path("", views.Conversation_list, name="conversation-list"),
    path("create/", views.Conversation_create, name="conversation-create"),
    path(
        "<uuid:conversation_id>/", views.Conversation_detail, name="conversation-detail"
    ),
    path(
        "<uuid:conversation_id>/members/",
        views.add_member,
        name="conversation-add-member",
    ),
    path(
        "<uuid:conversation_id>/members/<uuid:user_id>/",
        views.remove_member,
        name="conversation-remove-member",
    ),
]
