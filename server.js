import express from 'express';
import cors from 'cors';
import fs from 'fs';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = './database.json';
let loans = [];
try { if (fs.existsSync(DB_FILE)) loans = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch {}
const save = () => fs.writeFileSync(DB_FILE, JSON.stringify(loans, null, 2));

// WAAFI PAY SANDBOX - UTABADILISHA NA YAKO HALISI BAADAE
const WAAFI = {
  merchantUid: 'M0910291',
  apiUserId: '1001104',
  apiKey: 'API-675418888AHX-02AG',
  baseUrl: 'https://sandbox.waafipay.com/asm'
};

async function payWaafi(phone, amount){
  try {
    const payload = {
      schemaVersion: "1.0", requestId: Date.now().toString(),
      timestamp: new Date().toISOString(), channelName: "WEB", serviceName: "API_PURCHASE",
      serviceParams: {
        merchantUid: WAAFI.merchantUid, apiUserId: WAAFI.apiUserId, apiKey: WAAFI.apiKey,
        paymentMethod: "MWALLET_ACCOUNT", payerInfo: { accountNo: phone },
        transactionInfo: { referenceId: "DHQ"+Date.now(), invoiceId: "INV"+Date.now(), amount: amount.toString(), currency: "USD", description: "Dhaqaale Loan Repayment" }
      }
    };
    const r = await axios.post(WAAFI.baseUrl, payload);
    return r.data;
  } catch(e){ return { error: true, msg: e.response?.data || e.message }; }
}

app.get('/api/loans', (req,res)=> res.json(loans));
app.post('/api/loans', (req,res)=>{
  const { name, phone, amount } = req.body;
  if(!name||!phone||!amount) return res.status(400).json({error:'Jaza'});
  const loan = { id: Date.now(), name, phone, amount, status: 'PENDING', date: new Date().toLocaleString(), waafi: null };
  loans.unshift(loan); save(); res.json({ success: true, loan });
});
app.post('/api/loans/:id/pay', async (req,res)=>{
  const loan = loans.find(l=>l.id==req.params.id);
  if(!loan) return res.status(404).json({error:'Not found'});
  const waafiRes = await payWaafi(loan.phone.startsWith('252')?loan.phone:'25261'+loan.phone.slice(-9), '1');
  loan.waafi = waafiRes; loan.status = waafiRes.responseCode=='2001' || waafiRes.responseCode=='2000' ? 'PAID' : 'PAY_PENDING'; save();
  res.json({ success:true, loan, waafi: waafiRes });
});
app.post('/api/loans/:id/status', (req,res)=>{
  const loan = loans.find(l=>l.id==req.params.id); if(!loan) return res.status(404).json({error:'No'});
  loan.status = req.body.status; save(); res.json({ success:true });
});

app.get('/admin', (req,res)=>res.send(`
<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Boss Dashboard</title>
<style>body{font-family:Arial;background:#f1f5f9;padding:10px} .card{background:white;padding:15px;border-radius:12px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,0.1)} button{padding:8px 12px;border:none;border-radius:6px;margin:3px;cursor:pointer;font-weight:bold} .green{background:#22c55e;color:white}.blue{background:#0ea5e9;color:white}.red{background:#ef4444;color:white}</style>
</head><body><h2>👑 Boss Dashboard - WaafiPay</h2><p>Total Loans: <span id="count">0</span> | Total KES: <span id="total">0</span></p><div id="list"></div>
<script>
async function load(){const r=await fetch('/api/loans');const d=await r.json();document.getElementById('count').innerText=d.length;document.getElementById('total').innerText=d.reduce((s,l)=>s+Number(l.amount),0);
document.getElementById('list').innerHTML=d.map(l=>\`<div class="card"><b>\${l.name}</b> - \${l.phone}<br>KES \${l.amount} - \${l.status} - \${l.date}<br><small>Waafi: \${JSON.stringify(l.waafi||{}).substring(0,120)}</small><br>
<button class="green" onclick="upd(\${l.id},'APPROVED')">Approve</button><button class="blue" onclick="pay(\${l.id})">Lipa na WaafiPay</button><button class="red" onclick="upd(\${l.id},'REJECTED')">Reject</button></div>\`).join('');}
async function upd(id,s){await fetch('/api/loans/'+id+'/status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:s})});load();}
async function pay(id){if(!confirm('Lipa na WaafiPay Test?')) return;const r=await fetch('/api/loans/'+id+'/pay',{method:'POST'});const d=await r.json();alert('Waafi Response: '+JSON.stringify(d.waafi).substring(0,200));load();}
load();setInterval(load,3000);
</script></body></html>
`));

app.get('/', (req,res)=>res.send(`
<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dhaqaale Loan - WaafiPay</title>
<style>body{font-family:Arial;background:linear-gradient(135deg,#0ea5e9,#10b981);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:15px;margin:0}
.box{background:white;width:100%;max-width:400px;padding:25px;border-radius:20px;box-shadow:0 20px 40px rgba(0,0,0,0.2)} input{width:100%;padding:14px;margin:8px 0;border:1px solid #ddd;border-radius:10px;font-size:16px;box-sizing:border-box}
button{width:100%;padding:16px;background:#0ea5e9;color:white;border:none;border-radius:10px;font-weight:bold;font-size:17px;cursor:pointer;margin-top:10px}
.test{background:#fef3c7;padding:10px;border-radius:8px;font-size:12px;border:1px solid #f59e0b;margin-bottom:10px}
</style></head><body><div class="box"><h2 style="margin:0 0 5px">💰 Dhaqaale Loan</h2><p style="color:#64748b;margin:0 0 15px">Omba loan - Lipa na WaafiPay (EVC/ZAAD)</p>
<div class="test"><b>🧪 TEST EVC:</b> 252611111111 | PIN 1212<br>Loan inaingia, kisha Admin ana-bonyeza "Lipa na WaafiPay"</div>
<input id="name" placeholder="Jina lako kamili"><input id="phone" placeholder="25261... au 07..."><input id="amount" type="number" placeholder="Amount KES"><button onclick="omba()">OMBA LOAN SASA</button>
<p id="msg" style="text-align:center;font-weight:bold;margin-top:12px"></p><p style="text-align:center;margin-top:10px"><a href="/admin">Boss Login (Admin)</a></p></div>
<script>
async function omba(){const name=document.getElementById('name').value;const phone=document.getElementById('phone').value;const amount=document.getElementById('amount').value;
if(!name||!phone||!amount) return alert('Jaza zote');document.getElementById('msg').innerText='Inatuma...';
const r=await fetch('/api/loans',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,phone,amount})});const d=await r.json();
if(d.success){document.getElementById('msg').innerText='✅ Ombi limetumwa! Tutakujibu haraka!';}else{document.getElementById('msg').innerText='Error';}}
</script></body></html>
`));

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', ()=>console.log('DHAQAALE WAAFI LIVE'));
