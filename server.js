// ===========================
// NyoaSS
// ===========================

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_KEY = "SlivkineepyScripts"

// ================ STORAGE ================
const codes = {};
function loadLogs() {
    try { return JSON.parse(fs.readFileSync("logs.json")); }
    catch { return []; }
}
function saveLogs(logs) {
    fs.writeFileSync("logs.json", JSON.stringify(logs, null, 2));
}
function addLog(action, ua) {
    const logs = loadLogs();
    logs.push({
        time: new Date().toISOString(),
        device: ua || "unknown",
        action
    });
    saveLogs(logs);
}

// ================ ANTI-SPAM ================
const limit = rateLimit({
    windowMs: 10 * 1000, // 10 sec
    max: 5,
    message: "Too many requests. Slow down."
});
app.use(limit);

// ================ BASE CONFIG ================
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// ===================== MAIN FRONT-END =====================
app.get("/", (req, res) => {
addLog("OPEN_MAIN", req.get("User-Agent"));

res.send(`<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>NyoaSS Luau Obfuscator</title>
<style>
body{background:#0d0d0d;color:white;font-family:Arial;margin:0;padding:0;display:flex;justify-content:center;align-items:center;height:100vh;}
.card{background:#161616;padding:35px;width:92%;max-width:650px;border-radius:20px;box-shadow:0 0 30px rgba(125,76,255,.3);}
textarea,input{width:100%;padding:14px;background:#222;border:none;border-radius:12px;margin-top:14px;color:white;}
button{width:100%;padding:14px;margin-top:20px;background:#7d4cff;border:none;border-radius:14px;color:white;font-size:17px;cursor:pointer;}
.result{margin-top:20px;background:#111;padding:10px;border-radius:12px;display:none;}
</style>
</head>
<body>
<div class="card">
<h1>NyoaSS Luau Obfuscator</h1>
<textarea id="code" placeholder="Paste script"></textarea>
<input id="password" placeholder="Password">
<button onclick="gen()">Generate</button>
<div id="result" class="result"></div>

<br><br>
<a href="/admin?key=${ADMIN_KEY}" style="color:#7d4cff;">Admin panel</a>
</div>

<script>
function gen(){
  const code=document.getElementById("code").value;
  const pass=document.getElementById("password").value;
  if(!code||!pass)return alert("Fill all");

  fetch("/save",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({code,pass})
  })
  .then(r=>r.json())
  .then(d=>{
    const link = location.origin + "/raw/" + d.id;
    const load = \`loadstring(game:HttpGet("\${link}"))()\`;
    result.style.display="block";
    result.innerText = load;
  });
}
</script>
</body></html>`);
});

// ===================== SAVE CODE =====================
app.post("/save", (req,res)=>{
    addLog("SAVE_SCRIPT", req.get("User-Agent"));
    const { code, pass } = req.body;
    const id = Math.random().toString(36).slice(2,10);

    codes[id] = { code, pass };
    res.json({ id });
});

// ===================== RAW VIEW =====================
app.get("/raw/:id", (req,res)=>{
    const item = codes[req.params.id];
    if(!item) return res.send("Not found");

    addLog("RAW_REQUEST", req.get("User-Agent"));

    const ua = req.get("User-Agent") || "";
    if(!ua.includes("Roblox")){
        return res.send(`
        <form action="/raw/${req.params.id}/check">
          <input name="pass" placeholder="Password" type="password">
          <button>Open</button>
        </form>`);
    }

    res.set("Content-Type","text/plain");
    res.send(item.code);
});

app.get("/raw/:id/check", (req,res)=>{
    const item = codes[req.params.id];
    if(!item) return res.send("Not found");

    if(req.query.pass !== item.pass) return res.send("Wrong password");
    addLog("RAW_OPENED", req.get("User-Agent"));

    res.set("Content-Type","text/plain");
    res.send(item.code);
});

// ===================== ADMIN PANEL =====================
app.get("/admin", (req,res)=>{
    if(req.query.key !== ADMIN_KEY){
        addLog("ADMIN_DENIED", req.get("User-Agent"));
        return res.send("<h1>Access denied</h1>");
    }

    addLog("ADMIN_OPEN", req.get("User-Agent"));

    res.send(`<!DOCTYPE html>
<html><head>
<title>Admin</title>
<style>
body{background:#0d0d0d;color:white;font-family:Arial;padding:40px;}
.box{background:#161616;padding:20px;border-radius:14px;}
pre{white-space:pre-wrap;background:#111;padding:15px;border-radius:10px;max-height:500px;overflow-y:scroll;}
button{padding:10px 15px;margin:5px;background:#7d4cff;border:none;border-radius:10px;color:white;cursor:pointer;}
</style>
</head>
<body>
<h1>🔐 Nyoa Security Logger</h1>
<div class="box">
<pre id="logBox">Loading…</pre>
<button onclick="load()">Refresh</button>
<button onclick="clearLogs()">Clear</button>
</div>

<script>
const key="${ADMIN_KEY}";
function load(){
 fetch("/admin/logs?key="+key).then(r=>r.json()).then(d=>{
   logBox.innerText = d.logs.map(l => 
     \`[\${l.time}] (\${l.device}) → \${l.action}\`
   ).join("\\n");
 });
}
load();
function clearLogs(){
  fetch("/admin/clear?key="+key,{method:"POST"});
  setTimeout(load,300);
}
</script>

</body></html>`);
});

// GET LOGS
app.get("/admin/logs", (req,res)=>{
    if(req.query.key !== ADMIN_KEY) return res.json({ logs: [] });
    res.json({ logs: loadLogs() });
});

// CLEAR LOGS
app.post("/admin/clear", (req,res)=>{
    if(req.query.key !== ADMIN_KEY) return res.send("Denied");
    saveLogs([]);
    addLog("ADMIN_CLEAR", req.get("User-Agent"));
    res.send("Cleared");
});

// ===================== START =====================
app.listen(PORT, ()=> console.log("Server running on port", PORT));