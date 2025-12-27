from django.utils import timezone
from .models import SpotifyToken
import os
from dotenv import load_dotenv
from datetime import timedelta
from requests import post, put, get

load_dotenv()

CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')

BASE_URL = 'https://api.spotify.com/v1/me/'


def get_user_token(session_id):
    user_tokens = SpotifyToken.objects.filter(user=session_id)
    # DEBUG
    print('## get_user_token()##')
    print('user_tokens:', user_tokens.first())
    print('session_id', session_id)

    if user_tokens.exists():
        return user_tokens[0]
    else:
        return None


def update_or_create_user_tokens(session_id, access_token, token_type, expires_in, refresh_token):
    # default expires in = 3600 from spotify
    tokens = get_user_token(session_id)
    expires_in = timezone.now() + timedelta(seconds=expires_in)

    # update if exist
    if tokens:
        tokens.access_token = access_token
        tokens.expires_in = expires_in
        tokens.refresh_token = refresh_token
        tokens.token_type = token_type
        tokens.save(update_fields=['access_token', 'expires_in', 'refresh_token', 'token_type'])

    else:  # create on db
        tokens = SpotifyToken(
            user=session_id,
            access_token=access_token,
            token_type=token_type,
            expires_in=expires_in,
            refresh_token=refresh_token,
        )
        tokens.save()


def is_spotify_authenticated(session_id):
    tokens = get_user_token(session_id)

    if tokens:
        expiry = tokens.expires_in
        return True

    return False


def refresh_spotify_token(session_id):
    refresh_token = get_user_token(session_id).refresh_token

    _response = post(
        'https://accounts.spotify.com/api/token',
        data={
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token,
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
        },
    ).json()

    # dont need these just in  case
    access_token = _response.get('access_token')
    token_type = _response.get('token_type')
    expires_in = _response.get('expires_in')

    update_or_create_user_tokens(session_id, access_token, token_type, expires_in, refresh_token)


def spotify_api_request(session_id, endpoint, post_=False, put_=False):
    tokens = get_user_token(session_id)

    # endpoint = 'player/currently-playing'
    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + tokens.access_token,
    }
    if post_:
        response = post(BASE_URL + endpoint, headers=headers)
        try:
            return response.json()
        except:
            return {'Error': 'Issue with POST request'}

    if put_:
        response = put(BASE_URL + endpoint, headers=headers)
        try:
            return response.json()
        except:
            return {'Error': 'Issue with PUT request'}

    # GET request (default)
    spotify_response = get(BASE_URL + endpoint, headers=headers)

    try:
        return spotify_response.json()
    except:
        return {'Error': 'Issue with GET request', 'status_code': spotify_response.status_code}


def play_song(session_id):
    return spotify_api_request(session_id, 'player/play', put_=True)


def pause_song(session_id):
    return spotify_api_request(session_id, 'player/pause', put_=True)
