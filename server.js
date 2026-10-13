import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

let loans = [];

app.get('/api/loans', (req, res) => {
  res.json({ total: loans.length, loans });
});

app.post('/api/apply', (req, res) => {
  const { name, phone, amount } = req.body;
  if (!name || !phone || !amount) {
    return res.status(400).json({ error: 'Jaza name, phone, amount' });
  }
  const newLoan = { id: loans.length+1, name, phone, amount: Number(amount), status: 'pending', date: new Date().toISOString() };
  loans.push(newLoan);
  res.json({ success: true, message: `Shukrani ${name}! Loan ya ${amount} KES imepokelewa`, loan: newLoan });
});

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dhaqaale Loan</title>
<style>
body{font-family:Arial;background:#f0f9ff;padding:20px;margin:0}
.box{max-width:400px;margin:40px auto;background:white;padding:24px;border-radius:16px;box-shadow:0 8px 20px rgba(0,0,0,0.1)}
input{width:100%;padding:14px;margin:8px 0;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;font-size:16px}
button{width:100%;padding:16px;background:#0ea5e9;color:white;border:none;border-radius:10px;font-weight:bold;font-size:16px;cursor:pointer}
h2{color:#0ea5e9;margin:0}
#msg{margin-top:15px;font-weight:bold;color:green;text-align:center}
</style>
</head>
<body>
<div class="box">
<h2>💰 Dhaqaale Loan</h2>
<p>Omba loan haraka - WaafiPay</p>
<input id="name" placeholder="Jina lako">
<input id="phone" placeholder="Namba ya simu 07...">
<input id="amount" type="number" placeholder="Amount KES - mf 5000">
<button onclick="apply()">OMBA LOAN SASA</button>
<p id="msg"></p>
<p style="text-align:center;margin-top:20px"><a href="/api/loans">Angalia maombi yote</a></p>
</div>
<script>
async function apply(){
  const name=document.getElementById('name').value;
  const phone=document.getElementById('phone').value;
  const amount=document.getElementById('amount').value;
  document.getElementById('msg').innerText="Inatuma...";
  const res = await fetch('/api/apply',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,phone,amount})});
  const data = await res.json();
  document.getElementById('msg').innerText = data.message || data.error;
}
</script>
</body>
</html>
  `);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log('LIVE'));
