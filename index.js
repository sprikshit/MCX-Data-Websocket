const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const URL = 'https://in.investing.com/commodities/real-time-futures';

let commodityData = {};

const trackedCommodities = [
  'MCX Gold 1 Kg',
  'MCX Silver',
  'MCX Copper',
  'MCX Aluminium',
  'MCX Crude Oil WTI',
  'Lead',
  'MCX Zinc',
  'NCDEX Jeera',
  'NCDEX Coriander',
  'NCDEX Guar Gum',
  'NCDEX Soybean',
  'MCX Cotton',
  'MCX Nickel',
  'Gold',
  'Silver'
];

// Create an empty object for the initial message
let initialMessage = {};

async function updateCommodityData() {
  try {
    const response = await axios.get(URL);
    const $ = cheerio.load(response.data);

    const priceChanges = {};

    $('tr.common-table-item').each((index, element) => {
      const $row = $(element);
      const commodityName = $row.find('td.col-name a.js-instrument-page-link').text();
      const lastPrice = $row.find('td.col-last span.text').text();
      const highPrice = $row.find('td.col-high span.text').text();
      const lowPrice = $row.find('td.col-low span.text').text();
      const change = $row.find('td.col-chg span.text').text();
      const changePercentage = $row.find('td.col-chg_pct span.text').text();

      if (trackedCommodities.includes(commodityName)) {
        priceChanges[commodityName] = {
          Last: lastPrice,
          High: highPrice,
          Low: lowPrice,
          Chg: change,
          'Chg%': changePercentage,
        };
      }
    });

    if (Object.keys(priceChanges).length > 0) {
      // If initialMessage is empty, initialize it with the first priceChanges
      if (Object.keys(initialMessage).length === 0) {
        initialMessage = priceChanges;
      } else {
        // Update the initialMessage object with the latest prices
        for (const commodityName in priceChanges) {
          Object.assign(initialMessage[commodityName], priceChanges[commodityName]);
        }
      }

      // Send the updated initialMessage to all connected clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(initialMessage));
        }
      });
    }
  } catch (error) {
    console.error('An error occurred while updating data:', error);
  }
}

const updateInterval = 10;
setInterval(updateCommodityData, updateInterval);

// Initial data update
updateCommodityData();

wss.on('connection', (ws) => {
  // Send the initial message to the connected client
  ws.send(JSON.stringify(initialMessage));
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
