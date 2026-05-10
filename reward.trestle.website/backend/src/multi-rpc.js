const RPCS = {
  137: [
    { url: "https://polygon-rpc.com", label: "Public", weight: 1 },
    { url: "https://polygon.llamarpc.com", label: "Llama", weight: 1 },
    { url: "https://rpc.ankr.com/polygon", label: "Ankr", weight: 1 },
    { url: "https://polygon.blockpi.network/v1/rpc/public", label: "BlockPI", weight: 1 },
    { url: "https://1rpc.io/matic", label: "1RPC", weight: 1 },
    { url: "https://polygon.drpc.org", label: "dRPC", weight: 1 },
  ],
  80002: [
    { url: "https://rpc-amoy.polygon.technology", label: "Official Amoy", weight: 1 },
    { url: "https://rpc.ankr.com/polygon_amoy", label: "Ankr Amoy", weight: 1 },
  ],
};

let health = new Map();
let timer = null;
let chainId = 137;
const TIMEOUT = 5000;
const CHECK_INTERVAL = 30000;

function getRpcs() {
  const base = RPCS[chainId] ?? [];
  const key = process.env.BLOCKSCOUT_API_KEY || "";
  const qs = key ? `?apikey=${key}` : "";
  const blockscout = { url: `https://api.blockscout.com/${chainId}/json-rpc${qs}`, label: "Blockscout", weight: 3 };
  return base.filter(r => r.url !== blockscout.url).concat(blockscout);
}

async function rpcCall(url, method, params = [], timeout = TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
      signal: controller.signal,
    });
    const data = await r.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
    return data.result;
  } finally {
    clearTimeout(id);
  }
}

async function checkHealth() {
  const rpcs = getRpcs();
  await Promise.allSettled(
    rpcs.map(async (rpc) => {
      const start = performance.now();
      try {
        const block = await rpcCall(rpc.url, "eth_blockNumber", [], 3000);
        health.set(rpc.url, { healthy: true, latency: performance.now() - start, lastCheck: Date.now(), blockNumber: BigInt(block) });
      } catch {
        health.set(rpc.url, { healthy: false, latency: Infinity, lastCheck: Date.now() });
      }
    })
  );
}

export function initMultiRpc(chain) {
  chainId = chain;
  checkHealth();
  timer = setInterval(checkHealth, CHECK_INTERVAL);
}

export function bestRpc() {
  const healthy = getRpcs().filter(r => health.get(r.url)?.healthy);
  if (healthy.length === 0) return getRpcs()[0];
  return healthy.sort((a, b) => (health.get(a.url)?.latency ?? Infinity) - (health.get(b.url)?.latency ?? Infinity))[0];
}

export async function request(method, params = []) {
  const rpcs = getRpcs().sort((a, b) => {
    const ha = health.get(a.url);
    const hb = health.get(b.url);
    if (ha?.healthy && !hb?.healthy) return -1;
    if (!ha?.healthy && hb?.healthy) return 1;
    return (ha?.latency ?? Infinity) - (hb?.latency ?? Infinity);
  });
  for (const rpc of rpcs) {
    try {
      return await rpcCall(rpc.url, method, params);
    } catch {
      health.set(rpc.url, { healthy: false, latency: Infinity, lastCheck: Date.now() });
    }
  }
  throw new Error(`All RPCs failed for chain ${chainId}`);
}

export function getRpcUrl() {
  const rpc = bestRpc();
  return rpc ? rpc.url : getRpcs()[0].url;
}

export function destroy() {
  if (timer) clearInterval(timer);
}
