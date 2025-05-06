import { useEffect, useState, useRef } from 'react'
import socket from '../Socket/socket'
import styles from './ChatWindow.module.css'
import Cookies from 'js-cookie'

const ChatWindow = (props) => {
  const {currentChatRoomId, currentChatRoomName, loggedInUserId, isCurrentRoomGroup}=props
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (currentChatRoomId) {
      (async function() {
        const token = Cookies.get('jwt_token')
        console.log(currentChatRoomId)
        const messagesUrl = `http://localhost:5000/get-messages?room=${currentChatRoomId}`
        const options = {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
        const response = await fetch(messagesUrl, options)
        const data = await response.json()
        const {chatRoomMessages}=data
        const fetchedMessages = handleFetchedMessages(chatRoomMessages)
        console.log(fetchedMessages)
        setMessages(fetchedMessages)
      })()
      
      socket.emit('join-room', currentChatRoomId)
      socket.on('receive-message', (message) => {
        setMessages((prev) => [...prev, message])
      })
      
    }

    return () => {
      socket.off('receive-message')
    }
  }, [currentChatRoomId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = () => {
    console.log(inputMessage)
    if (inputMessage.trim() && currentChatRoomId) {
      const message = {
        senderId: loggedInUserId,
        chatRoomId: currentChatRoomId,
        messageText: inputMessage,
        timestamp: new Date().toISOString(), 
      }
      socket.emit('send-message', message, isCurrentRoomGroup)
      setMessages((prev) => [...prev, message])
      setInputMessage('')
    }
  }

  const handleFetchedMessages = (messages)=>
    messages.map(messageData=>({
      senderId: messageData.sender_id,
        chatRoomId: messageData.chat_id,
        messageText: messageData.chat_message,
        timestamp: messageData.timestamp, 
    }))

  const MessageList = () => {
    console.log(messages)
    const messageLength = messages.length
    return messageLength===0 ? (<div>
      <p>Start Chatting!</p>
    </div>) : <div className={styles.messageList} ref={messagesEndRef}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`${styles.messageItem} ${
              msg.senderId === loggedInUserId ? styles.sent : styles.received
            }`}
          >
            <div className={styles.messageBubble}>
              <div className={styles.messageText}>{msg.messageText}</div>
              <div className={styles.messageMeta}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
    </div>}

    

  const messageInputChange=(e)=>{
    const message=e.target.value
    setInputMessage(prevMessages => [...prevMessages, message])
    
  }

  return (
    <div className={styles.chatContainer}>
      <h2 className={styles.roomTitle}>{currentChatRoomName || 'Select a chat room'}</h2>
      <MessageList/>
      <div className={styles.messageInputWrapper}>
        <input
          type="text"
          value={inputMessage}
          onChange={messageInputChange}
          className={styles.messageInput}
          placeholder="Type a message..."
        />
        <button onClick={handleSendMessage} className={styles.sendButton}>Send</button>
      </div>
    </div>
  )
}

export default ChatWindow
