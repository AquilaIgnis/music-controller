import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import ButtonGroup from '@mui/material/ButtonGroup';
import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <Grid container spacing={5} alignContent="center" alignItems="center">
      <Grid alignItems="center">
        <Typography variant="h3">House Party</Typography>

        <Grid alignContent="center">
          <ButtonGroup disableElevation variant="contained" color="primary">
            <Button color="primary" component={Link} to="/join">
              Join a Room
            </Button>
            <Button color="secondary" component={Link} to="/create">
              Create Room
            </Button>
          </ButtonGroup>
        </Grid>
      </Grid>
    </Grid>
  );
}

export default HomePage;
