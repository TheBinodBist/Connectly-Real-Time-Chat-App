from django.urls import path
from . import views

urlpatterns = [
    path("register/", views.register_user, name="register"),
    path("me/", views.my_profile, name="my-profile"),
    path("users/", views.all_users, name="all-users"),
    path("users/<uuid:user_id>/", views.user_detail, name="user-detail"),
]
