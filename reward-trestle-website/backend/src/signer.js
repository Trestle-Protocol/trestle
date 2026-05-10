import { ethers } from "ethers";
import { initMultiRpc, getRpcUrl, destroy as destroyRpc } from "./multi-rpc.js";

const PRIVATE_KEY = process.env.VERIFIER_PRIVATE_KEY;
const CHAIN_ID = parseInt(process.env.CHAIN_ID || "137");

let signer = null;
let provider = null;

export function initSigner() {
  if (!PRIVATE_KEY) {
    console.warn("VERIFIER_PRIVATE_KEY not set — claim signing disabled");
    return null;
  }
  initMultiRpc(CHAIN_ID);
  const rpcUrl = process.env.POLYGON_RPC || getRpcUrl();
  provider = new ethers.JsonRpcProvider(rpcUrl, CHAIN_ID, { staticNetwork: true });
  signer = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log("Signer ready:", signer.address, "(RPC:", rpcUrl + ")");
  return signer;
}

export function destroySigner() {
  destroyRpc();
}

export function getSignerAddress() {
  return signer?.address ?? null;
}

export async function signClaim(userAddress, amount, claimId) {
  if (!signer) throw new Error("Signer not initialized");
  const chainId = (await provider.getNetwork()).chainId;
  const msgHash = ethers.solidityPackedKeccak256(
    ["address", "uint256", "bytes32", "uint256"],
    [userAddress, amount, claimId, chainId]
  );
  return await signer.signMessage(ethers.getBytes(msgHash));
}
