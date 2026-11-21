// Local dev server for testing only (not needed on Vercel).
// Serves this folder statically and mounts api/run.js at /api/run and
// api/admin.js at /api/admin.
// Usage: node server.cjs   (then open http://localhost:8124/)
// Admin PIN: set ADMIN_PIN in a .env file next to this script (see .env.example).
const http = require("http");
const fs = require("fs");
const path = require("path");
const handler = require("./api/run.js");
const adminHandler = require("./api/admin.js");

// Load .env for local runs (ADMIN_PIN) — tiny parser, no dependency.
try {
  const envPath = path.join(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    const NL = String.fromCharCode(10);
    fs.readFileSync(envPath, "utf8").split(NL).forEach(line => {
      const t = line.trim();
      if (!t || t.charAt(0) === "#") return;
      const eq = t.indexOf("=");
      if (eq < 1) return;
      const k = t.slice(0, eq).trim();
      if (!/^[A-Za-z_]/.test(k) || process.env[k] != null) return;
      let v = t.slice(eq + 1).trim();
      if (v.length >= 2 && ((v.charAt(0) === '"' && v.charAt(v.length - 1) === '"') || (v.charAt(0) === "'" && v.charAt(v.length - 1) === "'"))) v = v.slice(1, -1);
      process.env[k] = v;
    });
  }
} catch (e) {}

const ROOT = __dirname;
const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".jpg": "image/jpeg", ".png": "image/png", ".css": "text/css" };

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/api/run") {
    // adapt Node http req/res to the Vercel-style handler
    req.url = url.pathname + url.search;
    return handler(req, res);
  }
  if (url.pathname === "/api/admin") {
    req.url = url.pathname + url.search;
    return adminHandler(req, res);
  }
  let fp = path.join(ROOT, url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname));
  if (!fp.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(fp)] || "application/octet-stream" });
    res.end(data);
  });
});
server.listen(8124, () => console.log("FirstByte lite on http://localhost:8124/"));
