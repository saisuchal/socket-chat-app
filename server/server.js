const express = require('express');
const sqlite3=require('sqlite3');
const sqlite=require('sqlite');
const { open } = require('sqlite'); // Import the SQLite package
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const app = express();
const cors = require('cors'); // Import the CORS package
app.use(cors()); // Use CORS middleware
app.use(express.json()); // Parse JSON request bodies

const http = require('http');
const server = http.createServer(app); //to avoid using seperate servers for express and socket.io
const port = 5000;
const path = require('path');
const dbPath = path.join(__dirname, 'chatapp.db'); // Path to the SQLite database file

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
          chat_name TEXT,
          is_group BOOLEAN
        );
    
        CREATE TABLE IF NOT EXISTS chat_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chat_id INTEGER,
          user_id INTEGER
        );
    
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chat_id INTEGER,
          sender_id INTEGER,
          message TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log('Server and DB initialized');
      
      server.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`); //listening to the server
      });

      
      
    } catch (error) {
      console.log(`db error:${error.Message}`)
      process.exit(1)
    }
  }
  
  initializeServerandDb(); // Initialize the server and database

  
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  }
});

io.on('connection', (socket) => {
    console.log(socket.id); // Log the socket ID
    socket.on('send_message', (msg) => {
      console.log(msg); // Log the message received from the client
      io.emit('receive_message', msg); // Emit the message to all connected clients
    });
});

app.get('/api/hello', (req, res) => { 
  res.json({message:'Hello from the backend!'});
});
  