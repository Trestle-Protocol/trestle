const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const biometricAddress = "0x8E3Dd0B0E261b16226E6DFBA080AEBb2431E2F44";
  const code = await hre.ethers.provider.getCode(biometricAddress);
  console.log("Deployed bytecode:", code);
  const artifact = await hre.artifacts.readArtifact("BiometricVerification");
  console.log("Artifact bytecode:", artifact.bytecode);
  if (code === artifact.bytecode) {
    console.log("Bytecodes match!");
  } else {
    console.log("Bytecodes do NOT match!");
    console.log("Length of deployed bytecode:", code.length);
    console.log("Length of artifact bytecode:", artifact.bytecode.length);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
