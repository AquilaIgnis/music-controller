import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import CreateRoomPage from './components/CreateRoomPage';
import JoinRoomPage from './components/JoinRomPage';
import HomePage from './components/HomePage';
import Room from './components/Room';
import './css/create.css';

import { useEffect, useState } from 'react';

function App() {
  const [roomCode, setRoomCode] = useState<string | null>();

  useEffect(() => {
    fetch('/api/user-in-room/', {
      credentials: 'include',
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        console.log('User in room response:', data);
        setRoomCode(data.code);
      })
      .catch((err) => {
        console.error('error fetching backend', err);
      });
  }, []);

  return (
    <div className="center">
      <Router>
        <Routes>
          {roomCode ? (
            <>
              <Route path="/" element={<Navigate to={`/room/${roomCode}`} replace />} />
              <Route path="/home" element={<Navigate to={`/room/${roomCode}`} replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<HomePage />} />
              <Route path="/home" element={<HomePage />} />
            </>
          )}

          <Route path="/join" element={<JoinRoomPage />} />
          <Route
            path="/create"
            element={<CreateRoomPage votes_to_skip={2} update={false} allowPause={true} roomCode={null} />}
          />
          <Route path="/room/:roomCode" element={<Room />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
