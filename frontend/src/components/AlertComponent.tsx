import * as React from 'react';
import { useState } from 'react';
import Snackbar, { type SnackbarCloseReason } from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import '../css/AlertComponent.css';

interface IncomingProps {
  message: string;
  severity: 'ok' | 'error';
}

function AlertComponent(props: IncomingProps) {
  const { message, severity } = props;

  const [open, setOpen] = useState(true);

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  if (severity === 'ok') {
    return (
      <div className="AlertComponent">
        <Snackbar
          open={open}
          autoHideDuration={6000}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleClose}
            severity="success"
            variant="filled"
            sx={{
              width: '100%',
            }}
          >
            {message}
          </Alert>
        </Snackbar>
      </div>
    );
  } else if (severity === 'error') {
    return (
      <div>
        <Snackbar
          open={open}
          autoHideDuration={6000}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          onClose={handleClose}
        >
          <Alert onClose={handleClose} severity="error" variant="filled" sx={{ width: '100%' }}>
            {message}
          </Alert>
        </Snackbar>
      </div>
    );
  }
}
export default AlertComponent;
