# Pousada WhatsApp - MVP (WhatsApp Business Cloud API)

Este projeto é um scaffold mínimo para atendimento via WhatsApp usando a WhatsApp Business Cloud API (Meta).
Inclui:
- backend (Express + lowdb) em /server
- frontend (React) em /client
- endpoints para webhook, envio de mensagens e painel simples para atendentes

----- O QUE VOCÊ PRECISA -----
1. Conta Meta Business + App no Meta for Developers
2. Obter:
   - PHONE_NUMBER_ID (do seu número configurado no WhatsApp Cloud)
   - ACCESS_TOKEN (token temporário / ou de longa duração)
3. Webhook público (ngrok ou host com HTTPS) para o endpoint: https://<seu-url>/webhook
4. VERIFY_TOKEN (string qualquer que você configurará no app do Meta para validar a verificação)

----- COMO RODAR (desenvolvimento) -----
1. Backend
   - Entre em /server
   - Copie `.env.example` para `.env` e preencha ACCESS_TOKEN e PHONE_NUMBER_ID e VERIFY_TOKEN
   - npm install
   - npm run dev
   - O servidor rodará por padrão em http://localhost:3333

2. Frontend
   - Entre em /client
   - npm install
   - npm start
   - O painel React rodará em http://localhost:3000

3. Expor webhook (ngrok exemplo)
   - ngrok http 3333
   - Copie a URL pública (ex: https://abcd1234.ngrok.io)
   - No Meta for Developers -> Webhooks do seu App WhatsApp, configure:
     - Callback URL: https://abcd1234.ngrok.io/webhook
     - Verify token: o mesmo VERIFY_TOKEN do .env
   - Faça a verificação (GET /webhook será chamado pelo Meta)

4. Teste
   - Envie uma mensagem para o número WhatsApp configurado
   - O Meta enviará a webhook para /webhook do backend
   - Backend criará um ticket e uma mensagem; o painel buscará tickets e mensagens

----- ENDPOINTS IMPORTANTES -----
- GET / -> status
- GET /webhook?hub.mode=subscribe&hub.verify_token=...&hub.challenge=... -> verificação
- POST /webhook -> receber eventos do WhatsApp
- GET /tickets -> lista de tickets
- GET /tickets/:id/messages -> mensagens do ticket
- POST /send -> enviar mensagem (body: { to, text, ticketId })

----- TEMPLATES (mensagens proativas) -----
Mensagens fora da janela de 24h exigem templates aprovados pelo Meta. Exemplos (PT-BR):
- Boas-vindas: "Olá {{1}}, sua reserva na Pousada Mar Azul foi confirmada para {{2}}. Precisa de algo mais?"
- Check-in: "Olá {{1}}, lembramos que o check-in é às {{2}}. Se precisar de ajuda, nos avise."
- Lembrete de pagamento: "Olá {{1}}, este é um lembrete do pagamento pendente da reserva {{2}}."
Submeta estes templates no Meta Business Manager para aprovação antes de usá-los.

----- OBSERVAÇÕES -----
- Este é um MVP. Em produção, troque lowdb por PostgreSQL/MongoDB, acrescente autenticação para atendentes, logs, testes e tratamento de erros robusto.
- Não compartilhe seu ACCESS_TOKEN publicamente.
- Para envio de mídias ou templates, adapte payloads conforme documentação do WhatsApp Cloud API.

Se quiser, eu:
- Adiciono autenticação simples ao painel (login de atendente).
- Adiciono suporte a templates enviados pelo painel (lista + envio de template).
- Faço um script de deploy para Render / Railway.
- Gero os comandos prontos para criar um repositório no GitHub com esses arquivos.

Diga qual próximo passo prefere: autenticação no painel, templates no painel, deploy automatizado ou outro ajuste.