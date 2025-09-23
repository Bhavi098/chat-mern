import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../api';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export default function Chat({ user, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const socketRef = useRef();

  useEffect(() => {
    // fetch history
    const fetchMessages = async () => {
      try {
        const res = await api.get('/messages');
        setMessages(res.data);
      } catch (err) {
        console.error('fetch messages', err);
      }
    };
    fetchMessages();

    // connect socket
    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });

    socketRef.current.on('connect', () => {
      console.log('connected socket', socketRef.current.id);
      socketRef.current.emit('joinRoom', 'global');
    });

    socketRef.current.on('newMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    socketRef.current.emit('sendMessage', {
      text,
      fromId: user.id || user._id,
      room: 'global'
    });

    setText('');
  };

  const askBot = (q) => {
    // send message that triggers bot reply (server's rule sees 'bot' or 'help')
    socketRef.current.emit('sendMessage', {
      text: q + ' @bot',
      fromId: user.id || user._id,
      room: 'global'
    });
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-header">
        <div>
          <strong>Global Chat</strong>
          <div className="user-info">Logged in as: {user.name}</div>
        </div>
        <div>
          <button onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div className="messages" id="messageList">
        {messages.map((m) => (
          <div key={m._id} className={`message ${m.isBot ? 'bot' : (m.from && (m.from._id === (user.id||user._id)) ? 'me' : 'other')}`}>
            <div className="msg-meta">
              <strong>{m.isBot ? 'Assistant Bot' : (m.from?.name || 'Unknown')}</strong>
              <span className="time">{new Date(m.createdAt).toLocaleTimeString()}</span>
            </div>
            <div className="msg-text">{m.text}</div>
          </div>
        ))}
      </div>

      <form className="composer" onSubmit={sendMessage}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message or ask the assistant (try 'help')" />
        <button type="submit">Send</button>
      </form>

      <div className="bot-actions">
        <button onClick={() => askBot('help')}>Ask Bot: Help</button>
        <button onClick={() => askBot('features')}>Ask Bot: Features</button>
        <button onClick={() => askBot("how to register")}>Ask Bot: How to register</button>
      </div>
    </div>
  );
}
