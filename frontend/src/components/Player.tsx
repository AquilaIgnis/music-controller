import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import { PlayArrow, SkipNext, Pause } from '@mui/icons-material';
import type { PlayerProps } from '../interfaces';
import AlertComponent from './AlertComponent';
import { useState } from 'react';

function Player(props: PlayerProps) {
  const [alert, setAlert] = useState<string | null>(null);
  let songProgress: number = (props.time / props.duration) * 100;

  function pause() {
    const requestOptions: RequestInit = {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    };

    fetch('/spotify/pause', requestOptions)
      .then((data) => data.json())
      .then((response) => {
        if (response.error) {
          console.error('you got loicence to pause ?:', response);
          setAlert(response.error.message);
        }
        setTimeout(() => setAlert(null), 3000);
      });
  }

  function play() {
    const requestOptions: RequestInit = {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    };

    fetch('/spotify/play', requestOptions)
      .then((data) => data.json())
      .then((response) => {
        if (response.error) {
          console.error('you got loicence to play ?:', response);
          setAlert(response.error.message);
        }
        setTimeout(() => setAlert(null), 3000);
      });
  }

  return (
    <>
      <Card>
        <Grid container alignItems="center">
          <Grid alignItems="center" size={4}>
            <img src={props.image_url} height="100%" width="100%" />
          </Grid>
          <Grid alignItems="center" size={8}>
            <Typography component="h5" variant="h5">
              {props.title}
            </Typography>

            <Typography color="textSecondary" variant="subtitle1">
              {props.artist}
            </Typography>
            <div>
              <IconButton
                onClick={() => {
                  props.is_playing ? pause() : play();
                }}
              >
                {props.is_playing ? <Pause /> : <PlayArrow />}
              </IconButton>
              <IconButton>
                <SkipNext />
              </IconButton>
            </div>
          </Grid>
        </Grid>
        <LinearProgress variant="determinate" value={songProgress} color="primary" />
      </Card>
      {props.id ? (
        <iframe
          data-testid="embed-iframe"
          src={`https://open.spotify.com/embed/track/${props.id}?utm_source=generator`}
          width="100%"
          height="152"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      ) : null}
      {alert ? <AlertComponent message={alert} severity="error" /> : null}
    </>
  );
}

export default Player;
