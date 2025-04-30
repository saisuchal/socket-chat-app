import { useEffect, useState } from 'react';

function App() {
  const [senderMessage, setSenderMessage] = useState('');
  const [receiverMessage, setReceiverMessage] = useState('');

  useEffect(() => {
    // Fetch data from backend API
    fetch('http://localhost:5000/api/hello')
    .then(response=>response.json())
    .then(data => {
      // Update the state with the message from the backend
      setReceiverMessage(data.message);
    })
  }, [senderMessage]);

  const displayMessage = (e) => {
    e.preventDefault();
    const input = document.getElementById('message-input');
    const newMessage = input.value;
    console.log(newMessage)
    setSenderMessage(newMessage);
    input.value = '';
  }

  return (
    <div>
      <h1>Vite + React + Node.js chat</h1>
      <div id="chat-window">
        <ul>
          <li>{receiverMessage}</li>
          <li>{senderMessage}</li>
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