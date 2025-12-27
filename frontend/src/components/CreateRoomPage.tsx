import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import AlertComponent from './AlertComponent';

interface PassedProps {
  votes_to_skip: number;
  update: boolean;
  allowPause: boolean;
  roomCode: string | null;
}

function CreateRoomPage(props: PassedProps) {
  //default props destructured
  const { votes_to_skip = 2, allowPause = false, update = false, roomCode = null } = props;

  const [votes, setvotes] = useState<number>(votes_to_skip);
  let guestCanPause = useRef<boolean>(allowPause);
  const navigate = useNavigate();
  const [responseMessage, setResponseMessage] = useState<'Error' | 'Succsess' | null>(null);

  //helper funcs
  function handleGuestCanPause(e: React.ChangeEvent<HTMLInputElement>) {
    guestCanPause.current = e.target.value === 'true' ? true : false;
  }

  function handleVotesToSkip(e: React.ChangeEvent<HTMLInputElement>) {
    setvotes(() => parseInt(e.target.value, 10) || 2);
  }

  function handleCreateRoom() {
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        votes_to_skip: votes,
        guest_can_pause: guestCanPause.current,
      }),
    };

    fetch('/api/create-room/', requestOptions).then((response) =>
      response.json().then((data) => {
        navigate('/room/' + data.code);
        console.log('data:', data);
      }),
    );

    console.log('guestCanPause:', guestCanPause);
    console.log('votes:', votes);
  }

  function handleUpdateRoom() {
    const requestOptions: RequestInit = {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        votes_to_skip: votes,
        guest_can_pause: guestCanPause.current,
        code: roomCode,
      }),
    };

    fetch('/api/update-room/', requestOptions)
      .then((response) => {
        if (response.ok) {
          setResponseMessage('Succsess');
        } else {
          setResponseMessage('Error');
        }
      })
      .catch((err) => {
        setResponseMessage('Error');

        console.error('error on HandleUpdateRoom', err);
      });

    console.log('## UpdateRoomBUtton##');
    console.log('guestCanPause:', guestCanPause);
    console.log('votes:', votes);
    console.log('roomCode:', roomCode);
    console.log('Message:', responseMessage);

    return <Grid size={{ xs: 12 }} alignItems="center"></Grid>;
  }

  useEffect(() => {
    if (responseMessage !== null) {
      console.log('Message set to:', responseMessage);

      // Set timer to clear message after 2 seconds
      const timer = setTimeout(() => {
        setResponseMessage(null);
      }, 2000);

      // Cleanup function - clears timer if component unmounts or message changes
      return () => {
        clearTimeout(timer);
      };
    }
  }, [responseMessage]);

  const title = update ? 'Update Room ' : 'Create Room';

  function renderCreateButton() {
    return (
      <Grid container spacing={1}>
        <Grid size={{ xs: 12 }} alignItems="center">
          <Button color="primary" variant="contained" onClick={handleCreateRoom}>
            Create Room
          </Button>
        </Grid>

        <Grid size={{ xs: 12 }} alignItems="center">
          <Button color="secondary" variant="contained" component={Link} to="/">
            Back
          </Button>
        </Grid>
      </Grid>
    );
  }

  function renderUpdateButton() {
    return (
      <Grid container spacing={1}>
        <Grid size={{ xs: 12 }} alignItems="center">
          <Button color="primary" variant="contained" onClick={handleUpdateRoom}>
            Update Room
          </Button>
        </Grid>
      </Grid>
    );
  }

  return (
    <>
      <Grid container spacing={1}>
        <Grid size={{ xs: 12 }} alignItems="center"></Grid>
        <Typography component="h4" variant="h4">
          {title}
        </Typography>

        <Grid size={{ xs: 12 }} alignItems="center">
          <FormControl component="fieldset">
            <FormHelperText sx={{ textAlign: 'center' }}>Guest Control Of Playback State</FormHelperText>
            <RadioGroup row defaultValue={guestCanPause.current} onChange={handleGuestCanPause}>
              <FormControlLabel
                value="true"
                control={<Radio color="primary" />}
                label="Play/Pause"
                labelPlacement="bottom"
              />

              <FormControlLabel
                value="false"
                control={<Radio color="secondary" />}
                label="No Control"
                labelPlacement="bottom"
              />
            </RadioGroup>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12 }} alignItems="center">
          <FormControl>
            <TextField required={true} type="number" defaultValue={votes} onChange={handleVotesToSkip} />
            <FormHelperText sx={{ textAlign: 'center' }}>Votes Required to Skip Song</FormHelperText>
          </FormControl>
        </Grid>

        {update ? renderUpdateButton() : renderCreateButton()}
        {responseMessage === 'Succsess' ? <AlertComponent message="Updated settings" severity="ok" /> : null}
        {responseMessage === 'Error' ? <AlertComponent message="Error from server" severity="error" /> : null}
      </Grid>
    </>
  );
}

export default CreateRoomPage;
