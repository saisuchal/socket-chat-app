const express = require('express');
const sqlite3=require('sqlite3');
const sqlite=require('sqlite');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const app = express();
const port = 5000;
const cors = require('cors'); // Import the CORS package

app.use(cors({
    origin: '*', // Allow requests from the frontend
}))


app.get('/api/hello', (req, res) => { 
  res.json({message:'Hello from the backend!'});
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});