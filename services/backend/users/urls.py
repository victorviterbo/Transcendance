from .views import (
    LoginView, 
    RegisterView, 
    ProfileView,
    LogoutView,
    RefreshTokenView
)

from django.urls import path

urlpatterns = [
    path('login/', LoginView.as_view(), name='user-login'),
    path('register/', RegisterView.as_view(), name='user-register'),
    path('profile/', ProfileView.as_view(), name="user-profile"),
    path('logout/', LogoutView.as_view(), name="user-logout"),
    path('refresh-token/', RefreshTokenView.as_view(), name="user-refresh-token"),
]
