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

  // Use existing BiometricVerification address from env or fallback to known address
  const biometricAddress = process.env.BIOMEGRAPHIC_ADDRESS || "0x8E3Dd0B0E261b16226E6DFBA080AEBb2431E2F44";
  const rewardTokenAddress = process.env.REWARD_TOKEN || "0xcF51ab7398315DbA6588Aa7fb3Df7c99D3D1F4dD";
  console.log("Using BiometricVerification at:", biometricAddress);
  console.log("Using Reward Token at:", rewardTokenAddress);

  // Get the existing BiometricVerification contract instance
  const Biometric = await hre.ethers.getContractFactory("BiometricVerification");
  const biometric = Biometric.attach(biometricAddress);
  console.log("BiometricVerification:", await biometric.getAddress());

  // Deploy RewardDistributor with correct constructor parameters
  const Distributor = await hre.ethers.getContractFactory("RewardDistributor");
  const distributor = await Distributor.deploy(
    biometricAddress,
    rewardTokenAddress,
    deployer.address
  );
  await distributor.waitForDeployment();
  const distributorAddress = await distributor.getAddress();
  console.log("RewardDistributor:", distributorAddress);

  // Set the verifier key after deployment if different from deployer
  const verifierKey = process.env.VERIFIER_KEY || deployer.address;
  const currentVerifierKey = await distributor.verifierKey();
  if (verifierKey !== currentVerifierKey) {
    const tx = await distributor.setVerifierKey(verifierKey);
    await tx.wait();
    console.log("VerifierKey set to:", verifierKey);
  } else {
    console.log("VerifierKey already set to:", verifierKey);
  }

  console.log("\nDeployment complete!");
  console.log("BiometricVerification:", await biometric.getAddress());
  console.log("RewardDistributor:", distributorAddress);

  if (hre.network.name !== "hardhat") {
    // Wait for a few blocks to ensure the contract is finalized
    console.log("\nWaiting 30 seconds for block finalization...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    if (process.env.ETHERSCAN_API_KEY) {
      console.log("\nVerifying contracts on Polygonscan...");

      // Verify BiometricVerification
      try {
        await hre.run("verify:verify", {
          address: await biometric.getAddress(),
          constructorArguments: [deployer.address]
        });
        console.log("[OK] BiometricVerification verified on Polygonscan!");
      } catch (e) {
        console.log("[WARN] BiometricVerification verification failed:", e.message.slice(0, 200));
      }

      // Verify RewardDistributor
      try {
        await hre.run("verify:verify", {
          address: distributorAddress,
          constructorArguments: [biometricAddress, rewardTokenAddress, deployer.address]
        });
        console.log("[OK] RewardDistributor verified on Polygonscan!");
      } catch (e) {
        console.log("[WARN] RewardDistributor verification failed:", e.message.slice(0, 200));
      }
    } else {
      console.log("Skipping verification due to missing ETHERSCAN_API_KEY");
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
