import { io } from 'socket.io-client';

const base = import.meta.env.VITE_API_BASE || '';

export function createSocket() {
  return io(base || undefined, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
  });
}
