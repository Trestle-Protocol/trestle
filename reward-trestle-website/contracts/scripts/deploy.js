import hre from "hardhat";

async function main() {
  const signers = await hre.ethers.getSigners();
  if (signers.length === 0) {
    throw new Error("No signers available. Please check your network configuration and ensure you have accounts.");
  }
  const [deployer] = signers;
  console.log("Deploying with:", deployer.address);

  // Check for required environment variables for verification on non-hardhat networks
  if (hre.network.name !== "hardhat" && !process.env.ETHERSCAN_API_KEY) {
    console.log("Warning: ETHERSCAN_API_KEY not set. Contract verification will be skipped.");
  }

  // 1. Deploy BiometricVerification
  const Biometric = await hre.ethers.getContractFactory("BiometricVerification");
  const biometric = await Biometric.deploy(deployer.address);
  await biometric.waitForDeployment();
  console.log("BiometricVerification:", await biometric.getAddress());

  // 2. Deploy RewardDistributor
  const HNOBT = process.env.HNOBT || "0xcF51ab7398315DbA6588Aa7fb3Df7c99D3D1F4dD";
  const VERIFIER_KEY = process.env.VERIFIER_KEY || deployer.address;

  const Distributor = await hre.ethers.getContractFactory("RewardDistributor");
  const distributor = await Distributor.deploy(
    await biometric.getAddress(),
    HNOBT,
    deployer.address
  );
  await distributor.waitForDeployment();
  console.log("RewardDistributor:", await distributor.getAddress());

  // Set the verifier key after deployment
  if (VERIFIER_KEY !== deployer.address) {
    await distributor.setVerifierKey(VERIFIER_KEY);
    console.log("VerifierKey set to:", VERIFIER_KEY);
  } else {
    console.log("VerifierKey is set to deployer address by default (via constructor)");
  }

  console.log("\nDeployment complete!");
  console.log("BiometricVerification:", await biometric.getAddress());
  console.log("RewardDistributor:", await distributor.getAddress());

  if (hre.network.name !== "hardhat") {
    // Wait for a few blocks to ensure the contract is finalized
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30-second delay
    if (process.env.ETHERSCAN_API_KEY) {
      await verify("BiometricVerification", await biometric.getAddress(), [deployer.address]);
      await verify("RewardDistributor", await distributor.getAddress(), [
        await biometric.getAddress(), HNOBT, VERIFIER_KEY, deployer.address
      ]);
    } else {
      console.log("Skipping verification due to missing ETHERSCAN_API_KEY");
    }
  }
}

async function verify(name, address, args) {
  try {
    await hre.run("verify:verify", { address, constructorArguments: args });
    console.log(`[32m[1m[7m[49m[39m[22m[27m [32m[1m[27m[49m[39m[22m${name} verified[0m`);
  } catch (e) {
    console.log(`[31m[1m[7m[49m[39m[22m[27m [31m[1m[27m[49m[39m[22m${name} skipped: ${e.message.slice(0, 80)}[0m`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
