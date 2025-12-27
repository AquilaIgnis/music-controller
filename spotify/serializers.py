from rest_framework import serializers
from .models import SpotifyToken


class TokenSerializer(serializers.ModelSerializer):
    class Meta:  # pyright: ignore
        model = SpotifyToken
        fields = (
            'id',
            'user',
            'access_token',
            'token_type',
            'expires_in',
            'refresh_token',
        )
