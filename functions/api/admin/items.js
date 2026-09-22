// Pages Function: /api/admin/items  —— 辅警端 D1 接口
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
  });
}
function genCode() { return String(Math.floor(100000 + Math.random() * 900000)); }

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

  if (request.method === "GET") {
    const rows = await env.DB.prepare(
      "SELECT * FROM items ORDER BY id DESC LIMIT 200"
    ).all();
    return json({ items: rows.results });
  }

  if (request.method === "POST") {
    let b;
    try { b = await request.json(); } catch { return json({ error: "bad json" }, 400); }
    if (!b.item_name) return json({ error: "物品名称必填" }, 400);
    let code;
    for (let i = 0; i < 5; i++) {
      code = genCode();
      const dup = await env.DB.prepare("SELECT 1 FROM items WHERE code=?").bind(code).first();
      if (!dup) break;
    }
    const r = await env.DB.prepare(
      `INSERT INTO items (code,item_name,category,color,features,found_location,found_time,keeper,locker,photo_url,status)
       VALUES (?,?,?,?,?,?,?,?,?,?, 'stored')`
    ).bind(
      code, b.item_name, b.category || null, b.color || null, b.features || null,
      b.found_location || null, b.found_time || null, b.keeper || null,
      b.locker || null, b.photo_url || null
    ).run();
    return json({ id: r.meta.last_row_id, code });
  }
  return json({ error: "method" }, 405);
}
