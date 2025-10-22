import { io } from 'socket.io-client';
import { getApiBase } from './api';

let socket = null;

export function getSocket() {
  if (socket) return socket;
  const env = import.meta.env.VITE_SOCKET_URL;
  const base = env && env.trim() ? env.trim() : getApiBase();
  socket = io(base, { transports: ['websocket'], autoConnect: true });
  return socket;
}
