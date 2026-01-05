import React, { useEffect, useState } from 'react';

export default function Chat({ ticket, apiBase }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  async function loadMessages() {
    const res = await fetch(`${apiBase}/tickets/${ticket.id}/messages`);
    const data = await res.json();
    setMessages(data);
  }

  useEffect(() => {
    if (!ticket) return;
    loadMessages();
    const iv = setInterval(loadMessages, 3000);
    return () => clearInterval(iv);
  }, [ticket]);

  async function send() {
    if (!text.trim()) return;
    await fetch(`${apiBase}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: ticket.phone, text, ticketId: ticket.id })
    });
    setText('');
    setTimeout(loadMessages, 500);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ borderBottom: '1px solid #eee', paddingBottom: 8 }}>
        <h3>Chat: {ticket.phone}</h3>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {messages.map(m => (
          <div key={m.id} style={{ marginBottom: 8, textAlign: m.direction === 'in' ? 'left' : 'right' }}>
            <div
              style={{
                display: 'inline-block',
                padding: 8,
                borderRadius: 8,
                background: m.direction === 'in' ? '#f1f1f1' : '#dcf8c6',
                maxWidth: '70%'
              }}
            >
              <div style={{ fontSize: 14 }}>{m.text}</div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 6 }}>{new Date(m.timestamp).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Digite sua resposta..."
          style={{ flex: 1, padding: 10, borderRadius: 6, border: '1px solid #ccc' }}
          onKeyDown={e => { if (e.key === 'Enter') send(); }}
        />
        <button onClick={send} style={{ padding: '10px 16px', borderRadius: 6 }}>Enviar</button>
      </div>
    </div>
  );
}