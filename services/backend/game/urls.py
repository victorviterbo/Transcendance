"""URL routes for game API endpoints."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import GameViewSet

router = DefaultRouter()
router.register('', GameViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
