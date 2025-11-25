const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

// ===========================
//     ADMIN KEY
// ===========================
const ADMIN_KEY = "SlivkineepyScripts";

// ===========================
//      MEMORY DATABASE
// ===========================
const codes = {};
const securityLogs = [];

// ===========================
//      MIDDLEWARE
// ===========================
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Anti-Spam: 1 запрос в 800 ms
const rateLimitMap = {};
app.use((req, res, next) => {
    const ip = req.ip;
    const now = Date.now();

    if (rateLimitMap[ip] && now - rateLimitMap[ip] < 800) {
        return res.status(429).send("Too many requests");
    }

    rateLimitMap[ip] = now;
    next();
});

// SECURITY LOGGER
function logSecurity(req) {
    securityLogs.push({
        time: new Date().toISOString(),
        ip: req.ip,
        ua: req.get("User-Agent") || "Unknown",
        path: req.originalUrl
    });

    if (securityLogs.length > 500) securityLogs.shift();
}

// ===========================
//          FRONT PAGE
// ===========================
app.get("/", (req, res) => {
logSecurity(req);

res.send(`
<!DOCTYPE html>
<html>
<head>
<title>NyoaSS Luau Obfuscator</title>
<meta name="viewport" content="width=device-width, initial-scale=1">

<style>
body { margin:0;background:#0d0d0d;color:white;font-family:Arial }
.top-menu {
  display:flex;gap:20px;justify-content:center;
  padding:15px;background:#111;position:sticky;top:0;
}
.tab {
  padding:10px 20px;background:#191919;border-radius:10px;
  cursor:pointer;transition:.15s;
  box-shadow:0 0 10px rgba(125,76,255,.3);
}
.tab:hover { background:#222; }

.card {
  background:#161616;padding:25px;margin:25px auto;
  width:90%;max-width:650px;border-radius:20px;
  box-shadow:0 0 25px rgba(125,76,255,.3);
}

textarea,input {
  width:100%;padding:12px;margin-top:10px;
  border:none;border-radius:10px;background:#222;color:white;
}
textarea{height:170px}

button {
  width:100%;padding:13px;margin-top:15px;
  background:#7d4cff;border:none;border-radius:10px;
  color:white;font-size:17px;cursor:pointer;
}
button:hover { opacity:.9; }

.hidden{display:none}

.result-box {
  margin-top:15px;background:#111;padding:10px;border-radius:12px;
  display:none;word-break:break-all;
}
</style>

</head>
<body>

<div class="top-menu">
  <div class="tab" onclick="openTab('obf')">Obfuscator</div>
  <div class="tab" onclick="openTab('edit')">Edit</div>
  <div class="tab" onclick="openTab('info')">Information</div>
  <div class="tab" onclick="openTab('admin')">Admin</div>
</div>

<div class="card">

<!-- ============ OBF TAB ============ -->
<div id="obfTab">
  <h2>NyoaSS Luau Obfuscator</h2>

  <textarea id="code" placeholder="Paste script..."></textarea>
  <input id="password" placeholder="8–15 char password">

  <button onclick="gen()">Generate</button>

  <div id="res" class="result-box"></div>
</div>

<!-- ============ EDIT TAB ============ -->
<div id="editTab" class="hidden">
  <h2>Edit Script</h2>

  <input id="edit_id" placeholder="Script ID">
  <input id="edit_pass" placeholder="Password">
  <button onclick="loadEdit()">Load</button>

  <textarea id="edit_area" class="hidden"></textarea>
  <button id="save_btn" class="hidden" onclick="saveEdit()">Save</button>
</div>

<!-- ============ INFO TAB ============ -->
<div id="infoTab" class="hidden">
  <h2>Information</h2>
  <p style="color:#ddd;line-height:1.5">
  Cloud-based Luau script locker.<br>
  Protects from dumping, spoofing, tracing, tampering.
  </p>
</div>

<!-- ============ ADMIN TAB ============ -->
<div id="adminTab" class="hidden">
  <h2>Admin Panel</h2>
  <input id="adm_key" placeholder="Enter admin key">
  <button onclick="loadAdmin()">Open Logs</button>

  <div id="admin_box" class="hidden" style="margin-top:15px;background:#111;padding:15px;border-radius:10px;max-height:300px;overflow:auto"></div>
</div>

</div>


<script>
function openTab(tab){
  obfTab.classList.add("hidden");
  editTab.classList.add("hidden");
  infoTab.classList.add("hidden");
  adminTab.classList.add("hidden");
  document.getElementById(tab+"Tab").classList.remove("hidden");
}

// GENERATE
function gen(){
    const c = code.value;
    const p = password.value;

    if(p.length < 8 || p.length > 15){
        alert("Password must be 8-15 characters");
        return;
    }

    fetch("/save",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({ code:c, pass:p })
    })
    .then(r=>r.json())
    .then(d=>{
        const url = location.origin + "/raw/" + d.id;
        res.style.display="block";
        res.innerText = \`loadstring(game:HttpGet("\${url}"))()\`;
    });
}

// LOAD FOR EDIT
function loadEdit(){
    fetch("/edit/load?id="+edit_id.value+"&pass="+edit_pass.value)
    .then(r=>r.text())
    .then(t=>{
        if(t.startsWith("ERR")){ alert(t); return; }
        edit_area.classList.remove("hidden");
        save_btn.classList.remove("hidden");
        edit_area.value = t;
    });
}

// SAVE EDITED
function saveEdit(){
    fetch("/edit/save",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
            id:edit_id.value,
            pass:edit_pass.value,
            code:edit_area.value
        })
    })
    .then(r=>r.text())
    .then(alert);
}

// ADMIN PANEL
function loadAdmin(){
    fetch("/admin?key="+adm_key.value)
    .then(r=>r.text())
    .then(tx=>{
       admin_box.classList.remove("hidden");
       admin_box.innerHTML = tx;
    });
}
</script>

</body>
</html>
`);
});

