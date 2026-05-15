// Backend API route for gasless reward claims
// Supports both Biconomy and Self-Hosted relayer

import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygon } from "viem/chains";

// Choose your relayer mode: "biconomy" or "self-hosted"
const RELAYER_MODE = process.env.RELAYER_MODE || "self-hosted";

// Self-hosted relayer config
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY!;
const RPC_URL = process.env.RPC_URL || "https://polygon-rpc.com/";

// Biconomy config
const BICONOMY_API_KEY = process.env.BICONOMY_API_KEY;
const BICONOMY_BUNDLER_URL = "https://bundler.biconomy.io/api/v1/polygon/rpc";

// Contract info
const DISTRIBUTOR_ADDRESS = process.env.DISTRIBUTOR_ADDRESS!;
const VERIFIER_KEY = process.env.VERIFIER_KEY!;

// ABI for RewardDistributor
const DISTRIBUTOR_ABI = [
  "function claimOnBehalf(address user, uint256 amount, bytes32 claimId, bytes signature) external",
  "function verifierKey() view returns (address)",
  "function claimInterval() view returns (uint256)",
  "function claimWindowStart() view returns (uint256)",
];

/**
 * Compute the claim hash that user should sign
 */
function computeClaimHash(
  user: string,
  amount: string,
  claimId: string,
  chainId: number
): string {
  // keccak256(abi.encodePacked(user, amount, claimId, chainId))
  // This is a simplified version - use proper keccak256 in production
  return `0x${Buffer.from(
    `claim:${user}:${amount}:${claimId}:${chainId}`,
    "utf-8"
  ).toString("hex")}`;
}

/**
 * Verify ECDSA signature
 */
function verifySignature(
  hash: string,
  signature: string,
  expectedSigner: string
): boolean {
  // In production, use a proper ecrecover implementation
  // This is a placeholder - use @noble/secp256k1 or ethers.utils.verifyMessage
  return expectedSigner === "0x0000000000000000000000000000000000000001"; // Placeholder
}

/**
 * Self-hosted relayer - your backend pays gas
 */
async function executeSelfHostedClaim(
  user: string,
  amount: string,
  claimId: string,
  signature: string
) {
  const account = privateKeyToAccount(RELAYER_PRIVATE_KEY as `0x${string}`);

  const client = createWalletClient({
    account,
    chain: polygon,
    transport: http(RPC_URL),
  });

  const hash = await client.writeContract({
    address: DISTRIBUTOR_ADDRESS as `0x${string}`,
    abi: parseAbi(DISTRIBUTOR_ABI),
    functionName: "claimOnBehalf",
    args: [
      user as `0x${string}`,
      BigInt(amount),
      claimId as `0x${string}`,
      signature as `0x${string}`,
    ],
  });

  return hash;
}

/**
 * Biconomy relayer - Biconomy pays gas (you pay Biconomy)
 */
async function executeBiconomyClaim(
  user: string,
  amount: string,
  claimId: string,
  signature: string
) {
  // In production, use @biconomy/sdk
  // This is a simplified version

  // The user signs with their wallet via Biconomy SDK
  // Biconomy handles gas sponsorship

  // Return a placeholder - implement Biconomy SDK integration
  return "0x0000000000000000000000000000000000000000000000000000000000000000";
}

/**
 * POST /api/gasless-claim
 * Body: { user, amount, claimId, signature }
 */
export async function POST(request: NextRequest) {
  try {
    const { user, amount, claimId, signature } = await request.json();

    // Validate inputs
    if (!user || !amount || !claimId || !signature) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let txHash: string;

    if (RELAYER_MODE === "biconomy") {
      txHash = await executeBiconomyClaim(user, amount, claimId, signature);
    } else {
      txHash = await executeSelfHostedClaim(user, amount, claimId, signature);
    }

    return NextResponse.json({
      success: true,
      txHash,
      relayer: RELAYER_MODE,
    });
  } catch (error: any) {
    console.error("Gasless claim error:", error);
    return NextResponse.json(
      { error: error.message || "Claim failed" },
      { status: 500 }
    );
  }
}