const express    = require('express');
const fs         = require('fs');
const path       = require('path');
const { execSync } = require('child_process');
const os         = require('os');
const crypto     = require('crypto');

const app = express();
app.use(express.json({ limit: '500kb' }));

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>PPTX Generator</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--primary:#1E2761;--accent:#028090;--bg:#F4F6FB;--surface:#fff;--border:#E2E8F0;--text:#1A1A2E;--muted:#64748B}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;display:flex;flex-direction:column}
header{background:var(--primary);padding:0 2rem;height:60px;display:flex;align-items:center;justify-content:space-between}
.logo{color:#fff;font-size:1.1rem;font-weight:700;display:flex;align-items:center;gap:10px}
.logo-dot{width:10px;height:10px;background:#02C39A;border-radius:50%}
.badge{background:rgba(2,192,154,0.2);color:#02C39A;border:1px solid rgba(2,192,154,0.4);border-radius:20px;padding:3px 12px;font-size:0.78rem;font-weight:600}
main{flex:1;max-width:820px;width:100%;margin:2rem auto;padding:0 1.5rem}
.hero{text-align:center;margin-bottom:2rem}
.hero h1{font-size:1.8rem;font-weight:700;color:var(--primary);margin-bottom:.5rem}
.hero p{color:var(--muted);font-size:.95rem;line-height:1.6}
.steps{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:1.5rem}
.step{display:flex;align-items:center;gap:7px;background:#fff;border:1px solid var(--border);border-radius:30px;padding:5px 13px;font-size:.82rem;color:var(--muted)}
.sn{width:20px;height:20px;background:var(--accent);color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;flex-shrink:0}
.card{background:#fff;border:1px solid var(--border);border-radius:10px;box-shadow:0 2px 12px rgba(30,39,97,.07);padding:1.5rem;margin-bottom:1rem}
.card-title{font-size:.9rem;font-weight:600;margin-bottom:1rem;color:var(--text)}
.row{display:flex;align-items:center;gap:10px;margin-bottom:.4rem}
label{font-size:.85rem;font-weight:600;white-space:nowrap}
input[type=text]{flex:1;border:1px solid var(--border);border-radius:7px;padding:7px 11px;font-size:.88rem;color:var(--text);background:var(--bg);outline:none}
input[type=text]:focus{border-color:var(--accent)}
.hint{font-size:.75rem;color:var(--muted)}
.ta-wrap{position:relative}
textarea{width:100%;min-height:300px;border:1px solid var(--border);border-radius:8px;padding:13px;font-family:'SF Mono',Consolas,monospace;font-size:.8rem;line-height:1.6;color:#1e3a5f;background:#F8FAFF;resize:vertical;outline:none}
textarea:focus{border-color:var(--accent)}
textarea::placeholder{color:#94A3B8;font-style:italic}
.cc{position:absolute;bottom:9px;right:12px;font-size:.7rem;color:var(--muted);background:rgba(255,255,255,.85);padding:1px 5px;border-radius:4px}
.toolbar{display:flex;align-items:center;justify-content:space-between;margin-top:.9rem;flex-wrap:wrap;gap:8px}
.btn-clear{background:none;border:1px solid var(--border);border-radius:7px;padding:7px 15px;font-size:.83rem;color:var(--muted);cursor:pointer}
.btn-clear:hover{border-color:#DC2626;color:#DC2626}
.btn-go{background:var(--primary);color:#fff;border:none;border-radius:8px;padding:9px 26px;font-size:.92rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:7px;box-shadow:0 2px 8px rgba(30,39,97,.25)}
.btn-go:hover:not(:disabled){background:#28349e}
.btn-go:disabled{background:var(--muted);cursor:not-allowed;box-shadow:none}
#status{margin-top:.9rem}
.sb{border-radius:8px;padding:13px 15px;display:flex;align-items:flex-start;gap:11px;font-size:.88rem;line-height:1.5;animation:fi .2s ease}
@keyframes fi{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}
.sb.loading{background:#EFF6FF;border:1px solid #BFDBFE;color:#1E40AF}
.sb.success{background:#ECFDF5;border:1px solid #6EE7B7;color:#065F46}
.sb.error{background:#FEF2F2;border:1px solid #FCA5A5;color:#991B1B}
.spin{width:17px;height:17px;border:2.5px solid #BFDBFE;border-top-color:#1E40AF;border-radius:50%;animation:sp .7s linear infinite;flex-shrink:0}
@keyframes sp{to{transform:rotate(360deg)}}
.dl-card{background:linear-gradient(135deg,#065A82,#028090);border-radius:10px;padding:1.3rem 1.5rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-top:.7rem;animation:fi .3s ease}
.dl-info{color:#fff}
.dl-info .fn{font-weight:700;font-size:.98rem;margin-bottom:3px}
.dl-info .fm{font-size:.78rem;opacity:.8}
.btn-dl{background:#fff;color:var(--primary);border:none;border-radius:8px;padding:9px 20px;font-size:.88rem;font-weight:700;cursor:pointer;white-space:nowrap}
.btn-dl:hover{background:#EFF6FF}
.err-detail{margin-top:7px;font-family:monospace;font-size:.75rem;background:#FEE2E2;border-radius:5px;padding:7px 9px;white-space:pre-wrap;word-break:break-word;max-height:140px;overflow-y:auto;color:#7F1D1D}
.info{background:#FFFBEB;border:1px solid #FCD34D;border-radius:8px;padding:11px 15px;font-size:.8rem;color:#78350F;line-height:1.6}
footer{text-align:center;padding:1.2rem;color:var(--muted);font-size:.75rem;border-top:1px solid var(--border)}
</style>
</head>
<body>
<header>
  <div class="logo"><div class="logo-dot"></div>PPTX Generator</div>
  <span class="badge">IBM Agent Executor</span>
</header>
<main>
  <div class="hero">
    <h1>PowerPoint File Generator</h1>
    <p>Paste the Node.js script from your IBM Agent — this tool runs it and gives you the .pptx file instantly.</p>
  </div>
  <div class="steps">
    <div class="step"><div class="sn">1</div>Get script from IBM Agent</div>
    <div class="step"><div class="sn">2</div>Paste it below</div>
    <div class="step"><div class="sn">3</div>Click Generate</div>
    <div class="step"><div class="sn">4</div>Download your .pptx</div>
  </div>
  <div class="card">
    <div class="card-title">Output Filename</div>
    <div class="row">
      <label>File name:</label>
      <input type="text" id="filename" value="presentation" placeholder="e.g. quarterly_review"/>
      <span style="color:var(--muted);font-size:.85rem">.pptx</span>
    </div>
    <p class="hint">Letters, numbers, underscores only.</p>
  </div>
  <div class="card">
    <div class="card-title">Paste IBM Agent Script (complete Node.js / PptxGenJS code)</div>
    <div class="ta-wrap">
      <textarea id="script" spellcheck="false" autocomplete="off"
        placeholder="Paste the complete JavaScript code from your IBM Agent here...

const pptxgen = require('pptxgenjs');
let pres = new pptxgen();
// ... your slides ...
pres.writeFile({ fileName: 'output.pptx' });"></textarea>
      <span class="cc" id="cc">0 chars</span>
    </div>
    <div class="toolbar">
      <button class="btn-clear" onclick="clearAll()">Clear</button>
      <button class="btn-go" id="btn" onclick="generate()">&#9889; Generate PowerPoint</button>
    </div>
  </div>
  <div id="status"></div>
  <div class="info">
    <strong>Tips:</strong> Paste the complete script including <code>require('pptxgenjs')</code> at the top.
    The writeFile filename is handled automatically — use the field above to name your file.
    If you get an error, copy it and send back to IBM Agent to fix.
  </div>
</main>
<footer>PPTX Generator &nbsp;•&nbsp; IBM Agent Executor &nbsp;•&nbsp; Powered by PptxGenJS</footer>
<script>
const ta=document.getElementById('script'),cc=document.getElementById('cc'),btn=document.getElementById('btn'),st=document.getElementById('status');
let dlUrl=null;
ta.addEventListener('input',()=>{ cc.textContent=ta.value.length.toLocaleString()+' chars'; });
function clearAll(){ ta.value=''; cc.textContent='0 chars'; st.innerHTML=''; if(dlUrl){URL.revokeObjectURL(dlUrl);dlUrl=null;} }
function setLoading(on){ btn.disabled=on; btn.innerHTML=on?'<div class="spin"></div> Generating...':'&#9889; Generate PowerPoint'; }
function showStatus(type,html){ st.innerHTML='<div class="sb '+type+'">'+html+'</div>'; }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
ta.addEventListener('keydown',e=>{ if((e.ctrlKey||e.metaKey)&&e.key==='Enter') generate(); });
async function generate(){
  const script=ta.value.trim();
  if(!script){ showStatus('error','Please paste a script first.'); return; }
  let filename=(document.getElementById('filename').value.trim()||'presentation').replace(/[^a-zA-Z0-9_-]/g,'_');
  setLoading(true);
  showStatus('loading','<div class="spin"></div>&nbsp; Running your script — usually takes 5–10 seconds...');
  if(dlUrl){ URL.revokeObjectURL(dlUrl); dlUrl=null; }
  try{
    const resp=await fetch('/generate',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({script,filename}) });
    if(!resp.ok){
      const d=await resp.json().catch(()=>({error:'Unknown error',detail:''}));
      showStatus('error','<strong>Generation failed.</strong> '+esc(d.error||'')+(d.detail?'<div class="err-detail">'+esc(d.detail)+'</div>':'')+'<br><br><small>Copy the error above and send it to your IBM Agent to fix the script.</small>');
      return;
    }
    const blob=await resp.blob();
    dlUrl=URL.createObjectURL(blob);
    const kb=Math.round(blob.size/1024);
    showStatus('success','<strong>PowerPoint generated!</strong> Your file is ready.');
    st.innerHTML+='<div class="dl-card"><div class="dl-info"><div class="fn">&#128202; '+esc(filename)+'.pptx</div><div class="fm">'+kb+' KB &nbsp;•&nbsp; Ready to open in PowerPoint</div></div><a href="'+dlUrl+'" download="'+esc(filename)+'.pptx"><button class="btn-dl">&#8659; Download .pptx</button></a></div>';
  }catch(err){
    showStatus('error','<strong>Connection error.</strong> '+esc(err.message));
  }finally{
    setLoading(false);
  }
}
</script>
</body>
</html>`;

app.get('/', (req, res) => res.send(HTML));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.post('/generate', async (req, res) => {
  const { script } = req.body;
  if (!script || script.trim().length < 20)
    return res.status(400).json({ error: 'No script provided.' });

  const forbidden = [/require\s*\(\s*['"`]child_process/, /process\.exit/, /eval\s*\(/, /Function\s*\(/, /\bspawn\b/];
  for (const p of forbidden)
    if (p.test(script)) return res.status(400).json({ error: 'Script contains disallowed operations.' });

  const jobId   = crypto.randomBytes(8).toString('hex');
  const workDir = path.join(os.tmpdir(), `pptx_${jobId}`);
  const outFile = path.join(workDir, 'output.pptx');
  fs.mkdirSync(workDir, { recursive: true });

  let patched = script
    .replace(/writeFile\s*\(\s*\{[^}]*\}\s*\)/g, `writeFile({ fileName: ${JSON.stringify(outFile)} })`)
    .replace(/writeFile\s*\(\s*['"\`][^'"\`]+['"\`]\s*\)/g, `writeFile({ fileName: ${JSON.stringify(outFile)} })`);
  patched = `process.chdir(${JSON.stringify(__dirname)});\n` + patched;

  fs.writeFileSync(path.join(workDir, 'script.js'), patched, 'utf8');

  try {
    execSync(`node "${path.join(workDir, 'script.js')}"`, {
      timeout: 30000, cwd: __dirname,
      env: { ...process.env, NODE_PATH: path.join(__dirname, 'node_modules') },
    });
    if (!fs.existsSync(outFile))
      return res.status(500).json({ error: 'Script ran but no .pptx file was created. Make sure it ends with pres.writeFile()' });

    const filename = (req.body.filename || 'presentation').replace(/[^a-zA-Z0-9_-]/g, '_') + '.pptx';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    const stream = fs.createReadStream(outFile);
    stream.pipe(res);
    stream.on('end',  () => fs.rmSync(workDir, { recursive: true, force: true }));
    stream.on('error',() => fs.rmSync(workDir, { recursive: true, force: true }));
  } catch (err) {
    fs.rmSync(workDir, { recursive: true, force: true });
    return res.status(500).json({ error: 'Script execution failed.', detail: ((err.stderr||'') + (err.message||'')).slice(0,1000) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PPTX Executor running on port ${PORT}`));
