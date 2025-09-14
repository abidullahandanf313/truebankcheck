const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const app = express();

// Middleware
app.use(express.static(__dirname));
app.use(express.json());

// Load CSV into memory at startup
let bankData = [];
const csvPath = path.join(__dirname, 'data', 'banks.csv');

console.log('Loading CSV from:', csvPath);

let csvLoaded = false;

fs.createReadStream(csvPath)
  .pipe(csv())
  .on('data', (row) => {
    if (row.RoutingNumber && row.RoutingNumber !== 'RoutingNumber') {
      bankData.push(row);
    }
  })
  .on('end', () => {
    csvLoaded = true;
    console.log(`CSV loaded successfully: ${bankData.length} banks.`);
  })
  .on('error', (err) => {
    console.error('CSV loading error:', err.message);
    bankData = [];
    csvLoaded = true;
  });

// API endpoint to validate
app.post('/validate', (req, res) => {
  console.log('Received request:', req.body);

  const { routingNumber, accountNumber } = req.body;

  if (!routingNumber || !accountNumber) {
    return res.status(400).json({ valid: false, message: 'Missing routing or account number.' });
  }

  if (!/^\d{9}$/.test(routingNumber)) {
    return res.status(400).json({ valid: false, message: 'Routing number must be exactly 9 digits.' });
  }

  if (!/^\d{8,17}$/.test(accountNumber)) {
    return res.status(400).json({ valid: false, message: 'Invalid account number format (8-17 digits).' });
  }

  if (!csvLoaded) {
    return res.status(503).json({ valid: false, message: 'Server still loading data. Try again.' });
  }

  const foundBank = bankData.find(row => row.RoutingNumber === routingNumber);

  if (foundBank) {
    console.log('Valid routing found:', foundBank.BankName);
    res.json({
      valid: true,
      bankName: foundBank.BankName,
      address: `${foundBank.Address}, ${foundBank.City}, ${foundBank.State}`
    });
  } else {
    console.log('Invalid routing:', routingNumber);
    res.json({ valid: false, message: 'Invalid routing number.' });
  }
});

// For Vercel: Export the app
module.exports = app;
