
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

let loans = [];

app.get('/api/loans', (req, res) => {
  res.json({ total: loans.length, loans });
});

app.post('/api/apply', (req, res) => {
  const { name, phone, amount } = req.body;
  if (!name || !phone || !amount) {
    return res.status(400).json({ error: 'Jaza name, phone, amount' });
  }
  const newLoan = {
    id: loans.length + 1,
    name, phone,
    amount: Number(amount),
    status: 'pending',
    date: new Date().toISOString()
  };
  loans.push(newLoan);
  res.json({ success: true, message: `Shukrani ${name}! Loan ya ${amount} KES imepokelewa`, loan: newLoan });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`WaafiPay LIVE on ${PORT}`);
});
