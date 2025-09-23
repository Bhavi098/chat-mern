// require('dotenv').config();
// const express = require('express');
// const http = require('http');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const { Server } = require('socket.io');

// const authRoutes = require('./routes/auth');
// const messageRoutes = require('./routes/messages');
// const Message = require('./models/Message');
// const User = require('./models/User');
// const { getBotReply } = require('./utils/chatbot');

// const app = express();
// const server = http.createServer(app);

// app.use(cors());
// app.use(express.json());

// app.use('/api/auth', authRoutes);
// app.use('/api/messages', messageRoutes);

// const PORT = process.env.PORT || 5000;

// mongoose.connect(process.env.MONGO_URI, { 
//   useNewUrlParser: true, 
//   useUnifiedTopology: true 
// }).then(() => console.log('Mongo connected'))
//   .catch(err => console.error('Mongo error', err));

// const io = new Server(server, {
//   cors: { origin: '*' }
// });
// app.get("/test", (req, res) => {
//   res.send("Backend is working!");
// });

// io.on('connection', (socket) => {
//   console.log('Socket connected', socket.id);

//   // join a room (for room chat); clients may send userId for mapping
//   socket.on('joinRoom', (room) => {
//     socket.join(room || 'global');
//     console.log(`${socket.id} joined ${room || 'global'}`);
//   });

//   // client sends message: { token(optional), text, to(optional), fromId(optional), room(optional) }
//   socket.on('sendMessage', async (payload) => {
//     try {
//       const { text, fromId, to, room } = payload;
//       // save message
//       const msg = new Message({
//         from: fromId,
//         to: to || null,
//         text,
//         isBot: false
//       });
//       await msg.save();
//       const populated = await msg.populate('from', 'name');

//       // emit to room or broadcast
//       if (room) {
//         io.to(room).emit('newMessage', populated);
//       } else {
//         io.emit('newMessage', populated);
//       }

//       // If the text triggers bot response, generate reply
//       // Simple rule: if message mentions '@bot' or contains 'bot' or user asks 'help', auto-reply.
//       const lower = (text || '').toLowerCase();
//       if (lower.includes('bot') || lower.includes('@bot') || lower.includes('help') || lower.includes('assistant')) {
//         const replyText = getBotReply(text);
//         const botMsg = new Message({ from: null, text: replyText, isBot: true }); // from:null means bot
//         await botMsg.save();
//         io.emit('newMessage', {
//           _id: botMsg._id,
//           from: { _id: null, name: 'Assistant Bot' },
//           text: botMsg.text,
//           isBot: true,
//           createdAt: botMsg.createdAt
//         });
//       }
//     } catch (err) {
//       console.error('sendMessage error', err);
//     }
//   });

//   socket.on('disconnect', () => {
//     console.log('Socket disconnected', socket.id);
//   });
// });

// server.listen(PORT, () => console.log('Server running on', PORT));
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

// ✅ Configure CORS for production
const allowedOrigins = ['http://localhost:3000',
  'https://chat-mern-eight.vercel.app', // your frontend
];

app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true); // allow mobile apps / Postman
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS']
}));

app.use(express.json());

// ✅ API routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// ✅ Test route
app.get("/test", (req, res) => {
  res.send("Backend is working!");
});

// ✅ Connect MongoDB
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error', err));

// ✅ Socket.IO with CORS for frontend
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET','POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('Socket connected', socket.id);

  socket.on('joinRoom', (room) => {
    socket.join(room || 'global');
    console.log(`${socket.id} joined ${room || 'global'}`);
  });

  socket.on('sendMessage', async (payload) => {
    try {
      const { text, fromId, to, room } = payload;

      const msg = new Message({ from: fromId, to: to || null, text, isBot: false });
      await msg.save();
      const populated = await msg.populate('from', 'name');

      if (room) io.to(room).emit('newMessage', populated);
      else io.emit('newMessage', populated);

      // Bot reply
      const lower = (text || '').toLowerCase();
      if(lower.includes('bot') || lower.includes('@bot') || lower.includes('help') || lower.includes('assistant')){
        const replyText = getBotReply(text);
        const botMsg = new Message({ from: null, text: replyText, isBot: true });
        await botMsg.save();
        io.emit('newMessage', {
          _id: botMsg._id,
          from: { _id: null, name: 'Assistant Bot' },
          text: botMsg.text,
          isBot: true,
          createdAt: botMsg.createdAt
        });
      }
    } catch(err) {
      console.error('sendMessage error', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected', socket.id);
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
