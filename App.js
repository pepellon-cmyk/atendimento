import React, { useEffect, useState } from 'react';
import TicketList from './components/TicketList';
import Chat from './components/Chat';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3333';

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);

  async function loadTickets() {
    const res = await fetch(`${API}/tickets`);
    const data = await res.json();
    setTickets(data);
    if (!selectedTicket && data.length) setSelectedTicket(data[0]);
  }

  useEffect(() => {
    loadTickets();
    const iv = setInterval(loadTickets, 5000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ width: 350, borderRight: '1px solid #ddd', padding: 12 }}>
        <h3>Pousada - Conversas</h3>
        <TicketList tickets={tickets} onSelect={setSelectedTicket} selected={selectedTicket} />
      </div>
      <div style={{ flex: 1, padding: 12 }}>
        {selectedTicket ? (
          <Chat ticket={selectedTicket} apiBase={API} />
        ) : (
          <div>Selecione uma conversa</div>
        )}
      </div>
    </div>
  );
}