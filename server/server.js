const authenticateToken = require( './middlewares/authenticateToken.js') ;
const express = require ('express');
const  sqlite3 = require('sqlite3');
const {open}= require('sqlite') // Import the SQLite package
const bcrypt = require('bcrypt');
const jwt = require( 'jsonwebtoken');
const cors = require ('cors'); // Import the CORS package
const app = express();
app.use(cors()); // Use CORS middleware
app.use(express.json()); // Parse JSON request bodies
const port = 5000;
const path = require('path');
const dbPath = path.join(__dirname, 'chatapp.db'); // Path to the SQLite database file
const Cookies  = require('js-cookie')
const http = require('http');
const server = http.createServer(app);

let db

const initializeServerandDb = async () => {
    try {
      db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
      })

      await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE,
          password TEXT,
          name TEXT
        );
    
        CREATE TABLE IF NOT EXISTS chats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chat_id TEXT,
          chat_name TEXT,
          is_group BOOLEAN
        );
    
        CREATE TABLE IF NOT EXISTS chat_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id TEXT,
        user_id INTEGER,
        FOREIGN KEY(chat_id) REFERENCES chats(chat_id),
        FOREIGN KEY(user_id) REFERENCES users(id)
        );

    
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chat_id TEXT,
          sender_id INTEGER,
          chat_message TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (chat_id) REFERENCES chats(chat_id),
          FOREIGN KEY (sender_id) REFERENCES users(id)
        );
        
        CREATE TABLE IF NOT EXISTS ONLINE_USERS (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          session_id TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
        
        CREATE TABLE IF NOT EXISTS SOCKETS(
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT,
          socket_id TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id)
          );`

        
      );

      console.log('Server and DB initialized');
      
      server.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`); //listening to the server
      });

      
      
    } catch (error) {
      console.log(`db error:${error.message}`)
      process.exit(1)
    }
  }
  
  initializeServerandDb(); // Initialize the server and database

  const io = require('socket.io')(server,{
    cors:{
      origin:'http://localhost:5173', // Replace with your client URL
      methods:['GET','POST']
    }
  }); // Initialize Socket.IO with the server

  let currentSocket
  io.on('connect', async(socket) => {
    currentSocket=socket.id
    console.log('User connected:', socket.id);
    console.log(`Total connections: ${io.engine.clientsCount}`);


    // Join room (public or private)
  socket.on("join-room", ( chatRoomId ) => {
    socket.join(chatRoomId);
    console.log(`Socket ${socket.id} joined room ${chatRoomId}`);

  });

  // Leave room
  socket.on("leave-room", ({ chatRoomId }) => {
    socket.leave(chatRoomId);
    console.log(`Socket ${socket.id} left room ${chatRoomId}`);
  });

  // Handle message
  socket.on("send-message", async (messageData, isCurrentRoomGroup) => {
    const { chatRoomId, senderId, messageText } = messageData;
    // Save message to DB
    await db.run(
      `INSERT INTO messages (chat_id, sender_id, chat_message) VALUES (?, ?, ?)`,
      [chatRoomId, senderId, messageText]
    );

    // Broadcast to the room
    if (isCurrentRoomGroup) {
      socket.broadcast.to(chatRoomId).emit('receive-message', {
        senderId,
        messageText,
        timestamp: new Date().toISOString(),
      });
    } else {
      socket.to(chatRoomId).emit('receive-message', {
        senderId,
        messageText,
        timestamp: new Date().toISOString(),
      });
    }
    
  });

  // Cleanup
  socket.on("disconnect", async () => {
    console.log(`User disconnected: ${socket.id}`);
    await db.run("DELETE FROM sockets WHERE socket_id = ?", [socket.id]);
  });
});
  

