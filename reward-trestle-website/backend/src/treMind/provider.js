const MODEL = process.env.TREMIND_MODEL || "llama3";
const BASE_URL = process.env.TREMIND_API_URL || "http://localhost:11434/v1";
const API_KEY = process.env.TREMIND_API_KEY || "";

export async function ask(system, user, format) {
  const messages = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
  const body = {
    model: MODEL,
    messages,
    temperature: 0.3,
    stream: false,
  };
  if (format) body.response_format = { type: "json_object" };

  const headers = { "Content-Type": "application/json" };
  if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;

  try {
    const r = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const data = await r.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (e) {
    console.error("TreMind AI call failed:", e.message);
    return null;
  }
}

export async function askJSON(system, user) {
  const raw = await ask(system, user, true);
  if (!raw) return null;
  try { return JSON.parse(raw); }
  catch { return null; }
}
