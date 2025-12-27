import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { PlayerProps, roomData, SpotifyAuthResponse } from '../interfaces';
import CreateRoomPage from './CreateRoomPage';
import Player from './Player';
import { Stack } from '@mui/material';

function Room() {
  let { roomCode } = useParams<{ roomCode: string }>();
  const [votesToSkip, setVotesToSkip] = useState<number>(2);
  const [guestCanPause, setGuestCanPause] = useState<boolean>(false);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [settings, setSettigs] = useState<boolean>(false);
  const [isSpotifyAuth, setIsSpotifyAuth] = useState(false);
  const [playing, setPlaying] = useState<PlayerProps>();

  const navigate = useNavigate();

  function LeaveRoom() {
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    };

    fetch('/api/leave-room/', requestOptions)
      .then((response) => response.json())
      .then((data) => {
        if (data.message) {
          console.log('leaving room ', data);
          navigate('/');
        }
      });
  }

  function checkAuth() {
    const requestOptions: RequestInit = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    };

    fetch('/spotify/is-auth', requestOptions)
      .then((response) => response.json())
      .then((data) => {
        if (data.status) {
          setIsSpotifyAuth(true);
          console.log('is-auth response', data.status);
        }
      });
  }

  function renderSettingsButton() {
    return (
      <Grid size={12} alignContent="center">
        <Button variant="contained" color="primary" onClick={() => setSettigs(true)}>
          Settings
        </Button>

        <Button variant="contained" color="warning" onClick={() => authenticateSpotify()}>
          Login To Spotify
        </Button>
      </Grid>
    );
  }

  function renderSerrings() {
    return (
      <Grid container spacing={1}>
        <Grid size={12} alignContent="center">
          <CreateRoomPage
            update={true}
            votes_to_skip={votesToSkip}
            allowPause={guestCanPause}
            roomCode={roomCode || null}
          />
        </Grid>
        <Grid size={12} alignContent="center">
          <Button variant="contained" color="secondary" onClick={() => setSettigs(false)}>
            Exit settings
          </Button>
        </Grid>
      </Grid>
    );
  }

  // on maunt and settings change
  useEffect(() => {
    if (!roomCode) {
      setError('No room code provided');
      return;
    }

    fetch('/api/get-room/?code=' + roomCode, {
      credentials: 'include',
    })
      .then((response) => {
        if (!response.ok) {
          navigate('/home');
        }
        roomCode = undefined;
        return response.json();
      })
      .then((data: roomData) => {
        console.log('data:', data);
        setVotesToSkip(data.votes_to_skip);
        setGuestCanPause(data.guest_can_pause);
        console.log('data.isHost', data.isHost);
        setIsHost(data.isHost);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, [settings]);

  ///get playing song
  useEffect(() => {
    function getSong() {
      fetch('/spotify/current-song', {
        credentials: 'include',
      })
        .then((response) => response.json())
        .then((data) => {
          console.log('📡 fetchData called : ', data);
          setPlaying(data);
        })
        .catch((err) => {
          console.log('❌ Error fetching data:', err);
        });
    }

    checkAuth();
    if (isSpotifyAuth === true) {
      getSong();

      const intervalID = setInterval(() => {
        getSong();
      }, 1000);

      return () => {
        clearInterval(intervalID);
      };
    }

    console.log('isSpotifyAuth ', isSpotifyAuth);
  }, [isSpotifyAuth]);

  function authenticateSpotify() {
    if (isHost && !isSpotifyAuth) {
      setIsSpotifyAuth(true);
      console.log('isSpotifyAuth.current:', isSpotifyAuth);

      fetch('/spotify/is-auth', {
        credentials: 'include',
      })
        .then((response) => response.json())
        .then((data: SpotifyAuthResponse) => {
          // isSpotifyAuth.current = data.status;

          if (!data.status) {
            fetch(`/spotify/get-auth-url?state=${roomCode}`, {
              credentials: 'include',
            }).then((response) =>
              response.json().then((data) => {
                //redirect to spotify upstream auth
                window.location.replace(data.url);
                return;
              }),
            );
          }
        });
    } else {
      console.log('Clicked Utenticate button ');
      console.log('isSpotifyAuth:', isSpotifyAuth);
      return;
    }
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (settings) {
    console.log('rendering settings', settings);
    return renderSerrings();
  } else {
    return (
      <Stack spacing={2} sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
        <Typography variant="h4">Room: {roomCode}</Typography>
        {playing ? <Player {...playing} /> : <Typography variant="h4">Nothing playing</Typography>}
        <Typography variant="h6">Votes to Skip: {votesToSkip}</Typography>
        <Typography variant="h6">Guest Can Pause: {guestCanPause ? 'Yes' : 'No'}</Typography>
        <Typography variant="h6">Is Host: {isHost ? 'Yes' : 'No'}</Typography>
        {isHost ? renderSettingsButton() : null}
        <Button variant="contained" color="secondary" onClick={LeaveRoom}>
          Leave Room
        </Button>
      </Stack>
    );
  }
}
export default Room;
