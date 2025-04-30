import { useEffect, useState, useRef } from 'react';
import {io} from 'socket.io-client';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);

  const socket = useRef(null);

  useEffect(() => {
    socket.current = io('http://localhost:5000'); // Connect to the server

    socket.current.on('connect', () => {
      console.log('Connected to server');
    });

    socket.current.on('receive_message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.current.disconnect();
    };
  }, []);
  // Function to handle message submission
  

  const displayMessage = (e) => {
    e.preventDefault();
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    if (message) {
      socket.current.emit('send_message', message);
      input.value = '';
    }
  };

  return (
    <div>
      <h1>Vite + React + Node.js chat</h1>
      <div id="chat-window">
      <ul id="chat-messages">
  {messages.map((msg, index) => (
    <li key={index}>{msg}</li>
  ))}
</ul>
      </div>
      <form onSubmit={displayMessage}>
      <input type="text" id="message-input" placeholder="Type your message here..."/>
      <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default App;