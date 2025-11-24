const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

const codes = {};

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// ===================== MAIN SITE =====================
app.get("/", (req, res) => {
res.send(`<!DOCTYPE html>
<html lang="en"><head>
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
}
.top-menu {
  position:fixed; top:12px; left:50%; transform:translateX(-50%);
  display:flex; gap:20px;
}
.tab {
  padding:10px 20px; background:#191919;
  border-radius:12px; cursor:pointer;
  box-shadow:0 0 10px rgba(125,76,255,.3);
}
.discord-btn {
  position:fixed; top:22px; right:22px;
  padding:12px 20px; background:#5865f2;
  border-radius:12px; cursor:pointer;
}
.card {
  background:#161616; padding:35px;
  width:92%; max-width:600px;
  border-radius:20px;
  box-shadow:0 0 30px rgba(125,76,255,.3);
}
textarea, input {
  width:100%; padding:14px;
  background:#222; border:none;
  border-radius:12px; margin-top:14px;
  color:white;
}
textarea { height:170px; resize:none; }
button {
  width:100%; padding:15px;
  margin-top:20px; background:#7d4cff;
  border:none; border-radius:14px;
  color:white; cursor:pointer;
}
.result-box {
  margin-top:25px;
  padding:15px; background:#111;
  border-radius:12px; word-break:break-all;
  display:none;
}
.hidden { display:none; }
</style>

</head>
<body>

<div class="top-menu">
  <div class="tab" onclick="openTab('obf')">Obfuscator</div>
  <div class="tab" onclick="openTab('info')">Information</div>
  <div class="tab" onclick="openTab('edit')">Edit</div>
</div>

<a href="https://discord.gg/WBYkWfPQC2" target="_blank">
  <div class="discord-btn">Join Discord</div>
</a>

<div class="card">

  <!-- OBF -->
  <div id="obfTab">
    <h1>NyoaSS Luau Obfuscator</h1>
    <textarea id="code" placeholder="Paste your script..."></textarea>
    <input id="password" type="text" placeholder="Password">
    <button onclick="generate()">Generate Loadstring</button>
    <div id="resultBox" class="result-box"><span id="output"></span></div>
  </div>

  <!-- INFO -->
  <div id="infoTab" class="hidden">
    <h1>Information</h1>
    <div>Secure cloud-based Luau obfuscation.</div>
  </div>

  <!-- EDIT -->
  <div id="editTab" class="hidden">
    <h1>Edit Script</h1>
    <input id="edit_id" placeholder="ID">
    <input id="edit_pass" placeholder="Password" type="password">
    <button onclick="loadForEdit()">Load</button>
    <textarea id="edit_area" class="hidden"></textarea>
    <button id="save_btn" class="hidden" onclick="saveEdited()">Save</button>
    <div id="editStatus"></div>
  </div>

</div>

<script>
function openTab(tab){
  obfTab.classList.add("hidden");
  infoTab.classList.add("hidden");
  editTab.classList.add("hidden");
  document.getElementById(tab+"Tab").classList.remove("hidden");
}

function generate(){
  const code = codeInput.value;
  const pass = password.value;
  if(!code || !pass) return alert("Fill all fields");

  fetch("/save", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ code, pass })
  })
  .then(r=>r.json())
  .then(d=>{
    const url = location.origin + "/raw/" + d.id;
    output.innerText = \`loadstring(game:HttpGet("\${url}"))()\`;
    resultBox.style.display = "block";
  });
}

function loadForEdit(){
  const id = edit_id.value;
  const pass = edit_pass.value;
  fetch("/edit/load?id="+id+"&pass="+pass)
    .then(r=>r.text())
    .then(t=>{
      if(t.startsWith("ERR")){
        editStatus.innerText = t;
        return;
      }
      edit_area.classList.remove("hidden");
      save_btn.classList.remove("hidden");
      edit_area.value = t;
      editStatus.innerText = "Loaded!";
    });
}

function saveEdited(){
  const id = edit_id.value;
  const pass = edit_pass.value;
  const code = edit_area.value;

  fetch("/edit/save", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ id, pass, code })
  })
  .then(r=>r.text())
  .then(t=>{
    editStatus.innerText = t;
  });
}
</script>

</body></html>
`);
});

// SAVE
app.post("/save", (req,res)=>{
  const { code, pass } = req.body;
  const id = Math.random().toString(36).slice(2,10);
  codes[id] = { code, pass };
  res.json({ id });
});

// RAW — with password page
app.get("/raw/:id", (req,res)=>{
  const item = codes[req.params.id];
  if(!item) return res.status(404).send("Not found");

  const ua = req.get("User-Agent") || "";

  // if not Roblox — show password page
  if(!ua.includes("Roblox")){
    return res.send(`
    <html><body style="background:#0f0f0f;color:white;display:flex;justify-content:center;align-items:center;height:100vh;">
    <form method="GET" action="/raw/${req.params.id}/check">
      <input name="pass" type="password" placeholder="Password">
      <button>Open</button>
    </form></body></html>`);
  }

  res.set("Content-Type","text/plain");
  res.send(item.code);
});

// RAW PASS CHECK
app.get("/raw/:id/check", (req,res)=>{
  const item = codes[req.params.id];
  if(!item) return res.send("Not found");
  if(req.query.pass !== item.pass) return res.send("Wrong password");
  res.set("Content-Type","text/plain");
  res.send(item.code);
});

// EDIT LOAD
app.get("/edit/load", (req,res)=>{
  const { id, pass } = req.query;
  const item = codes[id];
  if(!item) return res.send("ERR: Not found");
  if(item.pass !== pass) return res.send("ERR: Wrong password");
  res.send(item.code);
});

// EDIT SAVE
app.post("/edit/save", (req,res)=>{
  const { id, pass, code } = req.body;
  const item = codes[id];
  if(!item) return res.send("ERR: Not found");
  if(item.pass !== pass) return res.send("ERR: Wrong password");
  item.code = code;
  res.send("Saved successfully.");
});

app.listen(PORT, ()=>console.log("Server running:", PORT));
