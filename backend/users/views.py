from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import User
from .serializers import RegisterSerializer, UserSerializer


# Register user
@api_view(["POST"])
@permission_classes([AllowAny])
def register_user(request):
    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# View, update, or delete MY profile
@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def my_profile(request):

    user = request.user

    if request.method == "GET":
        serializer = UserSerializer(user)
        return Response(serializer.data)

    elif request.method == "PATCH":
        serializer = UserSerializer(user, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# View ALL users
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def all_users(request):

    users = User.objects.all()
    serializer = UserSerializer(users, many=True)

    return Response(serializer.data)


# View, update, or delete a SPECIFIC user by UUID
@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def user_detail(request, user_id):

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(UserSerializer(user).data)

    elif request.method == "PATCH":
        serializer = UserSerializer(user, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
