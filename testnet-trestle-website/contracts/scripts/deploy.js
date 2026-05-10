const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Mainnet addresses
  const HNOBT = "0xcF51ab7398315DbA6588Aa7fb3Df7c99D3D1F4dD";
  const BROILERPLUS = "0xeCb4cAc0C9e5cBd42a9Ed36467ce8f96072AD58b";
  const BRT_LP = "0xc445b18b3ff85e0691fe416ad91e456f8697b166";  // BRT/WMATIC QuickSwap
  const TREASURY = "0x64A7ef92229D2D97d1C4fd3DB15Db2d94d3D66F6";   // Gnosis Safe

  // 1. Governance Token
  const GovToken = await hre.ethers.getContractFactory("GovernanceToken");
  const govToken = await GovToken.deploy(
    hre.ethers.parseEther("1000000"),  // 1M max supply
    365 * 24 * 3600                    // 1 year emission period
  );
  await govToken.waitForDeployment();
  console.log("GovernanceToken:", await govToken.getAddress());

  // 2. Fee Distributor
  const FeeDistributor = await hre.ethers.getContractFactory("FeeDistributor");
  const feeDistributor = await FeeDistributor.deploy(TREASURY);
  await feeDistributor.waitForDeployment();
  console.log("FeeDistributor:", await feeDistributor.getAddress());

  // 3. Tier 1 - hNOBT → BroilerPlus
  const Tier1 = await hre.ethers.getContractFactory("Tier1Staking");
  const tier1 = await Tier1.deploy(HNOBT, BROILERPLUS);
  await tier1.waitForDeployment();
  console.log("Tier1Staking:", await tier1.getAddress());

  // 4. Tier 2 - LP Staking
  const Tier2 = await hre.ethers.getContractFactory("Tier2Staking");
  const tier2 = await Tier2.deploy(BRT_LP, BROILERPLUS);
  await tier2.waitForDeployment();
  console.log("Tier2Staking:", await tier2.getAddress());

  // 5. Tier 3 - Governor Vault
  const Tier3 = await hre.ethers.getContractFactory("Tier3GovernorVault");
  const tier3 = await Tier3.deploy(BRT_LP, await govToken.getAddress());
  await tier3.waitForDeployment();
  console.log("Tier3GovernorVault:", await tier3.getAddress());

  // 6. Digital RWA (testnet - deploy once per asset)
  const RWA_META = hre.ethers.encodeBytes32String("ipfs://QmPlaceholder");
  const DigitalRWA = await hre.ethers.getContractFactory("DigitalRWA");
  const digitalRWA = await DigitalRWA.deploy(
    "Digital Asset 1", "DA1",
    RWA_META,
    hre.ethers.parseEther("1000000"),
    deployer.address
  );
  await digitalRWA.waitForDeployment();
  console.log("DigitalRWA:", await digitalRWA.getAddress());

  // Configure
  await feeDistributor.setYieldVault(await tier3.getAddress());
  await govToken.setMinter(await tier3.getAddress());

  console.log("\nDeployment complete!");
  console.log("============");
  console.log("GovToken:", await govToken.getAddress());
  console.log("FeeDistributor:", await feeDistributor.getAddress());
  console.log("Tier1Staking:", await tier1.getAddress());
  console.log("Tier2Staking:", await tier2.getAddress());
  console.log("Tier3Vault:", await tier3.getAddress());
  console.log("DigitalRWA:", await digitalRWA.getAddress());

  // Verify contracts (skip on local hardhat network)
  if (hre.network.name !== "hardhat") {
    await verify("GovernanceToken", await govToken.getAddress(), [
      hre.ethers.parseEther("1000000"), 365 * 24 * 3600
    ]);
    await verify("FeeDistributor", await feeDistributor.getAddress(), [TREASURY]);
    await verify("Tier1Staking", await tier1.getAddress(), [HNOBT, BROILERPLUS]);
    await verify("Tier2Staking", await tier2.getAddress(), [BRT_LP, BROILERPLUS]);
    await verify("Tier3GovernorVault", await tier3.getAddress(), [BRT_LP, await govToken.getAddress()]);
    await verify("DigitalRWA", await digitalRWA.getAddress(), [
      "Digital Asset 1", "DA1",
      RWA_META,
      hre.ethers.parseEther("1000000"),
      deployer.address
    ]);
  }
}

async function verify(name, address, args) {
  try {
    await hre.run("verify:verify", { address, constructorArguments: args });
    console.log(`✓ ${name} verified`);
  } catch (e) {
    console.log(`✗ ${name} skipped: ${e.message.slice(0, 80)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
