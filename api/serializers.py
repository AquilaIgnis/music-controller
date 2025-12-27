from rest_framework import serializers
from .models import Room


class RoomSerializer(serializers.ModelSerializer):
    class Meta:  # pyright: ignore
        model = Room
        fields = (
            'id',
            'code',
            'host',
            'guest_can_pause',
            'votes_to_skip',
            'created_at',
        )


class CreateRoomSerializer(serializers.ModelSerializer):
    class Meta:  # pyright: ignore
        model = Room
        fields = ('guest_can_pause', 'votes_to_skip')


class UpdateRoomSerializer(serializers.ModelSerializer):
    # code is unique so needs to be modifies to get it passed here
    code = serializers.CharField(validators=[])

    class Meta:  # pyright: ignore
        model = Room
        fields = ('guest_can_pause', 'votes_to_skip', 'code')
