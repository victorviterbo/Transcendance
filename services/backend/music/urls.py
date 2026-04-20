from django.urls import path
from .views import GenresView

urlpatterns = [
    path('genres/', GenresView.as_view(), name='genres'),
]