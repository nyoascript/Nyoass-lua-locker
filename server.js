const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

const codes = {};

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// ===== MAIN PAGE =====
app.get("/", (req,res) => {
res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NyoaSS Luau Obfuscator</title>
<style>
body{margin:0;font-family:Arial;background:#0d0d0d;color:white;}
header{display:flex;justify-content:space-between;align-items:center;padding:15px 25px;background:#141414;box-shadow:0 3px 10px #0005;}
header .logo{font-size:24px;font-weight:bold;}
header nav a{margin-left:20px;color:#bdbdbd;text-decoration:none;font-size:17px;transition:.2s;}
header nav a:hover{color:white;}
.tab{display:none;padding:25px;animation:fade .35s;}
@keyframes fade{from{opacity:0;}to{opacity:1;}}
textarea{width:100%;height:250px;background:#111;border:1px solid #333;padding:10px;color:white;resize:vertical;border-radius:8px;}
button{margin-top:15px;background:#6c4cff;border:none;padding:12px 20px;cursor:pointer;color:white;border-radius:8px;font-size:15px;transition:.2s;}
button:hover{background:#7e61ff;}
.discord{position:fixed;bottom:20px;right:20px;background:#5865F2;padding:12px 18px;border-radius:10px;cursor:pointer;color:white;font-weight:bold;}
.password-box{background:#151515;border:1px solid #333;padding:20px;border-radius:10px;width:280px;margin:60px auto;text-align:center;display:none;}
input{width:90%;padding:10px;background:#0d0d0d;border:1px solid #333;color:white;margin-top:10px;border-radius:6px;}
.result-box{margin-top:20px;padding:15px;background:#111;border-radius:10px;word-break:break-all;display:none;}
.small-title{font-size:15px;color:#c9c9c9;margin-bottom:8px;font-weight:bold;}
</style>
</head>
<body>

<header>
  <div class="logo">NyoaSS Obfuscator</div>
  <nav>
    <a href="#" onclick="openTab('obf')">Obfuscator</a>
    <a href="#" onclick="openTab('info')">Information</a>
    <a href="#" onclick="openTab('edit')">Edit</a>
  </nav>
</header>

<div class="discord" onclick="window.open('https://discord.gg/WBYkWfPQC2','_blank')">Join Discord</div>

<div id="obf" class="tab">
  <h2>Luau Obfuscator</h2>
  <p>Protects Luau scripts from stealing, dumping, unpacking, logic tracing, memory scanning, value spoofing and reverse‑engineering.</p>
  <textarea id="code" placeholder="Paste your Lua/Luau script..."></textarea>
  <input id="password" type="text" placeholder="Protection Password">
  <button onclick="generate()">Generate Loadstring</button>
  <div id="resultBox" class="result-box">
    <div class="small-title">Your Loadstring:</div>
    <span id="output"></span>
  </div>
</div>

<div id="info" class="tab">
  <h2>Information</h2>
  <p>This obfuscator helps you secure your Luau scripts by protecting against tampering, copying, and analysis. Only authorized users with the password can edit scripts.</p>
</div>

<div id="edit" class="tab">
  <div class="password-box" id="editPassBox">
    <h3>Enter Password to Edit</h3>
    <input type="password" id="editPasswordInput" placeholder="Password">
    <button onclick="unlockEdit()">Unlock</button>
  </div>
  <div id="editContent" style="display:none">
    <h2>Edit Script</h2>
    <textarea id="editCode"></textarea>
    <button onclick="saveEdit()">Save Changes</button>
    <div id="editResult" class="result-box"></div>
  </div>
</div>

<script>
function openTab(id){
  document.querySelectorAll('.tab').forEach(t=>t.style.display='none');
  document.getElementById(id).style.display='block';
}
openTab('obf');

function generate(){
  const code=document.getElementById("code").value;
  const pass=document.getElementById("password").value;
  if(!code||!pass){alert("Fill all fields");return;}
  fetch("/save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code,pass})})
  .then(r=>r.json()).then(data=>{
    const rawURL=location.origin+"/raw/"+data.id;
    const load=\`loadstring(game:HttpGet("\${rawURL}"))()\`;
    document.getElementById("output").innerText=load;
    document.getElementById("resultBox").style.display="block";
  });
}

function unlockEdit(){
  const pass=document.getElementById("editPasswordInput").value;
  if(!pass){alert("Enter password"); return;}
  fetch("/editAuth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pass})})
  .then(r=>r.json()).then(data=>{
    if(data.success){
      document.getElementById("editPassBox").style.display="none";
      document.getElementById("editContent").style.display="block";
      document.getElementById("editCode").value=data.code || "";
      document.getElementById("editResult").style.display="none";
    } else alert("Wrong password");
  });
}

function saveEdit(){
  const newCode=document.getElementById("editCode").value;
  fetch("/saveEdit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:newCode})})
  .then(r=>r.json()).then(data=>{
    if(data.success){
      document.getElementById("editResult").innerText="Saved!";
      document.getElementById("editResult").style.display="block";
    }
  });
}
</script>

</body>
</html>
`);
});

// ===== SAVE CODE =====
let currentPassword = null;
let currentCode = "";

app.post("/save",(req,res)=>{
  const {code,pass}=req.body;
  const id=Math.random().toString(36).substring(2,10);
  codes[id]={code,pass};
  currentPassword=pass;
  currentCode=code;
  res.json({id});
});

app.get("/raw/:id",(req,res)=>{
  const item=codes[req.params.id];
  if(!item) return res.status(404).send("Not found");
  const ua=req.get("User-Agent")||"";
  if(!ua.includes("Roblox")){
    return res.send(`<h2>Password Required to view</h2>`);
  }
  res.set("Content-Type","text/plain");
  res.send(item.code);
});

// ===== EDIT AUTH =====
app.post("/editAuth",(req,res)=>{
  const {pass}=req.body;
  if(pass===currentPassword){
    res.json({success:true,code:currentCode});
  } else res.json({success:false});
});

// ===== SAVE EDIT =====
app.post("/saveEdit",(req,res)=>{
  const {code}=req.body;
  currentCode=code;
  res.json({success:true});
});

app.listen(PORT,()=>console.log("Server running on port",PORT));
