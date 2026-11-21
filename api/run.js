// FirstByte runner proxy — Vercel serverless function (also used by server.cjs locally).
// POST /api/run  {language:'c'|'python', code, stdin}  -> {token}
// GET  /api/run?token=... -> {done, status, stdout, stderr, compile_output, time}
// Forwards to the public Judge0 CE runner (https://ce.judge0.com, no key).
// Split create/poll so each invocation stays well under Vercel's hobby 10s limit.
const JUDGE0 = "https://ce.judge0.com";
const LANG = { c: 103, python: 71 };

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function send(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify(obj));
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const body = await readJson(req);
      const langId = LANG[body.language];
      if (!langId || typeof body.code !== "string") return send(res, 400, { error: "bad request" });
      if (body.code.length > 100000) return send(res, 400, { error: "code too long" });
      const r = await fetch(JUDGE0 + "/submissions?base64_encoded=false&wait=false", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_code: body.code, language_id: langId, stdin: body.stdin || "" }),
        signal: AbortSignal.timeout(15000),
      });
      if (!r.ok) return send(res, 502, { error: "runner returned HTTP " + r.status });
      const d = await r.json();
      return send(res, 200, { token: d.token });
    }
    if (req.method === "GET") {
      const url = new URL(req.url, "http://x");
      const token = url.searchParams.get("token");
      if (!token) return send(res, 400, { error: "missing token" });
      const r = await fetch(JUDGE0 + "/submissions/" + encodeURIComponent(token) + "?base64_encoded=false", {
        signal: AbortSignal.timeout(15000),
      });
      if (!r.ok) return send(res, 502, { error: "runner returned HTTP " + r.status });
      const d = await r.json();
      const sid = d.status && d.status.id;
      const done = sid !== 1 && sid !== 2; // 1 In Queue, 2 Processing
      return send(res, 200, {
        done,
        status: d.status || null,
        stdout: d.stdout || "",
        stderr: d.stderr || "",
        compile_output: d.compile_output || "",
        time: d.time || null,
      });
    }
    return send(res, 405, { error: "method not allowed" });
  } catch (e) {
    return send(res, 502, { error: "runner unreachable: " + (e && e.message ? e.message : "network") });
  }
};
