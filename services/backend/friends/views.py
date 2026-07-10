"""Define the views for the social/friends API."""

from django.db.models import Q
from rest_framework import serializers
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from userauth.models import SiteUser
from userprofile.models import Profile

from .models import Friendship
from .serializers import FriendInfoSerializer, FriendUserSerializer
from .signals import notif_payload
from .validators import validate_social_search_query


def get_request_value(request: Request, *keys: str) -> str | None:
    """Return the first non-empty request value found for the provided keys."""
    for key in keys:
        value = request.data.get(key)
        if value is not None:
            return value
    return None

def friendship_relation(user: SiteUser, profile: Profile) -> str:
    """Return the frontend relation label for a profile."""
    outgoing = Friendship.objects.filter(from_user=user, to_user=profile.user).first()
    if outgoing:
        return 'friends' if outgoing.status == 'accepted' else 'outgoing'
    incoming = Friendship.objects.filter(from_user=profile.user, to_user=user).first()
    if incoming:
        return 'friends' if incoming.status == 'accepted' else 'incoming'
    return 'not-friends'


def _error_response(payload: dict[str, str]) -> Response:
    """Build a standardized 400 response."""

    return Response({'error': payload}, status=status.HTTP_400_BAD_REQUEST)

def resolve_target_user(target_uid: str | None) -> SiteUser | None:
    """Resolve a target user from either SiteUser.uid or Profile.uid."""
    if target_uid is None:
        return None
    user = SiteUser.objects.filter(uid=target_uid).select_related('profile').first()
    if user:
        return user
    profile = Profile.objects.filter(uid=target_uid).select_related('user').first()
    if not profile:
        return None
    return profile.user

def friend_response(description: str, target_user: SiteUser, target_username: str | None = None) -> dict:
    """response for friend actions."""
    return {
        'description': description,
        'targetUid': str(target_user.profile.uid),
        'targetUsername': target_username or target_user.profile.username,
    }



class FriendRequestsSeePend(APIView):
    """Define the function to display friends and friend requests."""
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        """List all pending friend requests for the authenticated user."""
        incoming_requests = (
            Friendship.objects.filter(to_user=request.user, status='pending')
            .select_related('from_user__profile', 'to_user__profile')
            .order_by('-created_at')
        )
        outgoing_requests = (
            Friendship.objects.filter(from_user=request.user, status='pending')
            .select_related('from_user__profile', 'to_user__profile')
            .order_by('-created_at')
        )

        incoming_profiles = (friendship.from_user.profile for friendship in incoming_requests)
        outgoing_profiles = (friendship.to_user.profile for friendship in outgoing_requests)

        return Response(
            {
                'incoming': FriendUserSerializer(
                    incoming_profiles, 
                    many=True, 
                    context={'request': request, 'relation': 'incoming'}
                ).data,
                'outgoing': FriendUserSerializer(
                    outgoing_profiles, 
                    many=True, 
                    context={'request': request, 'relation': 'outgoing'}
                ).data,
            },
            status=status.HTTP_200_OK,
        )

class FriendSee(APIView):
    """Define the function to display friends and friend requests."""
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        """List all accepted friends for the authenticated user."""
        friendships = Friendship.objects.filter(
            Q(to_user=request.user) | Q(from_user=request.user),
            status='accepted',
        ).select_related('from_user__profile', 'to_user__profile')

        friends = []
        for friendship in friendships:
            if friendship.from_user == request.user:
                friends.append(friendship.to_user.profile)
            else:
                friends.append(friendship.from_user.profile)

        serializer = FriendInfoSerializer(friends, many=True, context={'request': request})
        return Response({'friends': serializer.data}, status=status.HTTP_200_OK)


class FriendSearch(APIView):
    """Search profiles and return their relation to the authenticated user."""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        """Search profiles by username substring."""
        raw_query = get_request_value(request, 'search', 'q')
        if raw_query is None:
            return _error_response({'search': 'MISSING_FIELD'})
        try:
            query = validate_social_search_query(raw_query)
        except serializers.ValidationError as exc:
            codes = exc.get_codes()
            message = 'MAX_LENGTH_SEARCH' if 'max_length' in codes else 'EMPTY_SEARCH'
            return _error_response({'search': message})

        profiles = (
            Profile.objects.filter(username__icontains=query)
            .exclude(user=request.user)
            .filter(user__isnull=False)
            .select_related('user')     
        )
        users = []
        for profile in profiles:
            rel = friendship_relation(request.user, profile)
            users.append(
                FriendUserSerializer(
                    profile,
                    context={
                        'request': request,
                        'relation': rel,
                    },
                ).data,
            )
        return Response({'users': users}, status=status.HTTP_200_OK)

