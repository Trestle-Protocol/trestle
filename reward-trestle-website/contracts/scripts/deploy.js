const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // 1. Deploy BiometricVerification
  const Biometric = await hre.ethers.getContractFactory("BiometricVerification");
  const biometric = await Biometric.deploy(deployer.address);
  await biometric.waitForDeployment();
  console.log("BiometricVerification:", await biometric.getAddress());

  // 2. Deploy RewardDistributor
  const HNOBT = "0xcF51ab7398315DbA6588Aa7fb3Df7c99D3D1F4dD";
  const VERIFIER_KEY = process.env.VERIFIER_KEY || deployer.address;

  const Distributor = await hre.ethers.getContractFactory("RewardDistributor");
  const distributor = await Distributor.deploy(
    await biometric.getAddress(),
    HNOBT,
    VERIFIER_KEY,
    deployer.address
  );
  await distributor.waitForDeployment();
  console.log("RewardDistributor:", await distributor.getAddress());

  console.log("\nDeployment complete!");
  console.log("BiometricVerification:", await biometric.getAddress());
  console.log("RewardDistributor:", await distributor.getAddress());

  if (hre.network.name !== "hardhat") {
    await verify("BiometricVerification", await biometric.getAddress(), [deployer.address]);
    await verify("RewardDistributor", await distributor.getAddress(), [
      await biometric.getAddress(), HNOBT, VERIFIER_KEY, deployer.address
    ]);
  }
}

async function verify(name, address, args) {
  try {
    await hre.run("verify:verify", { address, constructorArguments: args });
    console.log(`\u2713 ${name} verified`);
  } catch (e) {
    console.log(`\u2717 ${name} skipped: ${e.message.slice(0, 80)}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
