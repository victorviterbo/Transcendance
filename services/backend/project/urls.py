"""Define the incomming request rerouting for the backend based on the requested url."""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from project.views import HealthCheckView

urlpatterns = [
    path('api/health/', HealthCheckView.as_view(), name='health-check'),
    path('api/admin/', admin.site.urls),
    path('api/auth/', include('userauth.urls')),
    path('api/social/', include('friends.urls')),
    path('api/profile/', include('userprofile.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/stats/', include('stats.urls')),
    path('api/game/', include('game.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
