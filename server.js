const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

const codes = {}; // память хранения кода и паролей

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// ===================== MAIN SITE =====================
app.get("/", (req, res) => {
res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NyoaSS Luau Obfuscator</title>

<style>
body {
  margin:0; padding:0;
  background:#0d0d0d;
  color:white;
  font-family: Arial, sans-serif;
  height:100vh;
  display:flex;
  justify-content:center;
  align-items:center;
  animation: fadeIn .35s ease;
}
@keyframes fadeIn { from{opacity:0;} to{opacity:1;} }

.discord-btn {
  position:fixed;
  top:22px;
  right:22px;
  width:46px;
  height:46px;
  cursor:pointer;
  opacity:.85;
  transition:.2s;
}
.discord-btn:hover {
  transform:scale(1.15);
  opacity:1;
}

.card {
  background:#161616;
  padding:35px;
  width:92%;
  max-width:600px;
  border-radius:20px;
  box-shadow:0 0 30px rgba(125,76,255,.3);
  animation: pop .3s ease;
}
@keyframes pop { from{transform:scale(.95);} to{transform:scale(1);} }

h1 {
  text-align:center;
  margin:0;
  font-size:28px;
  margin-bottom:10px;
}

.desc {
  text-align:center;
  font-size:14px;
  margin-bottom:25px;
  color:#bdbdbd;
  line-height:1.4;
}

textarea, input {
  width:100%;
  padding:14px;
  border:none;
  border-radius:12px;
  margin-top:14px;
  background:#222;
  color:white;
}
textarea { height:170px; resize:none; }

button {
  width:100%;
  padding:15px;
  margin-top:20px;
  background:#7d4cff;
  border:none;
  border-radius:14px;
  color:white;
  font-size:17px;
  box-shadow:0 0 14px rgba(125,76,255,.5);
  transition:.2s;
  cursor:pointer;
}
button:hover { opacity:.9; }
button:active { transform:scale(.97); }

.result-box {
  margin-top:25px;
  padding:15px;
  background:#111;
  border-radius:12px;
  word-break:break-all;
  display:none;
}

.small-title {
  font-size:15px;
  color:#c9c9c9;
  margin-bottom:8px;
  font-weight:bold;
}
</style>

</head>
<body>

<!-- Discord Icon -->
<a href="https://discord.gg/WBYkWfPQC2" target="_blank">
  <img class="discord-btn" src="https://upload.wikimedia.org/wikipedia/commons/9/98/Discord_logo.svg">
</a>

<div class="card">

  <h1>NyoaSS Luau Obfuscator</h1>

  <div class="desc">
    Protects Luau scripts from stealing, dumping, unpacking, logic tracing,  
    memory scanning, value spoofing and reverse‑engineering.
  </div>

  <textarea id="code" placeholder="Paste your Luau script..."></textarea>
  <input id="password" type="text" placeholder="Protection Password">

  <button onclick="generate()">Generate Loadstring</button>

  <div id="resultBox" class="result-box">
    <div class="small-title">Your Loadstring:</div>
    <span id="output"></span>
  </div>

</div>

<script>
function generate(){
  const code = document.getElementById("code").value;
  const pass = document.getElementById("password").value;

  if(!code || !pass){
    alert("Fill all fields.");
    return;
  }

  fetch("/save", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ code, pass })
  })
  .then(r=>r.json())
  .then(data=>{
    const rawURL = location.origin + "/raw/" + data.id;
    const load = \`loadstring(game:HttpGet("\${rawURL}"))()\`;

    document.getElementById("output").innerText = load;
    document.getElementById("resultBox").style.display = "block";
  });
}
</script>

</body>
</html>
`);
});

// ===================== API: SAVE CODE =====================
app.post("/save", (req,res) => {
  const { code, pass } = req.body;
  const id = Math.random().toString(36).substring(2,10);
  codes[id] = { code, pass };
  res.json({ id });
});

// ===================== RAW ENDPOINT =====================
app.get("/raw/:id", (req,res) => {
  const item = codes[req.params.id];
  if (!item) return res.status(404).send("Not found");

  const ua = req.get("User-Agent") || "";

  if (!ua.includes("Roblox")) {
    return res.send(`
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Password</title>
<style>
body {
  background:#0f0f0f;
  color:white;
  font-family:Arial;
  height:100vh;
  display:flex;
  justify-content:center;
  align-items:center;
  margin:0;
}
.box {
  background:#171717;
  width:90%;
  max-width:330px;
  padding:30px;
  border-radius:16px;
  text-align:center;
  box-shadow:0 0 25px rgba(125,76,255,.25);
  animation:fadeIn .3s;
}
@keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
input {
  width:100%;
  padding:12px;
  margin-top:14px;
  border:none;
  border-radius:10px;
  background:#222;
  color:white;
}
button {
  padding:12px 20px;
  margin-top:18px;
  border:none;
  background:#7d4cff;
  color:white;
  border-radius:12px;
  width:100%;
}
</style>
</head>
<body>
<div class="box">
<h2>Password Required</h2>
<form method="GET" action="/raw/${req.params.id}/check">
<input type="password" name="pass" placeholder="Password">
<button>Open</button>
</form>
</div>
</body></html>
`);
  }

  res.set("Content-Type","text/plain");
  res.send(item.code);
});

// ===================== PASSWORD CHECK =====================
app.get("/raw/:id/check", (req,res) => {
  const item = codes[req.params.id];
  if (!item) return res.status(404).send("Not found");

  if ((req.query.pass || "") !== item.pass)
    return res.send("Wrong password");

  res.set("Content-Type", "text/plain");
  res.send(item.code);
});

// ===================== START =====================
app.listen(PORT, () => console.log("Server running on port", PORT));
