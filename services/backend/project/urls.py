"""Define the incomming request rerouting for the backend based on the requested url."""

from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('api/admin/', admin.site.urls),
    path('api/music/', include('music.urls')),
    path('api/auth/', include('userauth.urls')),
    path('api/social/', include('friends.urls')),
    path('api/profile/', include('userprofile.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/game/', include('game.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/swagger/', SpectacularSwaggerView.as_view(url_name='schema'),
         name='swagger-ui'),
]
