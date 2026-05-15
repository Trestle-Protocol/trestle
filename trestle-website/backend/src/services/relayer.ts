// Self-hosted relayer service for gasless transactions
// Run this on your backend server

import { createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygon } from "viem/chains";

interface RelayerConfig {
  privateKey: string;
  rpcUrl: string;
  distributorAddress: string;
  distributorAbi: any[];
}

interface ClaimRequest {
  user: `0x${string}`;
  amount: bigint;
  claimId: string;
  signature: `0x${string}`;
}

interface SignatureVerification {
  valid: boolean;
  signer: string;
}

/**
 * Self-hosted relayer for gasless transactions
 * Your backend pays gas, users sign messages for free
 */
export class SelfHostedRelayer {
  private walletClient;
  private distributorAddress: `0x${string}`;
  private distributorAbi: any[];
  private verifierKey: string;

  constructor(config: RelayerConfig) {
    const account = privateKeyToAccount(config.privateKey as `0x${string}`);

    this.walletClient = createWalletClient({
      account,
      chain: polygon,
      transport: http(config.rpcUrl),
    });

    this.distributorAddress = config.distributorAddress as `0x${string}`;
    this.distributorAbi = config.distributorAbi;
    this.verifierKey = ""; // Will be set from contract
  }

  /**
   * Verify signature from user
   * @param hash - Message hash that was signed
   * @param signature - User's signature
   * @returns Verification result
   */
  private async verifySignature(
    hash: `0x${string}`,
    signature: `0x${string}`
  ): Promise<SignatureVerification> {
    try {
      const ethSignedHash = `0x${Buffer.from(
        `\x19Ethereum Signed Message:\n32${hash.slice(2)}`,
        "utf-8"
      ).toString("hex")}`;

      // Use ecrecover to get signer
      // Note: In production, use a proper ecrecover implementation
      // This is a simplified version - use @noble/secp256k1 or similar
      const signer = await this.recoverSigner(ethSignedHash, signature);

      return {
        valid: signer === this.verifierKey,
        signer,
      };
    } catch (error) {
      console.error("Signature verification failed:", error);
      return { valid: false, signer: "0x0" };
    }
  }

  /**
   * Recover signer from signature (simplified)
   * In production, use a proper ecrecover implementation
   */
  private async recoverSigner(
    hash: string,
    signature: string
  ): Promise<string> {
    // This is a placeholder - implement proper ecrecover
    // Use @noble/secp256k1 or ethers.js for this
    return "0x0";
  }

  /**
   * Set the verifier key (read from contract)
   */
  async setVerifierKey(key: string): Promise<void> {
    this.verifierKey = key;
  }

  /**
   * Execute gasless claim on behalf of user
   * @param request - Claim request from user
   * @returns Transaction hash
   */
  async executeClaim(request: ClaimRequest): Promise<`0x${string}`> {
    const { user, amount, claimId, signature } = request;

    // Verify signature first
    const hash = this.computeClaimHash(user, amount, claimId);
    const verification = await this.verifySignature(hash, signature);

    if (!verification.valid) {
      throw new Error("Invalid signature");
    }

    // Encode function call
    const data = this.encodeClaimOnBehalf(user, amount, claimId, signature);

    // Submit transaction (your backend pays gas)
    const hash2 = await this.walletClient.writeContract({
      address: this.distributorAddress,
      abi: parseAbi(this.distributorAbi),
      functionName: "claimOnBehalf",
      args: [user, amount, claimId, signature],
    });

    return hash2;
  }

  /**
   * Compute claim hash for signature
   */
  private computeClaimHash(
    user: `0x${string}`,
    amount: bigint,
    claimId: string
  ): `0x${string}` {
    // This should match how the user signs
    // keccak256(abi.encodePacked(user, amount, claimId, chainId))
    // In production, use proper keccak256
    return `0x${Buffer.from(
      `claim:${user}:${amount}:${claimId}`,
      "utf-8"
    ).toString("hex")}` as `0x${string}`;
  }

  /**
   * Encode claimOnBehalf function call
   */
  private encodeClaimOnBehalf(
    user: `0x${string}`,
    amount: bigint,
    claimId: string,
    signature: `0x${string}`
  ): `0x${string}` {
    // Simplified encoding - use ethers.js or viem in production
    const claimIdHex = claimId.startsWith("0x")
      ? claimId.slice(2).padStart(64, "0")
      : claimId.padStart(64, "0");

    const amountHex = amount.toString(16).padStart(64, "0");

    return `0x8f5eb6b4${user.slice(2)}${amountHex}${claimIdHex}${signature.slice(2)}` as `0x${string}`;
  }
}