import express from 'express';
import cors from 'cors';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = './loans.json';
let loans = [];
// SOMA FILE KAMA IPO
try{ if(fs.existsSync(DB_FILE)){ loans = JSON.parse(fs.readFileSync(DB_FILE,'utf8')); console.log('Loans loaded:', loans.length); } }catch(e){ loans=[]; }
function saveLoans(){ try{ fs.writeFileSync(DB_FILE, JSON.stringify(loans,null,2)); }catch(e){ console.log('Save error',e.message)} }

app.get('/api/loans', (req,res)=>{
  res.json({ total: loans.length, totalAmount: loans.reduce((s,l)=>s+Number(l.amount||0),0), loans: loans.slice().reverse() });
});

app.post('/api/apply', (req,res)=>{
  const { name, phone, amount } = req.body;
  if(!name || !phone || !amount) return res.status(400).json({ error: 'Jaza zote' });
  const newLoan = { id: Date.now(), name, phone, amount: Number(amount), status: 'pending', date: new Date().toLocaleString('sw-KE') };
  loans.push(newLoan); saveLoans();
  res.json({ success: true, message: `Shukrani ${name}! Loan ya ${amount} KES imepokelewa!`, loan: newLoan });
});

app.post('/api/loans/:id/approve', (req,res)=>{
  const loan = loans.find(l=>l.id==req.params.id); if(!loan) return res.status(404).json({error:'Not found'});
  loan.status='approved'; saveLoans(); res.json({success:true, loan});
});
app.post('/api/loans/:id/reject', (req,res)=>{
  const loan = loans.find(l=>l.id==req.params.id); if(!loan) return res.status(404).json({error:'Not found'});
  loan.status='rejected'; saveLoans(); res.json({success:true, loan});
});

// HOME PAGE YA MTEJA
app.get('/', (req,res)=>{
res.send(`
<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Dhaqaale Loan</title>
<style>body{font-family:Arial;background:#f0f9ff;padding:20px;margin:0}.box{max-width:400px;margin:30px auto;background:white;padding:24px;border-radius:16px;box-shadow:0 8px 20px rgba(0,0,0,0.1)}input{width:100%;padding:14px;margin:8px 0;border:1px solid #ddd;border-radius:10px;box-sizing:border-box;font-size:16px}button{width:100%;padding:16px;background:#0ea5e9;color:white;border:none;border-radius:10px;font-weight:bold;font-size:16px;cursor:pointer}h2{color:#0ea5e9}#msg{margin-top:15px;font-weight:bold;text-align:center}</style></head><body>
<div class="box"><h2>💰 Dhaqaale Loan</h2><p>Omba loan haraka - WaafiPay</p>
<input id="name" placeholder="Jina lako"><input id="phone" placeholder="07..."><input id="amount" type="number" placeholder="Amount KES">
<button onclick="apply()">OMBA LOAN SASA</button><p id="msg"></p>
<p style="text-align:center;margin-top:15px"><a href="/admin">Boss Login (Admin)</a></p></div>
<script>
async function apply(){const name=document.getElementById('name').value;const phone=document.getElementById('phone').value;const amount=document.getElementById('amount').value;
document.getElementById('msg').innerText='Inatuma...';const res=await fetch('/api/apply',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,phone,amount})});
const data=await res.json();document.getElementById('msg').style.color='green';document.getElementById('msg').innerText=data.message;}
</script></body></html>`);
});

// ADMIN DASHBOARD YA BOSS - HII NDIO LEVEL 3!
app.get('/admin', (req,res)=>{
res.send(`
<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Admin - Dhaqaale</title>
<style>body{font-family:Arial;background:#0f172a;color:white;padding:15px;margin:0}.card{background:#1e293b;padding:16px;border-radius:12px;margin:10px 0;display:flex;justify-content:space-between;align-items:center} .pending{border-left:4px solid orange} .approved{border-left:4px solid #22c55e} .rejected{border-left:4px solid red} button{padding:8px 12px;border:none;border-radius:6px;margin:2px;cursor:pointer;font-weight:bold} .ap{background:#22c55e;color:white} .re{background:#ef4444;color:white} .stats{display:flex;gap:10px;flex-wrap:wrap} .stat{background:#1e293b;padding:15px;border-radius:10px;flex:1;min-width:100px;text-align:center}</style></head><body>
<h2>👑 Dhaqaale Admin Dashboard</h2><div class="stats"><div class="stat"><h3 id="total">0</h3><small>Total Loans</small></div><div class="stat"><h3 id="cash">0</h3><small>KES Requested</small></div><div class="stat"><h3 id="pend">0</h3><small>Pending</small></div></div><div id="list">Loading...</div>
<p style="text-align:center"><a href="/" style="color:#38bdf8">← Rudi kwa Home</a></p>
<script>
async function load(){const res=await fetch('/api/loans');const data=await res.json();document.getElementById('total').innerText=data.total;document.getElementById('cash').innerText=data.totalAmount;document.getElementById('pend').innerText=data.loans.filter(l=>l.status=='pending').length;
document.getElementById('list').innerHTML=data.loans.map(l=>\`<div class="card \${l.status}"><div><b>\${l.name}</b> - \${l.phone}<br>\${l.amount} KES - \${l.status}<br><small>\${l.date}</small></div><div>\${l.status=='pending' ? \`<button class="ap" onclick="act(\${l.id},'approve')">APPROVE</button><button class="re" onclick="act(\${l.id},'reject')">REJECT</button>\` : \`<b>\${l.status.toUpperCase()}</b>\`}</div></div>\`).join('');}
async function act(id,action){await fetch('/api/loans/'+id+'/'+action,{method:'POST'});load();}
load();</script></body></html>`);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT,'0.0.0.0',()=>console.log('LEVEL 3 ADMIN LIVE'));
