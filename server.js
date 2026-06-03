const express = require('express');
const fs      = require('fs');
const path    = require('path');
const { execSync } = require('child_process');
const os      = require('os');
const crypto  = require('crypto');

const app = express();
app.use(express.json({ limit: '500kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ── Execute script and return .pptx ──────────────────────────────────────────
app.post('/generate', async (req, res) => {
  const { script } = req.body;

  if (!script || script.trim().length < 20) {
    return res.status(400).json({ error: 'No script provided.' });
  }

  // Security: block dangerous patterns
  const forbidden = [
    /require\s*\(\s*['"`]child_process/,
    /require\s*\(\s*['"`]fs['"`]\s*\).*(?:unlink|rmdir|writeFile.*\/etc)/,
    /process\.exit/,
    /eval\s*\(/,
    /Function\s*\(/,
    /\bexec\b/,
    /\bspawn\b/,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(script)) {
      return res.status(400).json({ error: 'Script contains disallowed operations.' });
    }
  }

  // Rewrite writeFile to use our controlled output path
  const jobId    = crypto.randomBytes(8).toString('hex');
  const workDir  = path.join(os.tmpdir(), `pptx_${jobId}`);
  const outFile  = path.join(workDir, 'output.pptx');

  fs.mkdirSync(workDir, { recursive: true });

  // Patch the script:
  // 1. Replace any writeFile fileName with our fixed output path
  // 2. Make it work with local pptxgenjs (not -g)
  let patched = script
    .replace(/writeFile\s*\(\s*\{[^}]*\}\s*\)/g,
             `writeFile({ fileName: ${JSON.stringify(outFile)} })`)
    .replace(/writeFile\s*\(\s*['"\`][^'"\`]+['"\`]\s*\)/g,
             `writeFile({ fileName: ${JSON.stringify(outFile)} })`);

  // Ensure pptxgenjs resolves from local node_modules
  patched = `process.chdir(${JSON.stringify(__dirname)});\n` + patched;

  const scriptPath = path.join(workDir, 'script.js');
  fs.writeFileSync(scriptPath, patched, 'utf8');

  try {
    execSync(`node ${JSON.stringify(scriptPath)}`, {
      timeout: 30000,
      cwd: __dirname,
      env: { ...process.env, NODE_PATH: path.join(__dirname, 'node_modules') },
    });

    if (!fs.existsSync(outFile)) {
      return res.status(500).json({ error: 'Script ran but no .pptx file was created. Check that writeFile() is called.' });
    }

    const filename = (req.body.filename || 'presentation').replace(/[^a-zA-Z0-9_-]/g, '_') + '.pptx';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(outFile, () => {
      fs.rmSync(workDir, { recursive: true, force: true });
    });

  } catch (err) {
    fs.rmSync(workDir, { recursive: true, force: true });
    const errorMsg = err.stderr ? err.stderr.toString() : err.message;
    return res.status(500).json({
      error: 'Script execution failed.',
      detail: errorMsg.slice(0, 800),
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PPTX Executor running on port ${PORT}`));
