from django.contrib.auth import get_user_model
from project import settings
from userauth.models import SiteUser
from userauth.serializers import RegisterSerializer
from userprofile.models import Profile
from friends.models import Friendship


User = get_user_model()

def run():
    
admin_user, created = User.objects.get_or_create(
    username='admin',
    defaults={'email': 'admin@example.com', 'is_staff': True, 'is_superuser': True}
)
Profile.objects.create(username="guest")
Profile.objects.create(username="guest2")
#profile_user1 = Profile.objects.create(username="user1")
#profile_user2 = Profile.objects.create(username="user2")
serializer = RegisterSerializer(data={'email':'chat_test@mail.com',
    'profile_username': 'chat_test_user',
    'password':'Password123!'},
    context={'is_creation': True})
if serializer.is_valid():
    user = serializer.save()

serializer = RegisterSerializer(data={'email': 'friend@mail.com',
    'profile_username': 'friend_user',
    'password': 'Password123!'},
context={'is_creation': True})
if serializer.is_valid():
    friend = serializer.save()
    Friendship.objects.create(from_user=user, to_user=friend, status='accepted')

if __name__ == "__main__":
    run()
