#!/usr/bin/env node
/**
 * Prueba directa: crear card con due date via Trello API.
 * Ejecutar: node scripts/test-due-date.js
 * Requiere: TRELLO_API_KEY y TRELLO_API_TOKEN en env (o .env)
 */
require('dotenv').config();

const KEY = process.env.TRELLO_API_KEY;
const TOKEN = process.env.TRELLO_API_TOKEN;
const LIST_ID = '69303e1177d1edc284828aa8'; // TODO - Proyecto Facturea

if (!KEY || !TOKEN) {
  console.error('Falta TRELLO_API_KEY o TRELLO_API_TOKEN en .env o env');
  process.exit(1);
}

// Fecha solo-día normalizada a noon UTC (evita que en Paraguay UTC-4 muestre día anterior)
const body = {
  name: '[Test script] Due 2025-03-12 (normalizado)',
  desc: 'Prueba con 2025-03-12 → noon UTC. En Paraguay debe verse 12 marzo.',
  idList: LIST_ID,
  pos: 'bottom',
  due: '2025-03-12T12:00:00.000Z',
};

async function test() {
  const url = `https://api.trello.com/1/cards?key=${KEY}&token=${TOKEN}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.due) {
    console.log('✅ OK - Card creada CON due:', data.due);
    console.log('   URL:', data.shortUrl);
  } else {
    console.log('❌ Card creada pero due = null. Respuesta:', JSON.stringify(data, null, 2));
  }
}

test().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
