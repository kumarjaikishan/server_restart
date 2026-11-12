# Oracle VPS Project Deployment & Runner Server

A lightweight Node.js + Express service that serves an integrated web dashboard matching the Oracle VPS Project Deployment modal interface. It enables you to trigger `.sh` shell scripts already hosted on your VPS with a single click, streams live execution logs in real-time to the browser terminal window, and provides Sonner-style toast notifications.

---

## 🚀 Features

- **Exact UI Replication**:
  - Grid card selection of target servers/projects (Accusoft, EMS, Webnex, BattleFiesta, etc.) with custom project badges and paths.
  - Interactive status indicator (`LIVE`).
  - Dark execution logs terminal with Clear Terminal action.
  - Dynamic production script path banner.
  - Add / Feed new servers directly from the UI or via JSON file.
- **Real-Time Log Streaming**: Uses Server-Sent Events (SSE) so output from your `.sh` scripts streams line-by-line as it executes without waiting for the process to terminate.
- **Sonner Notifications**: Sonner-style animated toast notifications for loading, success, and error states.
- **Self-Contained**: Serves both frontend and backend APIs out of a single Express process on port 3000.

---

## 📂 Project Structure

```
Restart_server/
├── projects.json       # Configured servers, project paths, and script paths
├── server.js           # Express API and SSE execution runner
├── package.json        # Dependencies (express, cors)
└── public/
    └── index.html      # Responsive dashboard UI with Tailwind & Sonner toasts
```

---

## 🛠️ How to Run

### 1. Start the Server
```bash
npm start
# or
node server.js
```
Open your browser at: **[http://localhost:3000](http://localhost:3000)**

---

## ⚙️ Configuration & Adding Projects

You can add projects in two ways:

1. **Directly via the Web UI**:
   - Click **`+ Add Server/Project`** at the top right of the project section.
   - Enter the name, directory path (e.g. `/var/www/my-project`), and VPS script path (e.g. `/home/ubuntu/scripts/deploy.sh`).
2. **Via `projects.json`**:
   Edit [projects.json](file:///c:/Users/jai%20kishan/Desktop/Coding/Restart_server/projects.json) directly:
   ```json
   {
     "id": "my_app",
     "name": "My App",
     "directory": "/var/www/my_app",
     "scriptPath": "/home/ubuntu/scripts/my_app.sh",
     "icon": "globe"
   }
   ```

