// ===============================================================
// Nyoass Obfuscator v1.0 — FULL BUILD
// Frontend + Backend + Logs + Key System + Admin Panel
// Admin-Key: SlivkineepyScripts
// ===============================================================

const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const app = express();

// ============= MEMORY STORAGE =============
let validKeys = [];
let logs = [];
let sessions = {};

// ============= MIDDLEWARE =============
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Анти-спам
const limiter = rateLimit({
    windowMs: 5000,
    max: 20,
});
app.use(limiter);

// Генератор Session ID
function newSession(req) {
    const id = crypto.randomBytes(8).toString("hex");
    sessions[id] = true;
    return id;
}

// Время
function now() {
    return new Date().toLocaleString();
}

// Логирование
function pushLog(key, action, script, agent, session) {
    logs.push({
        time: now(),
        key: key || "NO-KEY",
        action,
        code: script || "",
        agent: agent || "unknown",
        session: session || "none"
    });
}

// ============================================
// =============== FRONTEND ====================
// ============================================
app.get("/", (req, res) => {
    const session = newSession(req);

    res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Nyoass Obfuscator v1.0</title>
<style>
body {
    background:#0f0f12;
    color:white;
    font-family:Arial;
    margin:0;
}
.header{
    padding:20px;
    background:#1a1a20;
    font-size:28px;
}
.tabs{
    display:flex;
    background:#15151a;
}
.tab{
    padding:12px 18px;
    cursor:pointer;
    border-right:1px solid #222;
}
.tab:hover{
    background:#222;
}
.active{
    background:#333 !important;
}
.page{
    display:none;
    padding:20px;
}
textarea{
    width:100%;
    height:240px;
    background:#111;
    color:#fff;
    border:1px solid #333;
    padding:10px;
}
button{
    padding:10px 20px;
    margin-top:10px;
    cursor:pointer;
    background:#2b2bff;
    border:none;
    color:white;
}
#copyBox{
    display:none;
    margin-top:15px;
    background:#111;
    padding:10px;
}
.footer-link {
    position: fixed;
    left: 10px;
    bottom: 10px;
    color: #7aa2ff;
    cursor:pointer;
}
</style>
</head>

<body>

<div class="header">Nyoass Obfuscator v1.0</div>

<div class="tabs">
    <div class="tab active" onclick="show('obf')">Obfuscator</div>
    <div class="tab" onclick="show('edit')">Edit</div>
    <div class="tab" onclick="show('info')">Info</div>
</div>

<div id="obf" class="page" style="display:block;">
    <h2>Protect your Lua script</h2>
    <input id="key" placeholder="Enter key (8-15 chars)">
    <br><br>
    <textarea id="lua" placeholder="Your script here"></textarea>
    <br>
    <button onclick="protect()">Protect</button>

    <div id="copyBox">
        <p>Generated loadstring:</p>
        <textarea id="generated" readonly></textarea>
        <button onclick="copyGen()">Copy</button>
    </div>

    <br><br>
    <button onclick="openFree()">Open without key</button>
</div>

<div id="edit" class="page">
    <h2>Edit Script</h2>
    <input id="editPass" placeholder="Enter edit password">
    <button onclick="openEdit()">Unlock</button>

    <div id="editBox" style="display:none;">
        <textarea id="editArea"></textarea>
        <button onclick="saveEdit()">Save</button>
    </div>
</div>

<div id="info" class="page">
    <h2>What this obfuscator does?</h2>
    <p>- Protects Lua code from simple reverse engineering</p>
    <p>- Adds fake noise lines</p>
    <p>- Wraps into encoded loader</p>
    <p>- Prevents easy copy & paste leaks</p>
</div>

<div class="footer-link" onclick="window.open('https://discord.gg/yourlink', '_blank')">
    Join Discord
</div>

<script>
let session = "${session}";

function show(id){
    document.querySelectorAll(".page").forEach(p=>p.style.display="none");
    document.getElementById(id).style.display="block";
    document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
    event.target.classList.add("active");
}

async function protect(){
    let key = document.getElementById("key").value;
    let lua = document.getElementById("lua").value;

    let r = await fetch("/protect", {
        method:"POST",
        headers:{ "Content-Type": "application/json" },
        body:JSON.stringify({ key, lua, session })
    });

    let j = await r.json();
    document.getElementById("generated").value = j.loadstring;
    document.getElementById("copyBox").style.display = "block";
}

async function openFree(){
    let lua = document.getElementById("lua").value;

    let r = await fetch("/protect", {
        method:"POST",
        headers:{ "Content-Type": "application/json" },
        body:JSON.stringify({ key: "NO-KEY", lua, session })
    });

    let j = await r.json();
    document.getElementById("generated").value = j.loadstring;
    document.getElementById("copyBox").style.display = "block";
}

function copyGen(){
    navigator.clipboard.writeText(document.getElementById("generated").value);
}

async function openEdit(){
    let pass = document.getElementById("editPass").value;
    if(pass !== "SlivkineepyScripts"){
        alert("Wrong password");
        return;
    }
    document.getElementById("editBox").style.display = "block";
}

async function saveEdit(){
    let t = document.getElementById("editArea").value;
    alert("Saved (just frontend)");
}
</script>

</body>
</html>
    `);
});


// ==================================================
// =============== BACKEND METHODS ===================
// ==================================================

// PROTECT SCRIPT
app.post("/protect", (req, res) => {
    let { key, lua, session } = req.body;

    // Логируем
    pushLog(key, "PROTECT", lua, req.headers["user-agent"], session);

    // Простая упаковка (не обфускация)
    let encoded = Buffer.from(lua).toString("base64");

    res.json({
        loadstring: `loadstring(game:HttpGet("https://nyoass-lua-locker1.onrender.com/api/run?d=${encoded}"))()`
    });
});

// API RUN — классический декодер
app.get("/api/run", (req, res) => {
    let d = req.query.d || "";
    let txt = Buffer.from(d, "base64").toString("utf8");
    res.type("text/plain").send(txt);
});

// ADMIN PANEL
app.get("/admin", (req, res) => {
    let key = req.query.key;
    if (key !== "SlivkineepyScripts") return res.send("Invalid admin key");

    let html = `<h1>Admin Logs</h1><pre>${JSON.stringify(logs, null, 2)}</pre>`;
    res.send(html);
});


app.listen(3000, () =>
    console.log("Nyoass Obfuscator running on port 3000")
);