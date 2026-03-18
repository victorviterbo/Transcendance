"""Defines the views relatives to user registration, login, password change etc."""
from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from userauth.models import SiteUser
from userprofile.serializers import LightProfileSerializer

from .models import Friendship
from .serializers import FriendshipSerializer


class FriendRequestsSeePend(APIView):
    """Define the function to display friends and friend requests."""
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        """List all friend requests for user."""
        incomming_req = Friendship.objects.filter(to_user=request.user,
                                                  status='pending')
        outgoing_req = Friendship.objects.filter(from_user=request.user,
                                                 status='pending')
        response_data = {}
        response_data['incomming'] = FriendshipSerializer(incomming_req, many=True).data
        response_data['outgoing'] = FriendshipSerializer(outgoing_req, many=True).data
        return Response(response_data, status=status.HTTP_200_OK)

class FriendSee(APIView):
    """Define the function to display friends and friend requests."""
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        """List all friend requests for user."""
        friendships = Friendship.objects.filter(
            (Q(to_user=request.user) | Q(from_user=request.user)), 
            status='accepted'
        ).select_related('from_user__profile', 'to_user__profile')
        friends = []
        for f in friendships:
            if f.from_user == request.user:
                friends.append(f.to_user.profile)
            else:
                friends.append(f.from_user.profile)
        serializer = LightProfileSerializer(friends, many=True)
        return Response({'friends': serializer.data}, status=status.HTTP_200_OK)

class FriendRequestsRespond(APIView):
    """Define the functions related to accepting friend requests."""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        """Respond to friend request."""
        target = request.data.get('target-username')
        if target is None:
            return (Response({'error': {'target-username': 'MISSING_FIELD'}},
                             status=status.HTTP_400_BAD_REQUEST))
        target_user = SiteUser.objects.filter(profile__username=target)
        if target_user.count() < 1:
            return (Response({'error': {'target-username': 'USER_NOT_FOUND'},
                              'requested': request.data.get('target-username')},
                              status=status.HTTP_400_BAD_REQUEST))
        sender = target_user.first()
        user = request.user
        curr_relationship = Friendship.objects.filter(
            from_user=sender,
            to_user=user
        ).first()
        if curr_relationship and curr_relationship.status == 'pending':
            if request.data['new-status'] == 'accept':
                curr_relationship.status = 'accepted'
                curr_relationship.save()
                return Response({'description': 'FRIENDSHIP_REQUEST_ACCEPTED',
                                 'target-username': target},
                                status=status.HTTP_200_OK)
            elif request.data['new-status'] == 'reject':
                curr_relationship.delete()
                return Response({'description': 'FRIENDSHIP_REQUEST_REJECTED',
                                    'target-username': target}, 
                                status=status.HTTP_200_OK)
        
        return Response({'error': {'friendship': 'FRIENDSHIP_NOT_FOUND'}},
                        status=status.HTTP_400_BAD_REQUEST)
            
class FriendRequestsSend(APIView):
    """Define the functions related to sending friend requests."""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        """Send friend request."""
        target = request.data.get('target-username')
        if target is None:
            return (Response({'error': {'target-username': 'MISSING_FIELD'}},
                                status=status.HTTP_400_BAD_REQUEST))
        target_user = SiteUser.objects.filter(profile__username=target)
        if target_user.count() < 1:
            return (Response({'error': {'target-username': 'USER_NOT_FOUND'},
                                'requested': request.data.get('target-username')},
                                status=status.HTTP_400_BAD_REQUEST))
        recipient = target_user.first()
        user = request.user
        if recipient == user:
            return Response({'error': {'friendship': 'REALLY_SAD'}}, 
                            status=status.HTTP_400_BAD_REQUEST)
        curr_relationship = Friendship.objects.filter(
            from_user=user, 
            to_user=recipient,
        )
        if curr_relationship.exists():
            return Response({'error': {'friendship': 'FRIENDSHIP_ALREADY_EXISTS'},
                            'request_status': curr_relationship.first().status},
                            status=status.HTTP_400_BAD_REQUEST)
        Friendship.objects.create(
            from_user=user,
            to_user=recipient,
            status='pending'
        )
        return Response({'description': 'FRIENDSHIP_REQUEST_SENT',
                            'target-username': target}, 
                        status=status.HTTP_201_CREATED)