app.get('/hello', (req, res) => { 
  res.json({message:'Hello from the backend!'});
});
//register user
app.post('/register', async (req, res) => {
    const { username, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
    try {
      const isUserIdTaken = await db.get('SELECT * FROM users WHERE username = ?', [username]);
      const usernameTrimmed = username.trim();
      const passwordTrimmed = password.trim();
      const nameTrimmed = name.trim();
      if (!usernameTrimmed || !passwordTrimmed || !nameTrimmed) {
        return res.status(400).json({ message: 'Please enter details correctly' });
      }
      if (!isUserIdTaken) {
      await db.run('INSERT INTO users (username, password, name) VALUES (?, ?, ?)', [username, hashedPassword, name]);
      const registerdUser = await db.get('SELECT * FROM users WHERE username = ?', [username]);
      if (registerdUser){
        res.status(200).json({message: 'User registered successfully' });
      }
      else{
        res.status(400).json({ message: 'Registration Unsuccessful. Try Again' });
      }
      }
      else{
        res.status(409).json({ message: 'Username already taken' });
      }
    }
    catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

//login user
  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      const usernameTrimmed = username.trim();
      const passwordTrimmed = password.trim();
      if (!usernameTrimmed || !passwordTrimmed) {
        return res.status(400).json({ message: 'Please enter details correctly' });
      }

      const isValidUser = await db.get('SELECT * FROM users WHERE username = ?', [username]);
      if (isValidUser) {
      const isPasswordValid = await bcrypt.compare(password, isValidUser.password);
      if (isPasswordValid) {
        const token = jwt.sign({ id: isValidUser.id }, 'secret_key', { expiresIn: '7d' });
        res.status(200).json({ jwt_token: token, message: 'Login successful' });
      }else{
        res.status(401).json({ message: 'Invalid password' });
      }
      }
      else{
        res.status(400).json({ message: 'Invalid Username or Password' });
      }
    }
    catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  //chat-home

  app.get('/chat-home', authenticateToken, async (req, res) => {
    const userId = req.userId;
    try {
        const users= await db.all('SELECT * FROM users');
        const publicChatRooms = await db.all('SELECT * FROM chats where is_group = true');
        res.status(200).json({users, loggedInUserId: userId, publicChatRooms});
      } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  )

  app.post('/connect-socket', authenticateToken, async(req, res) =>{
    const userId = req.userId;
    const isSocketAssigned = await db.get(`select * from sockets where user_id=${userId}`)
    if(!isSocketAssigned){
      try{
        await db.run('insert into sockets (user_id, socket_id) values (?,?)', [userId, currentSocket])
        res.status(200).json({message: 'Socket Connected'})
      }
      catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
    else{
      try{
        await db.run(
          `UPDATE sockets SET socket_id = ? WHERE user_id = ?`,
          [currentSocket, userId]
        );
      }
      catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
      }
      
    }
  })

  app.delete('/disconnect-socket', authenticateToken, async(req, res)=>{
    const userId =req.userId;
    try{
      await db.run('delete from sockets where user_id=?',[userId])
      res.status(200).json({message:'Socket Disconnected'})
    }
    catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
    
  })

  app.post('/create-public-room', authenticateToken, async (req, res) => {
    const { id, name, isGroup } = req.body;
    const userId = req.userId;
    const isRoomCreated = await db.get('SELECT * FROM chats WHERE chat_name = ?', [name]);
    
    try {
      if (!isRoomCreated) {
      await db.run('INSERT INTO chats (chat_id, chat_name, is_group) VALUES (?, ?, ?)', [id, name, isGroup]);
      const chatRooms = await db.all('SELECT * FROM chats where is_group = true');
      res.status(200).json({ message: 'Chat room created successfully', chatRooms});
      }
      else{
        const chatRooms = await db.all('SELECT * FROM chats where is_group = true');
      res.status(200).json({ message: 'Opening Chat Room', chatRooms});
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })

  app.post('/create-get-private-room', authenticateToken, async (req, res) => {
    const {id, isGroup } = req.body;
    const isRoomCreated = await db.get('SELECT * FROM chats WHERE chat_id = ?', [id]);
    try {
      if (!isRoomCreated) {
      await db.run('INSERT INTO chats (chat_id, is_group) VALUES (?,?)', [id, isGroup]);
      const selectedChatRoom = await db.get('SELECT * FROM chats where chat_id = ?', [id]);
      res.status(200).json({ message: 'Chat room created successfully. Opening Chat Room', selectedChatRoom});
      }
      else{
      const selectedChatRoom = await db.get('SELECT * FROM chats where chat_id = ?', [id]);
      res.status(200).json({ message: 'Opening chat room', selectedChatRoom});
      }
      
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })
  

  app.get('/get-messages', authenticateToken, async (req, res) => {
    const {room}=req.query;
    console.log(room)
    try {
      const messageQuery=`SELECT * FROM messages WHERE chat_id = '${room}';`;
      const chatRoomMessages = await db.all(messageQuery);
      res.status(200).json({ message: 'message fetch successful', chatRoomMessages});
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  })