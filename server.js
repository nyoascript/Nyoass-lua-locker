const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

const codes = {};

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

function obfuscateLuau(src) {
    const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    const r = () => c[Math.floor(Math.random() * 64)];
    const rs = (l) => Array.from({length:l},r).join("");
    const rn = () => Math.floor(Math.random()*899999)+100000;

    const t = Array.from({length:42},()=>`"${Array.from({length:12},()=>"\\"+rn()).join("")}"`);
    t.push(`"${src.replace(/"/g,'\\"').replace(/\\/g,"\\\\")}"`);

    for(let i=t.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [t[i],t[j]]=[t[j],t[i]];
    }

    const idx = t.length-1;
    const acc = `local function Q(n)return t[n+${rn()}-${rn()}]end`;

    let junk = "";
    for(let i=0;i<39;i++)junk+=`local ${rs(11)}=function()return ${rn()} end `;

    return `local t={${t.join(",")}}
${junk}
${acc}
return loadstring(Q(${idx-41}))()`;
}

function deobfuscateLuau(code){
    try{
        const m = code.match(/local t=\{([^}]+)\}/);
        if(!m)return"-- failed";
        const arr = m[1].split(",").map(s=>s.trim().slice(1,-1)).filter(s=>!s.includes("\\\\"));
        return arr.length===1?arr[0].replace(/\\"/g,'"').replace(/\\\\/g,"\\"):"-- failed";
    }catch{return"-- failed"}
}

app.get("/",(req,res)=>{
    res.send(`<!DOCTYPE html>
<html><head><title>Obfuscator</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>
body{margin:0;background:#0d0d0d;color:#fff;font-family:Arial}
.tabs{display:flex;justify-content:center;margin-top:20px}
.tab{padding:12px 22px;margin:4px;background:#1b1b1b;border-radius:10px;cursor:pointer}
.tab:hover{background:#242424}
.active{background:#7d4cff}
.card{background:#161616;margin:20px auto;padding:25px;border-radius:18px;width:92%;max-width:650px;box-shadow:0 0 24px rgba(125,76,255,.35)}
textarea,input{width:100%;padding:14px;margin-top:12px;border:none;border-radius:12px;background:#222;color:#fff}
textarea{height:170px;resize:none}
button{width:100%;padding:14px;background:#7d4cff;border:none;border-radius:12px;margin-top:20px;color:#fff;font-size:17px;cursor:pointer}
.result{margin-top:20px;background:#111;padding:14px;border-radius:12px;word-break:break-all;display:none}
#discord{position:fixed;left:15px;bottom:15px;background:#5865F2;padding:10px 14px;border-radius:10px;color:#fff;text-decoration:none}
</style></head><body>
<a id="discord" href="https://discord.gg/WBYkWfPQC2" target="_blank">Discord</a>
<div class="tabs">
<div class="tab active" onclick="openTab('obf')">Obfuscator</div>
<div class="tab" onclick="openTab('edit')">Edit</div>
<div class="tab" onclick="openTab('info')">Info</div>
</div>
<div id="obf" class="card">
<h2>Obfuscator</h2>
<textarea id="code" placeholder="Paste Luau..."></textarea>
<input id="password" placeholder="Password">
<button onclick="gen()">Generate</button>
<div id="out" class="result"></div>
</div>
<div id="edit" class="card" style="display:none">
<h2>Edit</h2>
<input id="eid" placeholder="ID">
<input id="epass" placeholder="Password">
<button onclick="loadEdit()">Load</button>
<textarea id="editBox" style="display:none"></textarea>
<button id="saveBtn" style="display:none" onclick="saveEdit()">Save</button>
<button id="deobfBtn" style="display:none;background:#444" onclick="deobf()">Deobfuscate</button>
<div id="editStatus"></div>
</div>
<div id="info" class="card" style="display:none">
<h2>Info</h2>
<p>Protected scripts • WeAreDevs style • 2025</p>
</div>
<script>
function openTab(id){
 document.querySelectorAll(".card").forEach(x=>x.style.display="none");
 document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
 document.getElementById(id).style.display="block";
 event.target.classList.add("active");
}
function gen(){
 const c=code.value.trim(),p=password.value;
 if(!c||!p){alert("Fill all");return;}
 fetch("/save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:c,pass:p})})
 .then(r=>r.json()).then(d=>{
  const raw=location.origin+"/raw/"+d.id;
  out.style.display="block";
  out.innerText=\`loadstring(game:HttpGet("\${raw}"))()\`;
 });
}
function loadEdit(){
 fetch("/get?id="+eid.value+"&pass="+epass.value).then(r=>r.json()).then(d=>{
  if(!d.ok){editStatus.innerText="Wrong ID/pass";return;}
  editBox.style.display="block";saveBtn.style.display="block";deobfBtn.style.display="block";
  editBox.value=d.code;editStatus.innerText="Loaded";
 });
}
function saveEdit(){
 fetch("/update",{method:"POST",headers:{"Content-Type":"application/json"},
  body:JSON.stringify({id:eid.value,pass:epass.value,code:editBox.value}))
 .then(r=>r.json()).then(d=>editStatus.innerText=d.ok?"Saved":"Failed");
}
function deobf(){
 fetch("/deobf",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:editBox.value})})
 .then(r=>r.json()).then(d=>editBox.value=d.code);
}
</script></body></html>`);
});

app.post("/save",(req,res)=>{
    const {code,pass}=req.body;
    if(!code||!pass)return res.status(400).json({error:"empty"});
    const id=Math.random().toString(36).substr(2,10);
    codes[id]={code:obfuscateLuau(code),pass};
    res.json({id});
});

app.get("/get",(req,res)=>{
    const {id,pass}=req.query;
    const item=codes[id];
    if(!item||item.pass!==pass)return res.json({ok:false});
    res.json({ok:true,code:item.code});
});

app.post("/update",(req,res)=>{
    const {id,pass,code}=req.body;
    const item=codes[id];
    if(!item||item.pass!==pass)return res.json({ok:false});
    item.code=obfuscateLuau(code);
    res.json({ok:true});
});

app.post("/deobf",(req,res)=>{
    res.json({code:deobfuscateLuau(req.body.code)});
});

app.get("/raw/:id",(req,res)=>{
    const item=codes[req.params.id];
    if(!item)return res.status(404).send("Not found");
    if(!(req.get("User-Agent")||"").includes("Roblox")){
        return res.send(`<!DOCTYPE html><html><head><title>Password</title><style>
        body{background:#0d0d0d;color:#fff;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:Arial}
        .box{background:#171717;padding:30px;border-radius:16px;width:90%;max-width:340px;text-align:center}
        input,button{width:100%;padding:12px;margin-top:14px;border:none;border-radius:10px;background:#222;color:#fff}
        button{background:#7d4cff;cursor:pointer}
        </style></head><body><div class="box"><h2>Password</h2>
        <form method="GET" action="/raw/${req.params.id}/check">
        <input name="pass" type="password" placeholder="Password" required>
        <button>Enter</button></form></div></body></html>`);
    }
    res.set("Content-Type","text/plain").send(item.code);
});

app.get("/raw/:id/check",(req,res)=>{
    const item=codes[req.params.id];
    if(!item||req.query.pass!==item.pass)return res.send("Wrong password");
    res.set("Content-Type","text/plain").send(item.code);
});

app.listen(PORT,()=>console.log("Server running on port "+PORT));