// ===========================
//        SAVE SCRIPT
// ===========================
app.post("/save", (req,res)=>{
logSecurity(req);

const { code, pass } = req.body;

if(pass.length < 8 || pass.length > 15){
    return res.json({ error:"Password length must be 8-15" });
}

const id = Math.random().toString(36).substring(2,10);
codes[id] = { code, pass };

res.json({ id });
});

// ===========================
//          RAW
// ===========================
app.get("/raw/:id", (req,res)=>{
logSecurity(req);

const item = codes[req.params.id];
if(!item) return res.status(404).send("Not found");

const ua = req.get("User-Agent") || "";

if(!ua.includes("Roblox")){
return res.send(`
<html><body style="background:#000;color:white;display:flex;justify-content:center;align-items:center;height:100vh;">
<form method="GET" action="/raw/${req.params.id}/check">
<input name="pass" type="password" placeholder="Password" style="padding:12px;border-radius:10px;background:#222;color:white;">
<button style="margin-top:10px;padding:10px 20px;border:none;background:#7d4cff;color:white;border-radius:10px;">Open</button>
</form>
</body></html>
`);
}

res.set("Content-Type","text/plain");
res.send(item.code);
});

// PASSWORD CHECK
app.get("/raw/:id/check", (req,res)=>{
logSecurity(req);

const item = codes[req.params.id];
if(!item) return res.send("Not found");
if(req.query.pass !== item.pass) return res.send("Wrong password");

res.set("Content-Type","text/plain");
res.send(item.code);
});

// ===========================
//         EDIT API
// ===========================
app.get("/edit/load", (req,res)=>{
logSecurity(req);

const { id, pass } = req.query;
const item = codes[id];
if(!item) return res.send("ERR: Not found");
if(item.pass !== pass) return res.send("ERR: Wrong password");

res.send(item.code);
});

app.post("/edit/save", (req,res)=>{
logSecurity(req);

const { id, pass, code } = req.body;
const item = codes[id];
if(!item) return res.send("ERR: Not found");
if(item.pass !== pass) return res.send("ERR: Wrong password");

item.code = code;
res.send("Saved");
});

// ===========================
//     ADMIN PANEL OUTPUT
// ===========================
app.get("/admin", (req,res)=>{
logSecurity(req);

if(req.query.key !== ADMIN_KEY)
    return res.status(403).send("Wrong key");

let html = "";
securityLogs.forEach(l=>{
    html += `
<div style="margin-bottom:10px">
<b>Time:</b> ${l.time}<br>
<b>IP:</b> ${l.ip}<br>
<b>User-Agent:</b> ${l.ua}<br>
<b>Path:</b> ${l.path}<br>
<hr style="border-color:#333">
</div>`;
});

res.send(html);
});

// ===========================
app.listen(PORT, ()=> console.log("Server running on", PORT));