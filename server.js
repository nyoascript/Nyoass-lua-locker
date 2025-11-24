const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

const codes = {}; // memory storage

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// ---------- FRONTEND ----------
app.get("/", (req, res) => {
res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NyoaSS Locker</title>

<style>
body { 
  margin:0; 
  background:#0a0a0f; 
  font-family:Arial; 
  color:white;
}

/* NAVBAR */
.navbar {
  display:flex;
  background:#111;
  padding:15px;
  box-shadow:0 0 12px rgba(125,76,255,0.3);
}
.nav-item {
  margin-right:25px;
  cursor:pointer;
  padding:8px 12px;
  border-radius:8px;
  transition:0.2s;
  font-weight:bold;
}
.nav-item:hover { background:#222; }
.nav-item.active {
  background:#7d4cff;
  box-shadow:0 0 12px rgba(125,76,255,0.5);
}

/* CONTAINER */
.container {
  max-width:700px;
  margin:auto;
  padding:25px;
}

/* CARD */
.card {
  background:#16161d;
  padding:25px;
  margin-top:20px;
  border-radius:18px;
  box-shadow:0 0 25px rgba(125,76,255,0.18);
  animation:fadeIn .4s ease;
}

/* INPUTS */
textarea, input {
  width:100%;
  padding:12px;
  background:#22222a;
  border:none;
  border-radius:10px;
  margin-top:15px;
  color:white;
}
textarea { height:160px; resize:none; }

/* BUTTON */
button {
  width:100%;
  padding:14px;
  margin-top:20px;
  background:linear-gradient(135deg,#7d4cff,#b983ff);
  border:none;
  border-radius:12px;
  color:white;
  font-size:16px;
  font-weight:bold;
  transition:.2s;
}
button:active {
  transform:scale(0.96);
  opacity:0.8;
}

.hidden { display:none; }

/* TEXT BOX */
.link-box {
  margin-top:15px;
  background:#111;
  padding:14px;
  border-radius:12px;
  word-break:break-all;
}

/* ANIMATIONS */
@keyframes fadeIn {
  from { opacity:0; transform:translateY(10px); }
  to   { opacity:1; transform:translateY(0); }
}
</style>

</head>
<body>

<!-- NAVBAR -->
<div class="navbar">
  <div class="nav-item active" onclick="openTab('locker')">Obfuscator</div>
  <div class="nav-item" onclick="openTab('misc')">Misc</div>
</div>

<div class="container">

  <!-- LOCKER PAGE -->
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

  <!-- MISC PAGE -->
  <div id="misc" class="card hidden">
      <h2>🌐 Misc Tools</h2>
      <p>Discord server:</p>
      <input id="disc" value="https://discord.gg/WBYkWfPQC2" readonly>
      <button onclick="copyDisc()">Copy Discord Link</button>
      <a href="https://discord.gg/WBYkWfPQC2" target="_blank">
        <button>Open Discord</button>
      </a>
  </div>

</div>

<script>
function openTab(name){
  document.getElementById("locker").classList.add("hidden");
  document.getElementById("misc").classList.add("hidden");
  document.getElementById(name).classList.remove("hidden");

  document.querySelectorAll(".nav-item").forEach(el=>el.classList.remove("active"));
  event.target.classList.add("active");
}

function generate(){
  const code = document.getElementById("code").value;
  const pass = document.getElementById("password").value;

  if(!code || !pass){
    alert("Fill all fields!");
    return;
  }

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
  const link = document.getElementById("disc").value;
  navigator.clipboard.writeText(link);
  alert("Discord link copied!");
}
</script>

</body>
</html>`);
});

// ---------- SAVE API ----------
app.post("/save", (req, res) => {
    const { code, pass } = req.body;
    const id = Math.random().toString(36).substring(2,10);
    codes[id] = { code, pass };
    res.json({ id });
});

// ---------- RAW ----------
app.get("/raw/:id", (req, res) => {
    const { id } = req.params;
    const item = codes[id];
    if(!item) return res.status(404).send("Code not found");

    const ua = req.get("User-Agent") || "";
    if(!ua.includes("Roblox")){
        return res.send(`<form method="GET" action="/raw/${id}/check">
            <h3>Password:</h3>
            <input type="password" name="pass">
            <button>Open</button>
        </form>`);
    }

    res.set("Content-Type","text/plain");
    res.send(item.code);
});

// ---------- PASSWORD CHECK ----------
app.get("/raw/:id/check", (req, res) => {
    const { id } = req.params;
    const item = codes[id];
    if(!item) return res.status(404).send("Code not found");

    if(req.query.pass !== item.pass) 
        return res.send("Wrong password");

    res.set("Content-Type","text/plain");
    res.send(item.code);
});

app.listen(PORT, () => console.log("Server running on " + PORT));
