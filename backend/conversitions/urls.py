from django.urls import path
from . import views

urlpatterns = [
    path("conversations/", views.conversation_list),
    path("conversations/create/", views.conversation_create),
    path("conversations/<uuid:conversation_id>/", views.conversation_detail),
    path("conversations/<uuid:conversation_id>/members/", views.add_member),
    path(
        "conversations/<uuid:conversation_id>/members/<uuid:user_id>/",
        views.remove_member,
    ),
]
