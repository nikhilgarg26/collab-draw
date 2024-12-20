import Forms from './components/Forms'
import { Route, Routes } from 'react-router-dom'
import './App.css'
import RoomPage from './pages/RoomPage'
import { useEffect, useState } from 'react';
import io from "socket.io-client";



const server = "wss://collab-draw-1.onrender.com";

const socket = io(server);

const App = () => {

  useEffect(() => {
    // Socket.io connection
    socket.on('connect', () => {
      console.log('Connected to the server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from the server');
    });

    // Cleanup the socket connection on unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, []);

  const [user, setUser] = useState(null);

  useEffect(() => {
    socket.on("userIsJoined", (data) => {
      if (data.success) {
        console.log("userJoined");
      } else {
        console.log("userJoined error");
      }
    });

  }, []);

  const uuid = () => {
    let S4 = () => {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (
      S4() +
      S4() +
      "-" +
      S4() +
      "-" +
      S4() +
      "-" +
      S4() +
      "-" +
      S4() +
      S4() +
      S4()
    );
  };


  return (
    <div className='App'>
      <Routes>
        <Route path='/' element={<Forms uuid={uuid}
          socket={socket}
          setUser={setUser}></Forms >}></Route>
        <Route path='/:roomId' element={<RoomPage user={user} socket={socket}></RoomPage>}></Route>
      </Routes>
    </div>
  )
}

export default App
