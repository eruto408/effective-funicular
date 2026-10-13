
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Hifadhi ya muda (baadaye tutaweka database)
let loans = [];

app.get('/', (req, res) => {
  res.json({ 
    message: 'WaafiPay Backend is LIVE! ✅',
    app: 'Dhaqaale Loan System',
    endpoints: ['/api/apply', '/api/loans']
  });
});

// 1. Kuomba Loan
app.post('/api/apply', (req, res) => {
  const { name, phone, amount } = req.body;
  
  if (!name || !phone || !amount) {
    return res.status(400).json({ error: 'Jaza name, phone, amount' });
  }

  const newLoan = {
    id: loans.length + 1,
    name,
    phone,
    amount: Number(amount),
    status: 'pending',
    date: new Date().toISOString()
  };
  
  loans.push(newLoan);
  res.json({ 
    success: true, 
    message: `Shukrani ${name}! Loan ya ${amount} KES imepokelewa`,
    loan: newLoan
  });
});

// 2. Kuona Loans zote
app.get('/api/loans', (req, res) => {
  res.json({ total: loans.length, loans });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Dhaqaale running on ${PORT}`);
});
