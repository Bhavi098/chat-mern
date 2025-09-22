require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const Message = require('./models/Message');
const User = require('./models/User');
const { getBotReply } = require('./utils/chatbot');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
}).then(() => console.log('Mongo connected'))
  .catch(err => console.error('Mongo error', err));

const io = new Server(server, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  console.log('Socket connected', socket.id);

  // join a room (for room chat); clients may send userId for mapping
  socket.on('joinRoom', (room) => {
    socket.join(room || 'global');
    console.log(`${socket.id} joined ${room || 'global'}`);
  });

  // client sends message: { token(optional), text, to(optional), fromId(optional), room(optional) }
  socket.on('sendMessage', async (payload) => {
    try {
      const { text, fromId, to, room } = payload;
      // save message
      const msg = new Message({
        from: fromId,
        to: to || null,
        text,
        isBot: false
      });
      await msg.save();
      const populated = await msg.populate('from', 'name');

      // emit to room or broadcast
      if (room) {
        io.to(room).emit('newMessage', populated);
      } else {
        io.emit('newMessage', populated);
      }

      // If the text triggers bot response, generate reply
      // Simple rule: if message mentions '@bot' or contains 'bot' or user asks 'help', auto-reply.
      const lower = (text || '').toLowerCase();
      if (lower.includes('bot') || lower.includes('@bot') || lower.includes('help') || lower.includes('assistant')) {
        const replyText = getBotReply(text);
        const botMsg = new Message({ from: null, text: replyText, isBot: true }); // from:null means bot
        await botMsg.save();
        io.emit('newMessage', {
          _id: botMsg._id,
          from: { _id: null, name: 'Assistant Bot' },
          text: botMsg.text,
          isBot: true,
          createdAt: botMsg.createdAt
        });
      }
    } catch (err) {
      console.error('sendMessage error', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected', socket.id);
  });
});

server.listen(PORT, () => console.log('Server running on', PORT));
