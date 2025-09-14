const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const app = express();

// Middleware
app.use(express.static(__dirname));  // Serves your index.html and files
app.use(express.json());

// Load CSV into memory at startup
let bankData = []; // Array of { RoutingNumber, BankName, Address, City, State }
const csvPath = path.join(__dirname, 'data', 'banks.csv');

console.log('Loading CSV from:', csvPath);

fs.createReadStream(csvPath)
  .pipe(csv())
  .on('data', (row) => {
    bankData.push(row);
  })
  .on('end', () => {
    console.log(`CSV loaded successfully: ${bankData.length} banks.`);
  })
  .on('error', (err) => {
    console.error('CSV loading error:', err.message);
    bankData = []; // Fallback to empty
  });

// API endpoint to validate
app.post('/validate', (req, res) => {
  console.log('Received request:', req.body); // Log for debugging

  const { routingNumber, accountNumber } = req.body;

  // Validate inputs
  if (!routingNumber || !accountNumber) {
    return res.status(400).json({ valid: false, message: 'Missing routing or account number.' });
  }

  if (!/^\d{9}$/.test(routingNumber)) {
    return res.status(400).json({ valid: false, message: 'Routing number must be exactly 9 digits.' });
  }

  if (!/^\d{8,17}$/.test(accountNumber)) {
    return res.status(400).json({ valid: false, message: 'Invalid account number format (8-17 digits).' });
  }

  // Search in loaded data
  const foundBank = bankData.find(row => row.RoutingNumber === routingNumber);

  if (foundBank) {
    console.log('Valid routing found:', foundBank.BankName); // Log success
    res.json({
      valid: true,
      bankName: foundBank.BankName,
      address: `${foundBank.Address}, ${foundBank.City}, ${foundBank.State}`
    });
  } else {
    console.log('Invalid routing:', routingNumber); // Log failure
    res.json({ valid: false, message: 'Invalid routing number.' });
  }
});

// For Vercel: Export the app (removes the listen part)
module.exports = app;
