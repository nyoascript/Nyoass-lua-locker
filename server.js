const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

const codes = {}; 

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// ======================================================
// PASSWORD PROTECTED STORAGE
// ======================================================
function protectLuau(src) {
return `
-- Protected by NyoaSS Obfuscator v1.0
${src}
`;
}

// RANDOM KEY 8–15 DIGITS
function generateKey() {
    const len = Math.floor(Math.random() * 8) + 8; // 8–15
    let out = "";
    for (let i = 0; i < len; i++) out += Math.floor(Math.random() * 10);
    return out;
}

// ======================================================
// FRONTEND
// ======================================================
app.get("/", (req, res) => {
res.send(`

<!DOCTYPE html>
<html>
<head>
<title>NyoaSS Luau Obfuscator</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body{margin:0;background:#0d0d0d;color:white;font-family:Arial}
.tabs{display:flex;justify-content:center;margin-top:20px}
.tab{padding:12px 22px;margin:4px;background:#1b1b1b;border-radius:10px;cursor:pointer;transition:.2s}
.tab:hover{background:#242424}
.active{background:#7d4cff}
.card{background:#161616;margin:20px auto;padding:25px;border-radius:18px;width:92%;max-width:650px;box-shadow:0 0 24px rgba(125,76,255,.35)}
textarea,input{width:100%;padding:14px;margin-top:12px;border:none;border-radius:12px;background:#222;color:white}
textarea{height:170px;resize:none}
button{width:100%;padding:14px;background:#7d4cff;border:none;border-radius:12px;margin-top:20px;color:white;font-size:17px;cursor:pointer}
.result{margin-top:20px;background:#111;padding:14px;border-radius:12px;word-break:break-all;display:none}
#discord{position:fixed;left:15px;bottom:15px;color:white;text-decoration:none;padding:10px 14px;background:#5865F2;border-radius:10px;font-weight:bold;opacity:.85}
#discord:hover{opacity:1}
.copyBtn{margin-top:10px;background:#444;}
</style>
</head>

<body>

<a id="discord" href="https://discord.gg/WBYkWfPQC2" target="_blank">Join Discord</a>

<div class="tabs">
  <div class="tab active" onclick="openTab('obf')">Obfuscator</div>
  <div class="tab" onclick="openTab('edit')">Edit</div>
  <div class="tab" onclick="openTab('info')">Info</div>
</div>

<div id="obf" class="card">
  <h2>Luau Obfuscator</h2>
  <textarea id="code" placeholder="Paste Luau..."></textarea>

  <input id="password" placeholder="Password (8-15 numbers)">
  <button onclick="makeKey()" style="background:#444">Generate Key</button>
  <button onclick="gen()">Protect</button>
  <button onclick="genFree()" style="background:#3bba39">Open Without Password</button>

  <div id="out" class="result"></div>
  <button id="copyBtn" class="copyBtn" style="display:none" onclick="copyL()">Copy</button>
</div>

<div id="edit" class="card" style="display:none">
  <h2>Edit Script</h2>

  <input id="eid" placeholder="Script ID">
  <input id="epass" placeholder="Password (if protected)">
  <button onclick="loadEdit()">Load Script</button>

  <textarea id="editBox" style="display:none"></textarea>
  <button id="saveBtn" style="display:none" onclick="saveEdit()">Save</button>

  <div id="editStatus"></div>
</div>

<div id="info" class="card" style="display:none">
  <h2>Information</h2>
  <p>NyoaSS obfuscator v1.0 allows:</p>
  <p>- Password-protected scripts</p>
  <p>- Open access scripts (no password)</p>
  <p>- Online editing with secure storage</p>
</div>

<script>

function openTab(id){
 document.querySelectorAll(".card").forEach(x=>x.style.display="none");
 document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
 document.getElementById(id).style.display="block";
 event.target.classList.add("active");
}

let lastL = "";

// =============================
// GENERATE RANDOM KEY
// =============================
function makeKey(){
  fetch("/genkey")
  .then(r=>r.json())
  .then(d=>{
    password.value = d.key;
  });
}

// =============================
// PROTECT WITH PASSWORD
// =============================
function gen(){
  const c = code.value;
  const p = password.value;

  if(!c){ alert("Paste your script"); return; }
  if(!p){ alert("Enter password"); return; }

  if(p.length < 8 || p.length > 15){
    alert("Password must be 8–15 characters");
    return;
  }

  if(!/^[0-9]+$/.test(p)){
    alert("Password must be ONLY numbers");
    return;
  }

  fetch("/save",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({code:c, pass:p})
  })
  .then(r=>r.json())
  .then(data=>{
    const raw = location.origin + "/raw/" + data.id;
    lastL = \`loadstring(game:HttpGet("\${raw}"))()\`;

    out.style.display="block";
    out.innerText = lastL;

    copyBtn.style.display="block";
  });
}

// =============================
// FREE ACCESS — NO PASSWORD
// =============================
function genFree(){
  const c = code.value;
  if(!c){ alert("Paste your script"); return; }

  fetch("/save",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({code:c, pass:"FREE"})
  })
  .then(r=>r.json())
  .then(data=>{
    const raw = location.origin + "/raw/" + data.id;
    lastL = \`loadstring(game:HttpGet("\${raw}"))()\`;

    out.style.display="block";
    out.innerText = lastL;

    copyBtn.style.display="block";
  });
}

function copyL(){
  navigator.clipboard.writeText(lastL);
  alert("Copied!");
}

function loadEdit(){
  fetch("/get?id=" + eid.value + "&pass=" + epass.value)
  .then(r=>r.json())
  .then(d=>{
    if(!d.ok){ editStatus.innerText="Wrong ID or password"; return; }

    editBox.style.display="block";
    saveBtn.style.display="block";
    editBox.value = d.code;
  });
}

function saveEdit(){
  fetch("/update",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      id:eid.value,
      pass:epass.value,
      code:editBox.value
    })
  })
  .then(r=>r.json())
  .then(d=>{
    editStatus.innerText = d.ok ? "Updated!" : "Failed";
  });
}

</script>
</body>
</html>
`);
});

