const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;
const PROJECTS_FILE = path.join(__dirname, 'projects.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Read projects
function getProjects() {
  try {
    if (!fs.existsSync(PROJECTS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(PROJECTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading projects.json:', err);
    return [];
  }
}

// Save projects
function saveProjects(projects) {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
}

// API: Get list of projects
app.get('/api/projects', (req, res) => {
  res.json(getProjects());
});

// API: Add or update project
app.post('/api/projects', (req, res) => {
  const { id, name, directory, scriptPath, icon } = req.body;
  if (!name || !scriptPath) {
    return res.status(400).json({ error: 'Name and scriptPath are required' });
  }

  const projects = getProjects();
  const projectId = id || name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const existingIdx = projects.findIndex(p => p.id === projectId);

  const projectData = {
    id: projectId,
    name,
    directory: directory || `/var/www/${projectId}`,
    scriptPath,
    icon: icon || 'terminal'
  };

  if (existingIdx >= 0) {
    projects[existingIdx] = projectData;
  } else {
    projects.push(projectData);
  }

  saveProjects(projects);
  res.json({ success: true, project: projectData });
});

// API: Delete a project
app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  let projects = getProjects();
  projects = projects.filter(p => p.id !== id);
  saveProjects(projects);
  res.json({ success: true, message: 'Project removed' });
});

// API: Trigger script execution with Real-Time Streaming (Server-Sent Events)
app.get('/api/execute/:id', (req, res) => {
  const { id } = req.params;
  const projects = getProjects();
  const project = projects.find(p => p.id === id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Set SSE headers for streaming logs
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent('start', {
    message: `Executing ${project.name} script: ${project.scriptPath}`,
    timestamp: new Date().toLocaleTimeString()
  });

  const isWindows = process.platform === 'win32';
  let child;

  if (isWindows) {
    // Check if script file exists on Windows or simulate execution if in local testing
    if (fs.existsSync(project.scriptPath)) {
      child = spawn('bash', [project.scriptPath], { shell: true });
    } else {
      // Simulate execution gracefully on Windows dev environment if bash/script not present
      sendEvent('output', { text: `[SIMULATION] Running on Windows. On Linux VPS, it executes: bash ${project.scriptPath}\n` });
      sendEvent('output', { text: `> cd ${project.directory}\n` });
      sendEvent('output', { text: `> git fetch && git pull origin main\nAlready up to date.\n` });
      sendEvent('output', { text: `> npm install --production\naudited packages in 1.2s\n` });
      sendEvent('output', { text: `> pm2 reload ${project.name.toLowerCase()} --update-env\n[PM2] Process successfully reloaded!\n` });
      
      setTimeout(() => {
        sendEvent('complete', { code: 0, message: `Deployment for ${project.name} finished successfully!` });
        res.end();
      }, 1500);
      return;
    }
  } else {
    // Linux / VPS execution
    child = spawn('bash', [project.scriptPath], {
      shell: true,
      cwd: fs.existsSync(project.directory) ? project.directory : undefined
    });
  }

  child.stdout.on('data', (data) => {
    sendEvent('output', { text: data.toString() });
  });

  child.stderr.on('data', (data) => {
    sendEvent('output', { text: data.toString(), isError: true });
  });

  child.on('error', (err) => {
    sendEvent('complete', { code: 1, message: `Failed to execute: ${err.message}` });
    res.end();
  });

  child.on('close', (code) => {
    sendEvent('complete', {
      code,
      message: code === 0 
        ? `Deployment completed successfully (Exit code: 0)` 
        : `Deployment exited with code ${code}`
    });
    res.end();
  });

  req.on('close', () => {
    if (child && !child.killed) {
      child.kill();
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

