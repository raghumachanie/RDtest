# PPTX Generator — IBM Agent Executor

A web app that executes PptxGenJS scripts from your IBM Agent and delivers
the .pptx file directly to the user.

## Deploy to Render.com (Free — 5 minutes)

1. Create a free account at https://render.com
2. Click "New" → "Web Service"
3. Connect your GitHub account and upload this folder as a repo
   (or use: New → "Deploy from existing repo")
4. Render auto-detects the render.yaml and deploys
5. Your app is live at: https://pptx-generator.onrender.com (or similar)
6. Share that URL with your whole team

## Run Locally

```bash
npm install
node server.js
# Open http://localhost:3000
```

## How It Works

1. User pastes IBM Agent script into the web app
2. Server receives it, runs it in a sandboxed temp directory
3. The generated .pptx file is returned as a download
4. Temp files are cleaned up automatically

## Security

- Blocks child_process, eval, Function(), exec, spawn
- Each job runs in an isolated temp directory
- Temp files deleted after download
- 30-second execution timeout

## Stack

- Node.js + Express (backend)
- PptxGenJS (PowerPoint generation)
- Vanilla HTML/CSS/JS (frontend — no framework needed)