// ======================================================
// BACKEND
// ======================================================
app.get("/genkey",(req,res)=>{
    res.json({ key: generateKey() });
});

// SAVE
app.post("/save",(req,res)=>{
const { code, pass } = req.body;
const id = Math.random().toString(36).substring(2,10);

if(pass === "FREE"){
    codes[id] = { code, pass:"FREE" };
} else {
    codes[id] = { code: protectLuau(code), pass };
}

res.json({ id });
});

// GET
app.get("/get",(req,res)=>{
const { id, pass } = req.query;
const item = codes[id];
if(!item) return res.json({ ok:false });

if(item.pass !== "FREE" && item.pass !== pass)
    return res.json({ ok:false });

res.json({ ok:true, code:item.code });
});

// UPDATE
app.post("/update",(req,res)=>{
const { id, pass, code } = req.body;
const item = codes[id];
if(!item) return res.json({ ok:false });

if(item.pass !== "FREE" && item.pass !== pass)
    return res.json({ ok:false });

item.code = (item.pass === "FREE") ? code : protectLuau(code);

res.json({ ok:true });
});

// RAW
app.get("/raw/:id",(req,res)=>{
const item = codes[req.params.id];
if(!item) return res.status(404).send("Not found");

if(item.pass === "FREE"){
    res.set("Content-Type","text/plain");
    return res.send(item.code);
}

const ua = req.get("User-Agent") || "";
if(!ua.includes("Roblox")){
return res.send(\`
<!DOCTYPE html><html><head><title>Password</title>
<style>
body{background:#0d0d0d;margin:0;color:white;font-family:Arial;
display:flex;justify-content:center;align-items:center;height:100vh}
.box{background:#171717;padding:30px;border-radius:16px;width:90%;max-width:340px;text-align:center;
box-shadow:0 0 25px rgba(125,76,255,.25)}
input,button{width:100%;padding:12px;border:none;border-radius:10px;background:#222;color:white;margin-top:14px}
button{background:#7d4cff}
</style></head>
<body>
<div class="box">
<h2>Password Required</h2>
<form method="GET" action="/raw/${req.params.id}/check">
<input name="pass" type="password" placeholder="Password">
<button>Open</button>
</form>
</div>
</body>
</html>
\`);
}

res.set("Content-Type","text/plain");
res.send(item.code);
});

// CHECK PW
app.get("/raw/:id/check",(req,res)=>{
const item = codes[req.params.id];
if(!item) return res.status(404).send("Not found");
if(item.pass !== req.query.pass) return res.send("Wrong password");
res.set("Content-Type","text/plain");
res.send(item.code);
});

app.listen(PORT,()=>console.log("NyoaSS Server Running",PORT));