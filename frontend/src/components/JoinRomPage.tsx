import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

function JoinRoomPage() {
  const [roomCode, setRoomCode] = useState<string>('');
  const [errorCode, setErrorcode] = useState<string>('');
  const navigate = useNavigate();

  function joinButton() {
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code: roomCode }),
    };

    fetch('/api/join-room/', requestOptions)
      .then((response) => {
        console.log('The response:', response);
        if (response.ok) {
          navigate(`/room/${roomCode}`);
        } else {
          setErrorcode('Room not found');
        }
      })
      .catch((err) => console.log('fetch error:', err));

    console.log('code :', roomCode);
  }

  return (
    <Grid container spacing={1}>
      <Grid size={12} alignItems="center">
        <Typography variant="h4" component="h4">
          Join a Room
        </Typography>
        <Grid size={12} alignItems="center">
          <TextField
            label="Code"
            placeholder="Enter Room Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            helperText={errorCode}
            variant="outlined"
          />
        </Grid>
        <Grid>
          <Button variant="contained" color="primary" onClick={joinButton}>
            Join
          </Button>

          <Button variant="contained" color="secondary" component={Link} to="/">
            Back
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
}

export default JoinRoomPage;
