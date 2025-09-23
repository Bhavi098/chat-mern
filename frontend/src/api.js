import axios from 'axios';

const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://chat-backend.onrender.com/api"
    : "http://localhost:5000/api";


const instance = axios.create({
  baseURL: API_URL,
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default instance;
