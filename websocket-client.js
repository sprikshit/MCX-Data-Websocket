const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000'); // Replace with your server's WebSocket URL

ws.on('open', () => {
  console.log('WebSocket connection opened.');
});

ws.on('message', (data) => {
  console.log('Received data:', JSON.parse(data));
});
