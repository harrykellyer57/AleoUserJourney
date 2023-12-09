/*
Filename: sophisticatedCode.js

Description: 
This code is a sophisticated implementation of a web-based chat application. It includes features like user authentication, real-time messaging, and chat room management. The code utilizes various JavaScript libraries and frameworks such as Socket.IO, Express.js, and MongoDB for a robust and efficient chat application.

Note: 
In order to execute this code successfully, please make sure to install the required packages by running the following command in your terminal:
npm install express socket.io mongoose bcrypt

*/

// Import required modules
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Configure Express.js App
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Connect to MongoDB
mongoose
  .connect('mongodb://localhost/chat_app_db', { useNewUrlParser: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

// Define MongoDB Schema
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: { type: String },
});

const User = mongoose.model('User', userSchema);

// Set up Express.js middleware
app.use(express.json());

// API route for user registration
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    return res.status(200).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('User registration failed', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// API route for user login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check password validity
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    return res.status(200).json({ message: 'User logged in successfully' });
  } catch (err) {
    console.error('User login failed', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Implement Socket.IO for real-time messaging
io.on('connection', (socket) => {
  console.log('New client connected');

  // Handle join room event
  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
  });

  // Handle leave room event
  socket.on('leave_room', (room) => {
    socket.leave(room);
    console.log(`Socket ${socket.id} left room ${room}`);
  });

  // Handle chat message event
  socket.on('chat_message', (data) => {
    const { room, message } = data;

    // Emit the message to the room
    socket.to(room).emit('message_received', { message });
    console.log(`Message received in room ${room}: ${message}`);
  });

  // Handle disconnect event
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});