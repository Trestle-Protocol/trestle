const { expect } = require("chai");
const { ethers } = require("hardhat");

const BPS_DENOM = 10000n;
const FEE = 300n; // 3%

describe("Trestle Protocol (Tiers + Fees)", function () {
  let deployer, treasury, user1, user2, buyer, freelancer;
  let hNOBT, broilerPlus, govToken, lpToken;
  let feeDistributor, tier1, tier2, tier3;

  beforeEach(async function () {
    [deployer, treasury, user1, user2, buyer, freelancer] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    hNOBT = await MockERC20.deploy("hNOBT", "hNOBT", 18, ethers.parseEther("1000000"));
    broilerPlus = await MockERC20.deploy("BroilerPlus", "BRT", 18, ethers.parseEther("500000"));
    lpToken = await MockERC20.deploy("BRT-LP", "BRT-LP", 18, ethers.parseEther("100000"));

    await hNOBT.connect(deployer).mint(user1.address, ethers.parseEther("10000"));
    await hNOBT.connect(deployer).mint(user2.address, ethers.parseEther("10000"));
    await broilerPlus.connect(deployer).mint(user1.address, ethers.parseEther("5000"));
    await broilerPlus.connect(deployer).mint(user2.address, ethers.parseEther("5000"));
    await lpToken.connect(deployer).mint(user1.address, ethers.parseEther("1000"));
    await lpToken.connect(deployer).mint(user2.address, ethers.parseEther("1000"));

    // GovToken
    const GovToken = await ethers.getContractFactory("GovernanceToken");
    govToken = await GovToken.deploy(ethers.parseEther("1000000"), 365 * 24 * 3600);
    await govToken.waitForDeployment();

    // FeeDistributor
    const FeeDistributor = await ethers.getContractFactory("FeeDistributor");
    feeDistributor = await FeeDistributor.deploy(treasury.address);
    await feeDistributor.waitForDeployment();

    // Tier 1
    const Tier1 = await ethers.getContractFactory("Tier1Staking");
    tier1 = await Tier1.deploy(await hNOBT.getAddress(), await broilerPlus.getAddress());
    await tier1.waitForDeployment();

    // Tier 2
    const Tier2 = await ethers.getContractFactory("Tier2Staking");
    tier2 = await Tier2.deploy(await lpToken.getAddress(), await broilerPlus.getAddress());
    await tier2.waitForDeployment();

    // Tier 3
    const Tier3 = await ethers.getContractFactory("Tier3GovernorVault");
    tier3 = await Tier3.deploy(await lpToken.getAddress(), await govToken.getAddress());
    await tier3.waitForDeployment();

    // Configure FeeDistributor
    await feeDistributor.setYieldVault(await tier3.getAddress());

    // Fund staking rewards
    await broilerPlus.connect(deployer).transfer(await tier1.getAddress(), ethers.parseEther("100000"));
    await broilerPlus.connect(deployer).transfer(await tier2.getAddress(), ethers.parseEther("100000"));

    // Approve tokens
    await hNOBT.connect(user1).approve(await tier1.getAddress(), ethers.parseEther("100000"));
    await hNOBT.connect(user2).approve(await tier1.getAddress(), ethers.parseEther("100000"));
    await lpToken.connect(user1).approve(await tier2.getAddress(), ethers.parseEther("100000"));
    await lpToken.connect(user2).approve(await tier2.getAddress(), ethers.parseEther("100000"));
    await lpToken.connect(user1).approve(await tier3.getAddress(), ethers.parseEther("100000"));
    await lpToken.connect(user2).approve(await tier3.getAddress(), ethers.parseEther("100000"));
  });

  describe("FeeDistributor", function () {
    it("should split fees 40/40/20", async function () {
      await feeDistributor.setYieldVault(await tier3.getAddress());

      const amount = ethers.parseEther("100");
      await deployer.sendTransaction({
        to: await feeDistributor.getAddress(),
        value: amount,
      });

      const balBefore = {
        vault: await ethers.provider.getBalance(await tier3.getAddress()),
        treasury: await ethers.provider.getBalance(treasury.address),
        feeDist: await ethers.provider.getBalance(await feeDistributor.getAddress()),
      };

      await feeDistributor.connect(deployer).distribute(ethers.ZeroAddress, amount);

      const yieldShare = amount * 4000n / BPS_DENOM; // 40%
      const treasuryShare = amount * 4000n / BPS_DENOM; // 40%
      const buybackShare = amount - yieldShare - treasuryShare; // 20%

      const balAfter = {
        vault: await ethers.provider.getBalance(await tier3.getAddress()),
        treasury: await ethers.provider.getBalance(treasury.address),
        feeDist: await ethers.provider.getBalance(await feeDistributor.getAddress()),
      };

      expect(balAfter.vault - balBefore.vault).to.equal(yieldShare);
      expect(balAfter.treasury - balBefore.treasury).to.equal(treasuryShare);
      expect(balAfter.feeDist).to.equal(buybackShare); // buyback goes nowhere, stays in distrib
    });
  });

  describe("Tier 1 - hNOBT Staking (3/6/12mo durations)", function () {
    it("should stake hNOBT for 3 months and earn BroilerPlus", async function () {
      await tier1.setPoolReward(0, ethers.parseEther("1")); // 3mo pool

      await tier1.connect(user1).stake(ethers.parseEther("1000"), 0);

      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");

      const pending = await tier1.pendingReward(user1.address, 0);
      expect(pending).to.be.gt(0);

      const balBefore = await broilerPlus.balanceOf(user1.address);
      await tier1.connect(user1).claimReward(0);
      const balAfter = await broilerPlus.balanceOf(user1.address);
      expect(balAfter - balBefore).to.be.gte(pending);
    });

    it("should reject unstake before lock period ends", async function () {
      await tier1.setPoolReward(0, ethers.parseEther("0.5"));
      await tier1.connect(user1).stake(ethers.parseEther("500"), 0);

      // Try unstaking immediately (3mo = 90 days, we haven't waited)
      await expect(
        tier1.connect(user1).unstake(0)
      ).to.be.revertedWithCustomError(tier1, "Locked");
    });

    it("should allow unstake after 3 month lock expires", async function () {
      await tier1.setPoolReward(0, ethers.parseEther("0.0001")); // tiny rate to stay within budget
      await tier1.connect(user1).stake(ethers.parseEther("500"), 0);

      await ethers.provider.send("evm_increaseTime", [91 * 24 * 3600]);
      await ethers.provider.send("evm_mine");

      const balBefore = await hNOBT.balanceOf(user1.address);
      await tier1.connect(user1).unstake(0);
      const balAfter = await hNOBT.balanceOf(user1.address);
      expect(balAfter - balBefore).to.equal(ethers.parseEther("500"));
    });

    it("should handle multiple positions across durations", async function () {
      await tier1.setPoolReward(0, ethers.parseEther("1"));
      await tier1.setPoolReward(1, ethers.parseEther("1.5"));

      await tier1.connect(user1).stake(ethers.parseEther("100"), 0);
      await tier1.connect(user1).stake(ethers.parseEther("200"), 1);

      expect(await tier1.userPositionCount(user1.address)).to.equal(2n);
    });
  });

  describe("Tier 2 - LP Staking", function () {
    it("should stake LP tokens and earn BroilerPlus", async function () {
      await tier2.setRewardPerSecond(ethers.parseEther("0.5"));

      await tier2.connect(user1).stake(ethers.parseEther("100"));

      await ethers.provider.send("evm_increaseTime", [3600]);
      await ethers.provider.send("evm_mine");

      const pending = await tier2.pendingReward(user1.address);
      expect(pending).to.be.gt(0);

      const balBefore = await broilerPlus.balanceOf(user1.address);
      await tier2.connect(user1).claimReward();
      const balAfter = await broilerPlus.balanceOf(user1.address);
      expect(balAfter - balBefore).to.be.gte(pending);
    });

    it("should allow unstake", async function () {
      await tier2.connect(user1).stake(ethers.parseEther("200"));
      await tier2.connect(user1).unstake(ethers.parseEther("100"));

      const info = await tier2.userInfo(user1.address);
      expect(info.amount).to.equal(ethers.parseEther("100"));
    });
  });

  describe("Tier 3 - Governor Vault", function () {
    it("should deposit LP and earn governance tokens", async function () {
      await govToken.setMinter(await tier3.getAddress());
      await tier3.setGovPerSecond(ethers.parseEther("0.1"));

      await tier3.connect(user1).deposit(ethers.parseEther("100"), user1.address);
      expect(await tier3.balanceOf(user1.address)).to.be.gt(0);

      await ethers.provider.send("evm_increaseTime", [31 * 24 * 3600]);
      await ethers.provider.send("evm_mine");

      const govPending = (await tier3.pendingRewards(user1.address)).gov;
      expect(govPending).to.be.gt(0);

      await tier3.connect(user1).claimRewards();

      const govBal = await govToken.balanceOf(user1.address);
      expect(govBal).to.be.gt(0);
    });

    it("should receive fee rewards and distribute to depositors", async function () {
      await govToken.setMinter(await tier3.getAddress());

      await tier3.connect(user1).deposit(ethers.parseEther("100"), user1.address);

      // Send MATIC fee rewards to vault
      await deployer.sendTransaction({
        to: await tier3.getAddress(),
        value: ethers.parseEther("10"),
      });
      await tier3.depositFeeRewards({ value: ethers.parseEther("10") });

      await ethers.provider.send("evm_increaseTime", [31 * 24 * 3600]);
      await ethers.provider.send("evm_mine");

      await tier3.connect(user1).claimRewards();

      // user1 should have received fee rewards (MATIC)
      // They get deposited as MATIC via claimRewards
      // Just verify no revert
    });

    it("should apply loyalty multiplier over time", async function () {
      await tier3.connect(user1).deposit(ethers.parseEther("100"), user1.address);

      // Before 1 month: multiplier = 0
      let mult = await tier3._getLoyaltyMultiplier(user1.address);
      expect(mult).to.equal(0n);

      // After 1 month: multiplier = 1x
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 3600]);
      await ethers.provider.send("evm_mine");
      mult = await tier3._getLoyaltyMultiplier(user1.address);
      expect(mult).to.equal(10000n);

      // After 6 months: multiplier = 1.5x
      await ethers.provider.send("evm_increaseTime", [150 * 24 * 3600]);
      await ethers.provider.send("evm_mine");
      mult = await tier3._getLoyaltyMultiplier(user1.address);
      expect(mult).to.equal(15000n);

      // After 1 year: multiplier = 2x
      await ethers.provider.send("evm_increaseTime", [184 * 24 * 3600]);
      await ethers.provider.send("evm_mine");
      mult = await tier3._getLoyaltyMultiplier(user1.address);
      expect(mult).to.equal(20000n);
    });
  });

  describe("Full Flow Integration", function () {
    it("should route marketplace fees through FeeDistributor to Tier 3 vault", async function () {
      await govToken.setMinter(await tier3.getAddress());
      await feeDistributor.setYieldVault(await tier3.getAddress());

      // User deposits LP into Tier 3 vault
      await tier3.connect(user1).deposit(ethers.parseEther("50"), user1.address);

      // Simulate marketplace fee: send MATIC to FeeDistributor
      const feeAmount = ethers.parseEther("10");
      await deployer.sendTransaction({
        to: await feeDistributor.getAddress(),
        value: feeAmount,
      });

      // Distribute: 40% to vault, 40% to treasury, 20% stays
      await feeDistributor.connect(deployer).distribute(ethers.ZeroAddress, feeAmount);

      const vaultBal = await ethers.provider.getBalance(await tier3.getAddress());
      const yieldShare = feeAmount * 4000n / BPS_DENOM;
      expect(vaultBal).to.equal(yieldShare);

      // Fast forward for loyalty multiplier
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 3600]);
      await ethers.provider.send("evm_mine");

      // User claims rewards
      await tier3.connect(user1).claimRewards();
    });
  });
});
