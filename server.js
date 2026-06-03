const express = require('express');
const fs      = require('fs');
const path    = require('path');
const { execSync } = require('child_process');
const os      = require('os');
const crypto  = require('crypto');

const app = express();
app.use(express.json({ limit: '500kb' }));

// Serve static files from public/
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Explicit root route as fallback
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Execute script and return .pptx
app.post('/generate', async (req, res) => {
  const { script } = req.body;

  if (!script || script.trim().length < 20) {
    return res.status(400).json({ error: 'No script provided.' });
  }

  const forbidden = [
    /require\s*\(\s*['"`]child_process/,
    /process\.exit/,
    /eval\s*\(/,
    /Function\s*\(/,
    /\bspawn\b/,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(script)) {
      return res.status(400).json({ error: 'Script contains disallowed operations.' });
    }
  }

  const jobId   = crypto.randomBytes(8).toString('hex');
  const workDir = path.join(os.tmpdir(), `pptx_${jobId}`);
  const outFile = path.join(workDir, 'output.pptx');

  fs.mkdirSync(workDir, { recursive: true });

  let patched = script
    .replace(/writeFile\s*\(\s*\{[^}]*\}\s*\)/g,
             `writeFile({ fileName: ${JSON.stringify(outFile)} })`)
    .replace(/writeFile\s*\(\s*['"\`][^'"\`]+['"\`]\s*\)/g,
             `writeFile({ fileName: ${JSON.stringify(outFile)} })`);

  patched = `process.chdir(${JSON.stringify(__dirname)});\n` + patched;

  const scriptPath = path.join(workDir, 'script.js');
  fs.writeFileSync(scriptPath, patched, 'utf8');

  try {
    execSync(`node "${scriptPath}"`, {
      timeout: 30000,
      cwd: __dirname,
      env: { ...process.env, NODE_PATH: path.join(__dirname, 'node_modules') },
    });

    if (!fs.existsSync(outFile)) {
      return res.status(500).json({
        error: 'Script ran but no .pptx file was created.',
        detail: 'Make sure the script ends with pres.writeFile({ fileName: "output.pptx" })'
      });
    }

    const filename = (req.body.filename || 'presentation')
      .replace(/[^a-zA-Z0-9_-]/g, '_') + '.pptx';

    res.setHeader('Content-Type',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const fileStream = fs.createReadStream(outFile);
    fileStream.pipe(res);
    fileStream.on('end', () => {
      fs.rmSync(workDir, { recursive: true, force: true });
    });
    fileStream.on('error', () => {
      fs.rmSync(workDir, { recursive: true, force: true });
    });

  } catch (err) {
    fs.rmSync(workDir, { recursive: true, force: true });
    const errorMsg = (err.stderr ? err.stderr.toString() : err.message) || 'Unknown error';
    return res.status(500).json({
      error: 'Script execution failed.',
      detail: errorMsg.slice(0, 1000),
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PPTX Executor running on port ${PORT}`);
  console.log(`Static files from: ${publicDir}`);
  console.log(`index.html exists: ${fs.existsSync(path.join(publicDir, 'index.html'))}`);
});
