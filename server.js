const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

const codes = {}; // memory storage

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// ================= FRONTEND =================
app.get("/", (req, res) => {
res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NyoaSs Obfuscator</title>
<style>
body { margin:0; font-family:Arial; color:white; background:#0a0a0f; transition:.3s background; }
.light-theme { background:#f5f5f5; color:#222; }
.light-theme input, .light-theme textarea { background:#eee; color:#222; }
.light-theme .card { background:#fff; color:#222; box-shadow:0 0 25px rgba(125,76,255,0.1); }
.light-theme button { background:linear-gradient(135deg,#7d4cff,#b983ff); color:white; }

/* LOGO */
.logo { text-align:center; padding:20px; font-size:28px; font-weight:bold; color:#b983ff; }

/* NAVBAR */
.navbar { display:flex; background:#111; padding:15px; box-shadow:0 0 12px rgba(125,76,255,0.3); }
.nav-item { margin-right:25px; cursor:pointer; padding:8px 12px; border-radius:8px; transition:.2s; font-weight:bold; }
.nav-item:hover { background:#222; }
.nav-item.active { background:#7d4cff; box-shadow:0 0 12px rgba(125,76,255,0.5); }

/* CONTAINER */
.container { max-width:700px; margin:auto; padding:25px; }

/* CARD */
.card { background:#16161d; padding:25px; margin-top:20px; border-radius:18px; box-shadow:0 0 25px rgba(125,76,255,0.18); animation:fadeIn .4s ease; }

/* INPUTS */
textarea, input { width:100%; padding:12px; background:#22222a; border:none; border-radius:10px; margin-top:15px; color:white; }
textarea { height:160px; resize:none; }

/* BUTTON */
button { width:100%; padding:14px; margin-top:20px; background:linear-gradient(135deg,#7d4cff,#b983ff); border:none; border-radius:12px; color:white; font-size:16px; font-weight:bold; transition:.2s; }
button:active { transform:scale(0.96); opacity:0.8; }

.hidden { display:none; }

/* LINK BOX */
.link-box { margin-top:15px; background:#111; padding:14px; border-radius:12px; word-break:break-all; }

/* ANIMATION */
@keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
</style>
</head>
<body>

<div class="logo">NyoaSs Obfuscator</div>

<!-- NAVBAR -->
<div class="navbar">
  <div class="nav-item active" onclick="openTab('locker')">Obfuscator</div>
  <div class="nav-item" onclick="openTab('misc')">Misc</div>
  <div class="nav-item" onclick="openTab('api')">API</div>
  <div class="nav-item" onclick="openTab('themes')">Themes</div>
</div>

<div class="container">

  <!-- LOCKER -->
  <div id="locker" class="card">
      <h2>🔒 Protect Lua / Luau Code</h2>
      <textarea id="code" placeholder="Paste your Lua / Luau code here"></textarea>
      <input id="password" type="text" placeholder="Password">
      <button onclick="generate()">Generate Link</button>

      <div id="resultBox" class="link-box hidden">
          <b>Your link:</b><br>
          <span id="resultLink"></span>
      </div>
  </div>

  <!-- MISC -->
  <div id="misc" class="card hidden">
      <h2>🌐 Misc Tools</h2>
      <p>Discord server:</p>
      <input id="disc" value="https://discord.gg/WBYkWfPQC2" readonly>
      <button onclick="copyDisc()">Copy Discord Link</button>
      <a href="https://discord.gg/WBYkWfPQC2" target="_blank"><button>Open Discord</button></a>
  </div>

  <!-- API -->
  <div id="api" class="card hidden">
      <h2>📘 API Documentation</h2>
      <p>Load your protected script in Roblox:</p>
      <div class="link-box">
          <code>loadstring(game:HttpGet("https://YOUR-SITE/raw/ID"))()</code>
      </div>
      <p>Works without password in Roblox. Password is only needed for browser view.</p>
  </div>

  <!-- THEMES -->
  <div id="themes" class="card hidden">
      <h2>🎨 Select Theme</h2>
      <button onclick="setTheme('dark')">Dark Theme</button>
      <button onclick="setTheme('light')">Light Theme</button>
  </div>

</div>

<script>
function openTab(name){
  document.querySelectorAll(".card").forEach(e => e.classList.add("hidden"));
  document.getElementById(name).classList.remove("hidden");

  document.querySelectorAll(".nav-item").forEach(el=>el.classList.remove("active"));
  event.target.classList.add("active");
}

function generate(){
  const code = document.getElementById("code").value;
  const pass = document.getElementById("password").value;

  if(!code || !pass){ alert("Fill all fields!"); return; }

  fetch("/save", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({code, pass})
  })
  .then(r=>r.json())
  .then(data=>{
    const link = location.origin + "/raw/" + data.id;
    document.getElementById("resultBox").classList.remove("hidden");
    document.getElementById("resultLink").innerText = link;
  });
}

function copyDisc(){
  navigator.clipboard.writeText(document.getElementById("disc").value);
  alert("Discord link copied!");
}

function setTheme(theme){
  if(theme==='light'){ document.body.classList.add('light-theme'); }
  else{ document.body.classList.remove('light-theme'); }
}
</script>

</body>
</html>`);
});

// ================= API SAVE =================
app.post("/save", (req, res) => {
  const { code, pass } = req.body;
  const id = Math.random().toString(36).substring(2,10);
  codes[id] = { code, pass };
  res.json({ id });
});

// ================= RAW =================
app.get("/raw/:id", (req,res) => {
  const {id} = req.params;
  const item = codes[id];
  if(!item) return res.status(404).send("Code not found");

  const ua = req.get("User-Agent") || "";
  if(ua.includes("Roblox")){
    res.set("Content-Type","text/plain");
    return res.send(item.code);
  }

  // Browser -> Password UI (pretty)
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Enter Password</title>
<style>
body{background:#0b0b11;color:white;font-family:Arial;display:flex;justify-content:center;align-items:center;height:100vh;}
.box{background:#16161d;padding:30px;width:350px;border-radius:18px;box-shadow:0 0 25px rgba(125,76,255,0.3);text-align:center;animation:fadeIn .4s ease;}
input{width:100%;padding:12px;margin-top:15px;background:#22222a;border:none;border-radius:10px;color:white;}
button{width:100%;padding:12px;margin-top:20px;background:linear-gradient(135deg,#7d4cff,#b983ff);border:none;border-radius:12px;color:white;font-weight:bold;}
@keyframes fadeIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
</style>
</head>
<body>
<div class="box">
<h2>🔐 Enter Password</h2>
<form method="GET" action="/raw/${id}/check">
<input type="password" name="pass" placeholder="Password">
<button>Open</button>
</form>
</div>
</body>
</html>
`);
});

// ================= PASSWORD CHECK =================
app.get("/raw/:id/check", (req,res) => {
  const {id} = req.params;
  const item = codes[id];
  if(!item) return res.status(404).send("Code not found");

  if(req.query.pass!==item.pass) return res.send("Wrong password");

  res.set("Content-Type","text/plain");
  res.send(item.code);
});

app.listen(PORT,()=>console.log("Server running on "+PORT));
