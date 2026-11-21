// Admin login check — Vercel serverless function (also used by server.cjs locally).
// POST /api/admin {pin} -> {ok:true} or 401 {ok:false}.
// The PIN lives in the ADMIN_PIN env var (.env for local runs, Vercel dashboard
// in production) and is deliberately NOT in the site code, so it can't be read
// from the page source. Default is "devnest" when unset.
const crypto = require("crypto");

function pinOK(pin) {
  const want = (process.env.ADMIN_PIN || "devnest").toString();
  if (typeof pin !== "string" || !pin) return false;
  const a = Buffer.from(pin), b = Buffer.from(want);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(200); return res.end(); }
  if (req.method !== "POST") { res.writeHead(405, { "Content-Type": "application/json" }); return res.end(JSON.stringify({ ok: false, error: "POST only" })); }
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  if (!body || typeof body !== "object") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    try { body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); } catch (e) { body = {}; }
  }
  const ok = pinOK(body && body.pin);
  res.writeHead(ok ? 200 : 401, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok }));
};