class FriendRequestsRespond(APIView):
    """Define the functions related to accepting friend requests."""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        """Accept or refuse a pending friend request."""

        target_uid = get_request_value(request, 'targetUid')
        target_username = get_request_value(request, 'targetUsername')
        new_status = request.data.get('newStatus')

        error_payload: dict[str, str] = {}
        if target_uid is None:
            error_payload['targetUid'] = 'MISSING_FIELD'
        if new_status is None:
            error_payload['newStatus'] = 'MISSING_FIELD'
        if error_payload:
            return _error_response(error_payload)

        if new_status == 'reject':
            new_status = 'refuse'

        target_user = resolve_target_user(target_uid)
        if target_user is None:
            return _error_response({'targetUid': 'USER_NOT_FOUND'})

        sender = target_user
        user = request.user
        relationship = Friendship.objects.filter(from_user=sender, to_user=user).first()
        if relationship and relationship.status == 'pending':
            if new_status == 'accept':
                relationship.status = 'accepted'
                relationship.read = False
                relationship.save(update_fields=['status', 'read'])
                return Response(
                    {
                        'description': 'FRIENDSHIP_REQUEST_ACCEPTED',
                        'targetUid': str(target_user.profile.uid),
                        'targetUsername': target_username or target_user.profile.username,
                    },
                    status=status.HTTP_200_OK,
                )
            if new_status == 'refuse':
                relationship.delete()
                return Response(
                    {
                        'description': 'FRIENDSHIP_REQUEST_REJECTED',
                        'targetUid': str(target_user.profile.uid),
                        'targetUsername': target_username or target_user.profile.username,
                    },
                    status=status.HTTP_200_OK,
                )

        return Response({'error': {'friendship': 'FRIENDSHIP_NOT_FOUND'}}, status=status.HTTP_400_BAD_REQUEST)
            
class FriendRequestsSend(APIView):
    """Define the functions related to sending friend requests."""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        """Send a new friend request."""
        target_uid = get_request_value(request, 'targetUid')
        target_username = get_request_value(request, 'targetUsername')
        if target_uid is None:
            return _error_response({'targetUid': 'MISSING_FIELD'})

        recipient = resolve_target_user(target_uid)
        if recipient is None:
            return _error_response({'targetUid': 'USER_NOT_FOUND'})

        user = request.user
        if recipient == user:
            return Response({'error': {'friendship': 'REALLY_SAD'}}, status=status.HTTP_400_BAD_REQUEST)

        relationship = Friendship.objects.filter(
            Q(from_user=user, to_user=recipient) | Q(from_user=recipient, to_user=user)
        ).first()
        if relationship:
            return Response(
                {
                    'error': {'friendship': 'FRIENDSHIP_ALREADY_EXISTS'},
                    'request_status': relationship.status,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        Friendship.objects.create(from_user=user, to_user=recipient, status='pending', read=False)
        return Response(
            {
                'description': 'FRIENDSHIP_REQUEST_SENT',
                'targetUid': str(recipient.profile.uid),
                'targetUsername': target_username or recipient.profile.username,
            },
            status=status.HTTP_201_CREATED,
        )


class FriendRemove(APIView):
    """Define the functions related to removing friends."""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        """Remove an accepted friendship or cancel an outgoing pending request."""
        target_uid = get_request_value(request, 'targetUid')
        target_username = get_request_value(request, 'targetUsername')
        if target_uid is None:
            return _error_response({'targetUid': 'MISSING_FIELD'})

        target_user = resolve_target_user(target_uid)
        if target_user is None:
            return Response(
                {'error': {'friendship': 'FRIENDSHIP_NOT_FOUND'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        friendship = Friendship.objects.filter(
            Q(from_user=user, to_user=target_user, status='accepted')
            | Q(from_user=target_user, to_user=user, status='accepted')
            | Q(from_user=user, to_user=target_user, status='pending')
        ).first()
        if friendship is None:
            return Response(
                {'error': {'friendship': 'FRIENDSHIP_NOT_FOUND'}},
                status=status.HTTP_400_BAD_REQUEST
            )
        description = (
            'FRIENDSHIP_REQUEST_CANCELLED'
            if friendship.status == 'pending'
            else 'FRIENDSHIP_REMOVED'
        )
        friendship.delete()
        return Response(friend_response(description, target_user, target_username), status=status.HTTP_200_OK)


class NotifSee(APIView):
    """List pending friend_request notifications for the authenticated user."""
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        """Return incoming friend requests as notification entries."""
        incoming_friendships = (
            Friendship.objects.filter(to_user=request.user, status='pending')
            .select_related('from_user__profile')
            .order_by('-created_at')
        )
        accepted_friendships = (
            Friendship.objects.filter(from_user=request.user, status='accepted')
            .select_related('to_user__profile')
            .order_by('-created_at')
        )
        notifs = [
            notif_payload(
                friendship=friendship,
                kind='friend_request',
                profile=friendship.from_user.profile,
                relation='incoming',
                request=request,
            )
            for friendship in incoming_friendships
        ]
        notifs.extend(
            notif_payload(
                friendship=friendship,
                kind='friend_accepted',
                profile=friendship.to_user.profile,
                relation='friends',
                request=request,
            )
            for friendship in accepted_friendships
        )
        notifs.sort(key=lambda notif: notif['date'], reverse=True)
        return Response(
            {'notifs': notifs},
            status=status.HTTP_200_OK,
        )


class NotifRead(APIView):
    """Mark pending friend_request notifications as read."""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        """Mark all incoming friend_request notifications as read."""
        Friendship.objects.filter(to_user=request.user, status='pending', read=False).update(read=True)
        Friendship.objects.filter(from_user=request.user, status='accepted', read=False).update(read=True)
        return Response({}, status=status.HTTP_200_OK)
