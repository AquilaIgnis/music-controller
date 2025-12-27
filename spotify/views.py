import os
import json
import base64
from dotenv import load_dotenv
from requests import Request, post
from rest_framework.views import APIView
from rest_framework import status, generics
from rest_framework.response import Response
from django.shortcuts import redirect
from .util import is_spotify_authenticated, update_or_create_user_tokens, spotify_api_request, play_song, pause_song
from api.models import Room
from .models import SpotifyToken
from .serializers import TokenSerializer

load_dotenv()

if os.getenv('Docker'):
    REACT_PORT = os.getenv('REACT_PORT')
    API_PORT = os.getenv('API_PORT')
    WEBSITE = 'https://gxnet.cc'
    REDIRECT_URI = 'https://gxnet.cc/spotify/redirect'
else:
    REACT_PORT = 5173
    API_PORT = 8000
    REDIRECT_URI = f'http://127.0.0.1:{API_PORT}/spotify/redirect'

CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')


class AuthURL(APIView):
    def get(self, request):
        if not request.session.exists(request.session.session_key):
            request.session.create()
        orig_sid = request.session.session_key

        room_code = request.GET.get('state')
        state_obj = {"room": room_code, "sid": orig_sid}
        state = base64.urlsafe_b64encode(json.dumps(state_obj).encode()).decode()

        scopes = 'user-read-playback-state user-modify-playback-state user-read-currently-playing'
        url = (
            Request(
                'GET',
                'https://accounts.spotify.com/authorize',
                params={
                    'scope': scopes,
                    'response_type': 'code',
                    'client_id': CLIENT_ID,
                    'redirect_uri': REDIRECT_URI,
                    'state': state,
                },
            )
            .prepare()
            .url
        )

        # sanity debug
        print('🎧client_id:', CLIENT_ID)
        print('🎧 orig_sid:', orig_sid)
        print(' 🎧url:', url)

        return Response({'url': url}, status=status.HTTP_200_OK)


# https://developer-assets.spotifycdn.com/images/documentation/web-api/auth-code-flow.png
def spotify_callback(request):
    code = request.GET.get('code')
    raw_state = request.GET.get("state") or ""
    state = json.loads(base64.urlsafe_b64decode(raw_state).decode())
    error = request.GET.get('error')

    room_code = state.get("room")  # <- plain string
    orig_sid = state.get("sid")

    response = post(
        'https://accounts.spotify.com/api/token',
        data={
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': REDIRECT_URI,
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
        },
    ).json()

    access_token = response.get('access_token')
    token_type = response.get('token_type')
    refresh_token = response.get('refresh_token')
    expires_in = response.get('expires_in')
    error = response.get('error')

    if not request.session.exists(request.session.session_key):
        request.session.create()
    cur_sid = request.session.session_key

    # if session changed, rebind room host
    room = Room.objects.filter(code=room_code, host=orig_sid).first()
    if room and cur_sid != orig_sid:
        room.host = cur_sid
        room.save(update_fields=["host"])

    update_or_create_user_tokens(request.session.session_key, access_token, token_type, expires_in, refresh_token)

    if room_code:
        request.session['room_code'] = room_code

    print('🎧### On spotify Callback() ## 🎧')
    print("Host:", request.get_host())
    print("Cookies:", request.COOKIES)
    print("Session key:", request.session.session_key)
    print('room_code REDIRECT:', room_code)

    if WEBSITE:
        target = f'{WEBSITE}/room/{room_code}?code={room_code}&auth=done'
    else:
        target = f'http://127.0.0.1:{REACT_PORT}/room/{room_code}?code={room_code}&auth=done'

    return redirect(target)


class IsAuthenticated(APIView):
    def get(self, request):
        is_auth = is_spotify_authenticated(self.request.session.session_key)
        return Response({'status': is_auth, 'message': '🎧'})


class CurrentSong(APIView):
    def get(self, request):
        room_code = self.request.session.get('room_code')
        print('DEBUG ; room_code:', room_code)

        room = Room.objects.filter(code=room_code).first()
        if room:
            host = room.host

        else:
            return Response({'message': 'not a room'}, status=status.HTTP_404_NOT_FOUND)

        endpoint = 'player/currently-playing'
        response = spotify_api_request(host, endpoint)

        if 'error' in response or 'item' not in response:
            return Response({'error': 'error response from spotify'}, status=status.HTTP_400_BAD_REQUEST)

        else:
            item = response.get('item')
            duration = item.get('duration_ms')
            progress = response.get('progress_ms')
            album_cover = item.get('album').get('images')[0].get('url')
            is_playing = response.get('is_playing')
            song_id = item.get('id')

            artist_string = ""

            for i, artist in enumerate(item.get('artists')):
                if i > 0:
                    artist_string += ", "
                name = artist.get('name')
                artist_string += name

            song = {
                'title': item.get('name'),
                'artist': artist_string,
                'duration': duration,
                'time': progress,
                'image_url': album_cover,
                'is_playing': is_playing,
                'votes': 0,
                'id': song_id,
            }

            return Response(song, status=status.HTTP_200_OK)


class SpotifyList(generics.ListAPIView):
    queryset = SpotifyToken.objects.all()
    serializer_class = TokenSerializer


class PauseSong(APIView):
    def put(self, request):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)[0]

        if self.request.session.session_key == room.host or room.guest_can_pause:
            upstream_response = pause_song(room.host)
            return Response(upstream_response, status=status.HTTP_200_OK)
        return Response({'Not allowed': 'you are not the host'}, status=status.HTTP_403_FORBIDDEN)


class PlaySong(APIView):
    def put(self, request):
        room_code = self.request.session.get('room_code')
        room = Room.objects.filter(code=room_code)[0]

        if self.request.session.session_key == room.host or room.guest_can_pause:
            upstream_response = play_song(room.host)
            return Response(upstream_response, status=status.HTTP_200_OK)
        return Response({'Not allowed': 'you are not the host'}, status=status.HTTP_403_FORBIDDEN)
