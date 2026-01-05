// server.js - Backend mínimo para atendimento via WhatsApp Cloud API (Meta)
// Pré-requisitos: criar .env com ACCESS_TOKEN, PHONE_NUMBER_ID, VERIFY_TOKEN
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Low, JSONFile } = require('lowdb');
const { nanoid } = require('nanoid');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// DB simples com lowdb (arquivo db.json)
const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);

async function initDb() {
  await db.read();
  db.data ||= { tickets: [], messages: [], templates: [] };
  await db.write();
}
initDb();

// Configs (do .env)
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || '';
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || '';
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'verify_token_example';
const WA_API_BASE = `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}`;

// Root
app.get('/', (req, res) => res.send('Pousada WhatsApp service ok'));

// Webhook verification (GET)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode && token && mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// Webhook receiver (POST)
app.post('/webhook', async (req, res) => {
  await db.read();
  const body = req.body;
  if (!body.object) return res.sendStatus(404);

  const entries = body.entry || [];
  for (const entry of entries) {
    const changes = entry.changes || [];
    for (const change of changes) {
      const value = change.value || {};
      const messages = value.messages || [];
      const contacts = value.contacts || [];
      for (const message of messages) {
        const from = message.from; // número do cliente (ex: "5511999999999")
        const text = message.text ? message.text.body : (message.button ? message.button.text : '');
        // criar/obter ticket
        let ticket = db.data.tickets.find(t => t.phone === from);
        if (!ticket) {
          ticket = {
            id: nanoid(),
            phone: from,
            created_at: new Date().toISOString(),
            status: 'new',
            last_message: text || ''
          };
          db.data.tickets.push(ticket);
        } else {
          ticket.last_message = text || ticket.last_message;
        }
        // salvar mensagem recebida
        db.data.messages.push({
          id: nanoid(),
          ticketId: ticket.id,
          direction: 'in',
          from,
          text,
          timestamp: new Date().toISOString(),
          raw: message
        });

        // resposta automática simples para cumprimentos
        if (text && /^(oi|olá|ola|bom dia|boa tarde|boa noite)/i.test(text)) {
          await sendTextMessage(from, `Olá! Obrigado por contatar a Pousada. Em que posso ajudar hoje?`);
          db.data.messages.push({
            id: nanoid(),
            ticketId: ticket.id,
            direction: 'out',
            from: 'pousada',
            to: from,
            text: 'Olá! Obrigado por contatar a Pousada. Em que posso ajudar hoje?',
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  }

  await db.write();
  res.sendStatus(200);
});

// listar tickets
app.get('/tickets', async (req, res) => {
  await db.read();
  res.json(db.data.tickets.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
});

// obter mensagens de um ticket
app.get('/tickets/:id/messages', async (req, res) => {
  await db.read();
  const { id } = req.params;
  const messages = db.data.messages.filter(m => m.ticketId === id);
  res.json(messages);
});

// enviar mensagem (usado pelo painel)
app.post('/send', async (req, res) => {
  await db.read();
  const { to, text, ticketId } = req.body;
  if (!to || !text) return res.status(400).json({ error: 'to e text são obrigatórios' });

  try {
    const result = await sendTextMessage(to, text);
    // salvar mensagem enviada
    db.data.messages.push({
      id: nanoid(),
      ticketId: ticketId || null,
      direction: 'out',
      from: 'pousada',
      to,
      text,
      timestamp: new Date().toISOString(),
      raw: result
    });
    // atualizar ticket se necessário
    if (ticketId) {
      const ticket = db.data.tickets.find(t => t.id === ticketId);
      if (ticket) {
        ticket.status = 'open';
        ticket.last_message = text;
      }
    }
    await db.write();
    res.json({ ok: true, result });
  } catch (err) {
    console.error(err?.response?.data || err.message || err);
    res.status(500).json({ error: 'falha ao enviar' });
  }
});

// Util: enviar mensagem de texto via WhatsApp Cloud API
async function sendTextMessage(to, text) {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    throw new Error('ACCESS_TOKEN ou PHONE_NUMBER_ID não configurados');
  }
  const url = `${WA_API_BASE}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text }
  };
  const headers = { Authorization: `Bearer ${ACCESS_TOKEN}` };
  const resp = await axios.post(url, payload, { headers });
  return resp.data;
}

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));