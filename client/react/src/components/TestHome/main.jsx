import Cookies from 'js-cookie'
import {Component} from 'react'
import{Navigate} from 'react-router-dom'
import ChatWindow from '../ChatWindow/main'
import styles from './TestHome.module.css'
import Logout from '../Logout/main.jsx'
import { v4 as uuidv4 } from 'uuid';
import socket from '../Socket/socket.js'

const apiStatusCodes = {
    initial: 'INITIAL',
    success: 'SUCCESS',
    failure: 'FAILURE',
    inProgress: 'IN_PROGRESS',
  }


class TestHome extends Component{
    state={loggedInUserId:'',
        apiStatus: apiStatusCodes.initial,
        users: [],
        messageText:'',
        messages:[],
        publicChatRooms: [],
        chatRoomName:'',
        chatRoomMembers:[],
        errorMessageText:'',
        currentChatRoomId: '',
        currentChatRoomName: '',
        isCurrentRoomGroup:''}

    componentDidMount(){
        this.fetchChatHome()
    }


    fetchChatHome = async () => {
    this.setState({apiStatus: apiStatusCodes.inProgress})
    const token = Cookies.get('jwt_token')
    const url = 'http://localhost:5000/chat-home'
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    }
    const response = await fetch(url, options)
    const data = await response.json()
    if (response.ok) {
      const {users, publicChatRooms, loggedInUserId} = data
      const otherUsers=users.filter(user=> user.id!==loggedInUserId)
      this.setState({users:otherUsers, loggedInUserId, apiStatus: apiStatusCodes.success, publicChatRooms})
    } else{
      const {message} = data
      this.setState({
        errorMessageText: message,
        apiStatus: apiStatusCodes.failure,
      })
    }}

    convertChatRoomsCase = chatRooms => {
        return chatRooms.map(room => {
            return {id:room.chat_id,
                name: room.chat_name,
                isGroup: room.is_group}})}

    chatRoomNameInput = event => {
        const {value} = event.target
        this.setState({chatRoomName: value})
    }

    createPublicRoom = async() => {
        const {chatRoomName} = this.state
        if (chatRoomName.trim() === '') {
            alert('Please enter a valid public room name')
            return
        }
        else{
            const newChatRoom={id:`public_${uuidv4()}`, name: chatRoomName, isGroup: true}
            const token = Cookies.get('jwt_token')
            const url = 'http://localhost:5000/create-public-room'
            const options = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newChatRoom),
            }
            const response= await fetch(url, options)
            if (response.ok){
                const data = await response.json()
                const {message, chatRooms} = data
                this.setState({chatRoomName: '', publicChatRooms:chatRooms})
                alert(message)
            }
            else{
                const data = await response.json()
                const {message} = data
                this.setState({chatRoomName: '', errorMessageText: message})
            }
        }
    }

    createUniquePrivateChatRoomName=(a,b)=>{
      return [a, b].sort().join('_')
    }

    createGetPrivateRoom = async(event) => {
        const privateChatUserId = event.target.id
        const {loggedInUserId}=this.state
        const uniqueChatName = this.createUniquePrivateChatRoomName(Number(privateChatUserId), Number(loggedInUserId))
            const newChatRoom={id: `private_${uniqueChatName}`, isGroup:false}
            const token = Cookies.get('jwt_token')
            const url = 'http://localhost:5000/create-get-private-room'
            const options = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newChatRoom),
            }
            const response= await fetch(url, options)
            if (response.ok){
                const data = await response.json()
                const {selectedChatRoom} = data
                const selectedPrivateRoomId=selectedChatRoom.chat_id
                const selectedPrivateRoomName=event.target.innerText
                socket.emit('join-room', selectedPrivateRoomId)
                this.setState({currentChatRoomId:selectedPrivateRoomId, currentChatRoomName:selectedPrivateRoomName, isCurrentRoomGroup:false})
            }
            else{
                this.setState({chatRoomName: ''})
            }
        }
        

    selectRoom = (event) => {
        const currentChatRoomId = event.target.id
        const currentChatRoomName = event.target.innerText
        this.setState({currentChatRoomId, currentChatRoomName, isCurrentRoomGroup:true})
        socket.emit('join-room', currentChatRoomId)
    }
    
    render(){
    const {users, publicChatRooms, chatRoomName, currentChatRoomId, loggedInUserId, currentChatRoomName, isCurrentRoomGroup} = this.state
    const convertedPublicChatRooms = this.convertChatRoomsCase(publicChatRooms)
    const token = Cookies.get('jwt_token')
    if (token === undefined) {
        return <Navigate to="/login" replace={true}/>
    }
    return (
        <div className={styles.chatApp}>
          <header className={styles.chatHeader}>
            <h1>Chat App</h1>
            <Logout />
          </header>
          <div className={styles.chatBody}>
            <aside className={styles.chatSidebar}>
              <section className={styles.usersSection}>
                <h2>Contacts</h2>
                <ul className={styles.userList}>
                  {users.map(user => (
                    <li key={user.id} id={user.id} onClick={this.createGetPrivateRoom}>
                      {user.name}
                    </li>
                  ))}
                </ul>
                <h2>Online Users</h2>
                <ul className={styles.userList}>
                  {users.map(user => (
                    <li key={user.id} id={user.id} onClick={this.createGetPrivateRoom}>
                      {user.name}
                    </li>
                  ))}
                </ul>
              </section>
      
              <section className={styles.roomsSection}>
                <h2>Public Rooms</h2>
                <ul className={styles.roomList}>
                  {convertedPublicChatRooms.map(room => (
                    <li key={room.id} id={room.id} onClick={this.selectRoom}>
                      {room.name}
                    </li>
                  ))}
                </ul>
                <input
                  className={styles.roomInput}
                  type="text"
                  value={chatRoomName}
                  onChange={this.chatRoomNameInput}
                  placeholder="New room name..."
                />
                <button className={styles.createRoomButton} onClick={this.createPublicRoom}>
                  Create Room
                </button>
              </section>
            </aside>
            <main className={styles.chatMain}>
              <ChatWindow currentChatRoomId={currentChatRoomId} currentChatRoomName={currentChatRoomName} loggedInUserId={loggedInUserId} isCurrentRoomGroup={isCurrentRoomGroup}/>
            </main>
          </div>
        </div>
      )
      
}
}

export default TestHome