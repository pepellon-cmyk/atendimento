import React from 'react';

export default function TicketList({ tickets, onSelect, selected }) {
  return (
    <div>
      {tickets.length === 0 && <div>Nenhuma conversa</div>}
      {tickets.map(t => (
        <div
          key={t.id}
          onClick={() => onSelect(t)}
          style={{
            padding: 10,
            marginBottom: 8,
            cursor: 'pointer',
            background: selected && selected.id === t.id ? '#eef' : '#fff',
            borderRadius: 6,
            border: '1px solid #eee'
          }}
        >
          <div style={{ fontWeight: 'bold' }}>{t.phone}</div>
          <div style={{ color: '#555', fontSize: 13 }}>{t.last_message}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{new Date(t.created_at).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}