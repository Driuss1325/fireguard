import { useEffect, useRef, useState } from 'react';
import { getSocket } from '../services/socket';

export function useSocket(eventsMap = {}){
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  useEffect(()=>{
    const s = getSocket();
    socketRef.current = s;
    const onC = () => setConnected(true);
    const onD = () => setConnected(false);
    s.on('connect', onC);
    s.on('disconnect', onD);
    Object.entries(eventsMap).forEach(([evt, handler]) => s.on(evt, handler));
    return ()=>{
      s.off('connect', onC);
      s.off('disconnect', onD);
      Object.entries(eventsMap).forEach(([evt, handler]) => s.off(evt, handler));
    };
  }, []);
  return { socket: socketRef.current, connected };
}
