import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("tasks.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    timeSpent INTEGER DEFAULT 0,
    goalSeconds INTEGER DEFAULT 0,
    isIndefinite INTEGER DEFAULT 0,
    isNotify INTEGER DEFAULT 0,
    sortOrder INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/tasks", (req, res) => {
    const tasks = db.prepare("SELECT * FROM tasks ORDER BY sortOrder ASC").all();
    res.json(tasks.map(t => ({
      ...t,
      isIndefinite: !!t.isIndefinite,
      isNotify: !!t.isNotify
    })));
  });

  app.post("/api/tasks", (req, res) => {
    const { id, name, goalSeconds, isIndefinite, isNotify, sortOrder } = req.body;
    db.prepare(`
      INSERT INTO tasks (id, name, goalSeconds, isIndefinite, isNotify, sortOrder)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, goalSeconds, isIndefinite ? 1 : 0, isNotify ? 1 : 0, sortOrder);
    res.status(201).json({ success: true });
  });

  app.put("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    const { name, timeSpent, goalSeconds, isIndefinite, isNotify, sortOrder } = req.body;
    
    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push("name = ?"); params.push(name); }
    if (timeSpent !== undefined) { updates.push("timeSpent = ?"); params.push(timeSpent); }
    if (goalSeconds !== undefined) { updates.push("goalSeconds = ?"); params.push(goalSeconds); }
    if (isIndefinite !== undefined) { updates.push("isIndefinite = ?"); params.push(isIndefinite ? 1 : 0); }
    if (isNotify !== undefined) { updates.push("isNotify = ?"); params.push(isNotify ? 1 : 0); }
    if (sortOrder !== undefined) { updates.push("sortOrder = ?"); params.push(sortOrder); }

    if (updates.length > 0) {
      params.push(id);
      db.prepare(`UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`).run(...params);
    }
    
    res.json({ success: true });
  });

  app.delete("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.post("/api/tasks/reset", (req, res) => {
    db.prepare("UPDATE tasks SET timeSpent = 0").run();
    res.json({ success: true });
  });

  app.post("/api/tasks/clear", (req, res) => {
    db.prepare("DELETE FROM tasks").run();
    res.json({ success: true });
  });

  app.post("/api/tasks/reorder", (req, res) => {
    const { taskIds } = req.body;
    const update = db.prepare("UPDATE tasks SET sortOrder = ? WHERE id = ?");
    const transaction = db.transaction((ids) => {
      ids.forEach((id, index) => update.run(index, id));
    });
    transaction(taskIds);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
