import { useEffect, useState, useRef } from 'react';
import socket from '../Socket/socket';
import styles from './ChatWindow.module.css';
import Cookies from 'js-cookie';

const ChatWindow = (props) => {
  const { currentChatRoomId, currentChatRoomName, loggedInUserId, isCurrentRoomGroup } = props;
  const [messages, setMessages] = useState([]);
  const inputMessageRef = useRef(''); // Use ref instead of state for inputMessage
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (currentChatRoomId) {
      (async function () {
        const token = Cookies.get('jwt_token');
        const messagesUrl = `http://localhost:5000/get-messages?room=${currentChatRoomId}`;
        const options = {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        const response = await fetch(messagesUrl, options);
        const data = await response.json();
        const { chatRoomMessages } = data;
        const fetchedMessages = handleFetchedMessages(chatRoomMessages);
        setMessages(fetchedMessages);
      })();

      socket.emit('join-room', currentChatRoomId);
      socket.on('receive-message', (message) => {
        setMessages((prev) => [...prev, message]);
      });
      socket.on('client-typing', handleClientTyping);
    }

    return () => {
      socket.off('receive-message');
      socket.off('client-typing', handleClientTyping);
    };
  }, [currentChatRoomId]);

  const handleClientTyping = (typingStatusObject) => {
    const { typingStatus } = typingStatusObject;
    const typingIndicatorEl = document.getElementById('typing-indicator');
    if (typingIndicatorEl) {
      typingIndicatorEl.style.display = typingStatus ? 'block' : 'none';
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  const handleSendMessage = () => {
    const inputMessage = inputMessageRef.current.value.trim(); // Access the value from the ref
    if (inputMessage && currentChatRoomId) {
      const message = {
        senderId: loggedInUserId,
        chatRoomId: currentChatRoomId,
        messageText: inputMessage,
        timestamp: new Date().toISOString(),
      };
      socket.emit('send-message', message, isCurrentRoomGroup);
      setMessages((prev) => [...prev, message]);
      inputMessageRef.current.value = ''; // Clear the input field
    }
  };

  const handleFetchedMessages = (messages) =>
    messages.map((messageData) => ({
      senderId: messageData.sender_id,
      chatRoomId: messageData.chat_id,
      messageText: messageData.chat_message,
      timestamp: messageData.timestamp,
    }));

  const emitTypingStatus = (status) => {
    const typingStatusObject = {
      senderId: loggedInUserId,
      typingStatus: status,
      chatRoomId: currentChatRoomId,
    };
    socket.emit('typing', typingStatusObject, isCurrentRoomGroup);
  };

  return (
    <div className={styles.chatContainer}>
      <h2 className={styles.roomTitle}>
        {currentChatRoomName || 'Select a chat room'}<span id="typing-indicator" style={{ display: 'none', fontSize: '14px', fontWeight: '400' }}>
          {isCurrentRoomGroup ? 'someone is typing...' : 'is typing...'}
        </span>
      </h2>
      <div className={styles.messageList}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`${styles.messageItem} ${
              msg.senderId === loggedInUserId ? styles.sent : styles.received
            }`}
            ref={messagesEndRef}
          >
            <div className={styles.messageBubble}>
              <div className={styles.messageText}>{msg.messageText}</div>
              <div className={styles.messageMeta}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
      </div>
      {currentChatRoomName !== '' && (
        <div className={styles.messageInputWrapper}>
          <input
            type="text"
            ref={inputMessageRef} // Attach the ref to the input field
            onFocus={() => emitTypingStatus(true)}
            onBlur={() => emitTypingStatus(false)}
            className={styles.messageInput}
            placeholder="Type a message..."
          />
          <button onClick={handleSendMessage} className={styles.sendButton}>
            Send
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;