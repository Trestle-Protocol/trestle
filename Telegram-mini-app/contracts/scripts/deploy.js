const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // 1. Deploy FeeDistributor
  const FeeDistributor = await hre.ethers.getContractFactory("MockFeeDistributor");
  const feeDistributor = await FeeDistributor.deploy();
  await feeDistributor.waitForDeployment();
  console.log("FeeDistributor:", await feeDistributor.getAddress());

  // 2. Deploy MarketplaceCore (hub)
  const Core = await hre.ethers.getContractFactory("MarketplaceCore");
  const core = await Core.deploy(deployer.address, await feeDistributor.getAddress());
  await core.waitForDeployment();
  console.log("MarketplaceCore:", await core.getAddress());

  // 3. Deploy DigitalGoods
  const DigitalGoods = await hre.ethers.getContractFactory("DigitalGoods");
  const digitalGoods = await DigitalGoods.deploy(await core.getAddress());
  await digitalGoods.waitForDeployment();
  console.log("DigitalGoods:", await digitalGoods.getAddress());

  // 4. Deploy FreelancerEscrow
  const FreelancerEscrow = await hre.ethers.getContractFactory("FreelancerEscrow");
  const freelancerEscrow = await FreelancerEscrow.deploy(await core.getAddress());
  await freelancerEscrow.waitForDeployment();
  console.log("FreelancerEscrow:", await freelancerEscrow.getAddress());

  // 5. Approve modules in Core
  await core.setModule(await digitalGoods.getAddress(), true);
  await core.setModule(await freelancerEscrow.getAddress(), true);
  console.log("Modules approved");

  // 6. Deploy AI Dispute Resolver (off-chain resolution)
  const VERIFIER_KEY = process.env.VERIFIER_KEY || deployer.address;
  const AIResolver = await hre.ethers.getContractFactory("AIDisputeResolver");
  const aiResolver = await AIResolver.deploy(
    await digitalGoods.getAddress(),
    await freelancerEscrow.getAddress(),
    VERIFIER_KEY
  );
  await aiResolver.waitForDeployment();
  await core.setModule(await aiResolver.getAddress(), true);
  console.log("AIDisputeResolver:", await aiResolver.getAddress());

  console.log("\nDeployment complete!");
  console.log("Core:", await core.getAddress());
  console.log("DigitalGoods:", await digitalGoods.getAddress());
  console.log("FreelancerEscrow:", await freelancerEscrow.getAddress());
  console.log("AIDisputeResolver:", await aiResolver.getAddress());
  console.log("FeeDistributor:", await feeDistributor.getAddress());

  // Verify contracts (skip on local hardhat network)
  if (hre.network.name !== "hardhat") {
    await verify("MockFeeDistributor", await feeDistributor.getAddress(), []);
    await verify("MarketplaceCore", await core.getAddress(), [deployer.address, await feeDistributor.getAddress()]);
    await verify("DigitalGoods", await digitalGoods.getAddress(), [await core.getAddress()]);
    await verify("FreelancerEscrow", await freelancerEscrow.getAddress(), [await core.getAddress()]);
    await verify("AIDisputeResolver", await aiResolver.getAddress(), [
      await digitalGoods.getAddress(), await freelancerEscrow.getAddress(), VERIFIER_KEY
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
