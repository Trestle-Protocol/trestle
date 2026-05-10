import { askJSON } from "./provider.js";

const LISTING_SYSTEM = `You are TreMind, analyzing marketplace listings for Trestle Protocol.
Check for fraud, pricing, and completeness.
Return JSON: { "safe": true/false, "suggestedPrice": "number or null", "concerns": ["list"], "score": 0-100 }`;

export async function analyzeListing({ title, description, price, seller }) {
  return askJSON(LISTING_SYSTEM, JSON.stringify({ title, description, price, sellerAddress: seller?.slice(0, 8) }));
}

const CHAT_SYSTEM = `You are TreMind, the Trestle Protocol AI assistant.
You help users with staking, rewards, marketplace, disputes, and platform questions.
Be concise and helpful. You can answer in 1-3 sentences.`;

export async function chat(message, context = {}) {
  const ctx = Object.entries(context).filter(([_, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n");
  const prompt = ctx ? `Context:\n${ctx}\n\nUser: ${message}` : message;
  const { ask } = await import("./provider.js");
  return ask(CHAT_SYSTEM, prompt);
}
