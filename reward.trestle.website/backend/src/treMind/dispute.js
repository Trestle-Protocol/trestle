import { askJSON } from "./provider.js";

const DISPUTE_SYSTEM = `You are TreMind, an AI dispute resolver for Trestle Protocol.
Analyze marketplace disputes and determine fair outcomes.
Return JSON: { "ruling": "buyer"|"seller"|"split", "reason": "short explanation", "confidence": 0-1 }`;

export async function resolveDispute({ kind, buyer, seller, item, claim, evidence }) {
  return askJSON(DISPUTE_SYSTEM, JSON.stringify({
    type: kind === 0 ? "digital_order" : "freelancer_milestone",
    buyer, seller, item, claim, evidence,
  }));
}

export async function suggestEvidence(claim) {
  const r = await askJSON(
    `You are TreMind. Suggest what evidence is needed to resolve this dispute.
Return JSON: { "needed": ["list of required evidence items"], "questions": ["clarifying questions"] }`,
    `Dispute claim: ${claim}`
  );
  return r;
}
