from BackendAPI.views.auth_views import LoginView, RegisterView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from django.urls import path

urlpatterns = [
    path('api/auth/login/', LoginView.as_view(), name='api-login'),
    path('api/auth/register/', RegisterView.as_view(), name='api-register'),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui')
]
