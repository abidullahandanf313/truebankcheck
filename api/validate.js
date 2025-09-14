const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

let bankData = [];

// Load CSV once when function is initialized
const csvPath = path.join(__dirname, '..', 'data', 'banks.csv');

if (fs.existsSync(csvPath)) {
  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => bankData.push(row))
    .on('end', () => console.log(`CSV loaded: ${bankData.length} banks.`));
} else {
  console.error('CSV not found at', csvPath);
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ valid: false, message: 'Method not allowed' });
  }

  const { routingNumber, accountNumber } = req.body;

  if (!routingNumber || !accountNumber) {
    return res.status(400).json({ valid: false, message: 'Missing routing or account number.' });
  }

  if (!/^\d{9}$/.test(routingNumber)) {
    return res.status(400).json({ valid: false, message: 'Routing number must be 9 digits.' });
  }

  if (!/^\d{8,17}$/.test(accountNumber)) {
    return res.status(400).json({ valid: false, message: 'Account number must be 8-17 digits.' });
  }

  const foundBank = bankData.find(row => row.RoutingNumber === routingNumber);

  if (foundBank) {
    res.status(200).json({
      valid: true,
      bankName: foundBank.BankName,
      address: `${foundBank.Address}, ${foundBank.City}, ${foundBank.State}`
    });
  } else {
    res.status(200).json({ valid: false, message: 'Invalid routing number.' });
  }
}
