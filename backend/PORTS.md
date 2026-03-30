# Port & Process Management Guide

This guide provides troubleshooting steps for handling port conflicts in development.

## ⚡ Manual Recovery (Windows)

If you need to kill a process that is locked on a specific port (e.g., 5000), use the following commands in **PowerShell**:

### 1. Find the Process ID (PID)
```powershell
netstat -ano | findstr :5000
```
This will return a line like:
`TCP    0.0.0.0:5000           0.0.0.0:0              LISTENING       12345`  
*(The last number `12345` is the PID)*.

### 2. Kill the Process
```powershell
taskkill /F /PID 12345
```

---

## 🛠️ Integrated Auto-Port Switching
The Society Service Backend now features **Auto-Resilience**. 

### How it works:
- If `PORT 5000` is busy, the server will automatically try `5001`.
- It will continue searching until it finds an open port.
- Your startup console will clearly log the successful URI:
  `📡 URL: http://localhost:5001`

### Using `kill-port` (Recommended for Convenience)
For easier management, you can install the `kill-port` utility globally:
```bash
npm install -g kill-port
kill-port 5000
```
Then simply restart your server!

---

💡 **Pro-Tip:** Always check your second terminal before starting the server to avoid accidental duplicates!
