const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Trestle Marketplace (Modular)", function () {
  let core, digitalGoods, freelancerEscrow, feeDistributor, aiResolver;
  let owner, seller, buyer, freelancer, funder, verifier, other;
  const FEE = 300n;

  beforeEach(async function () {
    [owner, seller, buyer, freelancer, funder, verifier, other] = await ethers.getSigners();

    const FeeDistributor = await ethers.getContractFactory("MockFeeDistributor");
    feeDistributor = await FeeDistributor.deploy();
    await feeDistributor.waitForDeployment();

    const Core = await ethers.getContractFactory("MarketplaceCore");
    core = await Core.deploy(owner.address, await feeDistributor.getAddress());
    await core.waitForDeployment();

    const DigitalGoods = await ethers.getContractFactory("DigitalGoods");
    digitalGoods = await DigitalGoods.deploy(await core.getAddress());
    await digitalGoods.waitForDeployment();

    const FreelancerEscrow = await ethers.getContractFactory("FreelancerEscrow");
    freelancerEscrow = await FreelancerEscrow.deploy(await core.getAddress());
    await freelancerEscrow.waitForDeployment();

    await core.connect(owner).setModule(await digitalGoods.getAddress(), true);
    await core.connect(owner).setModule(await freelancerEscrow.getAddress(), true);

    const AIResolver = await ethers.getContractFactory("AIDisputeResolver");
    aiResolver = await AIResolver.deploy(
      await digitalGoods.getAddress(),
      await freelancerEscrow.getAddress(),
      verifier.address
    );
    await aiResolver.waitForDeployment();
    await core.connect(owner).setModule(await aiResolver.getAddress(), true);
  });

  function meta(s) { return ethers.encodeBytes32String(s); }

  describe("Digital Goods", function () {
    it("should list an item", async function () {
      await digitalGoods.connect(seller).listItem(
        meta("ipfs://QmTest"), ethers.parseEther("1"), ethers.ZeroAddress
      );
      const listing = await digitalGoods.listings(1);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.price).to.equal(ethers.parseEther("1"));
      expect(listing.active).to.be.true;
    });

    it("should allow purchase and confirm delivery", async function () {
      await digitalGoods.connect(seller).listItem(
        meta("ipfs://QmTest"), ethers.parseEther("10"), ethers.ZeroAddress
      );
      await digitalGoods.connect(buyer).buyItem(1, { value: ethers.parseEther("10") });

      const order = await digitalGoods.orders(1);
      expect(order.status).to.equal(0n);

      await digitalGoods.connect(buyer).confirmDelivery(1);
      const orderAfter = await digitalGoods.orders(1);
      expect(orderAfter.status).to.equal(1n);

      const net = ethers.parseEther("10") - (ethers.parseEther("10") * FEE / 10000n);
      const bal = await core.pendingWithdrawals(seller.address, ethers.ZeroAddress);
      expect(bal).to.equal(net);
    });

    it("should allow auto-release after expiry", async function () {
      await digitalGoods.connect(seller).listItem(
        meta("ipfs://QmTest"), ethers.parseEther("5"), ethers.ZeroAddress
      );
      await digitalGoods.connect(buyer).buyItem(1, { value: ethers.parseEther("5") });

      await ethers.provider.send("evm_increaseTime", [7 * 24 * 3600 + 1]);
      await ethers.provider.send("evm_mine");

      await digitalGoods.connect(seller).autoRelease(1);
      const order = await digitalGoods.orders(1);
      expect(order.status).to.equal(1n);
    });

    it("should allow dispute and resolve to seller", async function () {
      await digitalGoods.connect(seller).listItem(
        meta("ipfs://QmTest"), ethers.parseEther("5"), ethers.ZeroAddress
      );
      await digitalGoods.connect(buyer).buyItem(1, { value: ethers.parseEther("5") });
      await digitalGoods.connect(buyer).disputeOrder(1);

      const order = await digitalGoods.orders(1);
      expect(order.status).to.equal(2n);

      await digitalGoods.connect(owner).forceResolve(1, true);
      const net = ethers.parseEther("5") - (ethers.parseEther("5") * FEE / 10000n);
      const bal = await core.pendingWithdrawals(seller.address, ethers.ZeroAddress);
      expect(bal).to.equal(net);
    });
  });

  describe("Freelancer Services", function () {
    it("should post a service with milestones", async function () {
      await freelancerEscrow.connect(freelancer).postService(
        meta("Build Website"), ethers.parseEther("5"), ethers.ZeroAddress, 2
      );
      const svc = await freelancerEscrow.services(1);
      expect(svc.freelancer).to.equal(freelancer.address);
      expect(svc.totalPrice).to.equal(ethers.parseEther("5"));
    });

    it("should fund, complete, and release a milestone", async function () {
      await freelancerEscrow.connect(freelancer).postService(
        meta("Design Logo"), ethers.parseEther("2"), ethers.ZeroAddress, 1
      );
      await freelancerEscrow.connect(funder).fundMilestone(1, 0, { value: ethers.parseEther("2") });
      await freelancerEscrow.connect(freelancer).completeMilestone(1, 0);
      await freelancerEscrow.connect(funder).releaseMilestone(1, 0);

      const ms = await freelancerEscrow.mstates(1, 0);
      expect(ms.status).to.equal(3n);

      const net = ethers.parseEther("2") - (ethers.parseEther("2") * FEE / 10000n);
      const bal = await core.pendingWithdrawals(freelancer.address, ethers.ZeroAddress);
      expect(bal).to.equal(net);
    });

    it("should handle dispute and refund funder", async function () {
      await freelancerEscrow.connect(freelancer).postService(
        meta("Task"), ethers.parseEther("3"), ethers.ZeroAddress, 1
      );
      await freelancerEscrow.connect(funder).fundMilestone(1, 0, { value: ethers.parseEther("3") });
      await freelancerEscrow.connect(freelancer).completeMilestone(1, 0);
      await freelancerEscrow.connect(funder).disputeMilestone(1, 0);

      await freelancerEscrow.connect(owner).forceResolve(1, 0, false);

      const bal = await core.pendingWithdrawals(funder.address, ethers.ZeroAddress);
      expect(bal).to.equal(ethers.parseEther("3"));
    });
  });

  describe("AI Dispute Resolution (Off-Chain)", function () {
    async function signDispute(disputeId, kind, targetId, extraId, result, reasonHash) {
      const chainId = (await ethers.provider.getNetwork()).chainId;
      const msgHash = ethers.solidityPackedKeccak256(
        ["bytes32", "uint8", "uint256", "uint256", "bool", "bytes32", "uint256"],
        [disputeId, kind, targetId, extraId, result, reasonHash, chainId]
      );
      return verifier.signMessage(ethers.getBytes(msgHash));
    }

    it("should resolve digital order dispute off-chain", async function () {
      await digitalGoods.connect(seller).listItem(
        meta("ipfs://QmDispute"), ethers.parseEther("10"), ethers.ZeroAddress
      );
      await digitalGoods.connect(buyer).buyItem(1, { value: ethers.parseEther("10") });
      await digitalGoods.connect(buyer).disputeOrder(1);

      const disputeId = ethers.id("dispute-1");
      const reasonHash = ethers.id("AI ruled: seller delivered");
      const sig = await signDispute(disputeId, 0, 1, 0, true, reasonHash);

      await aiResolver.connect(other).submitAndExecute(disputeId, 0, 1, 0, true, reasonHash, sig);

      const order = await digitalGoods.orders(1);
      expect(order.status).to.equal(4n); // Resolved

      const net = ethers.parseEther("10") - (ethers.parseEther("10") * FEE / 10000n);
      const bal = await core.pendingWithdrawals(seller.address, ethers.ZeroAddress);
      expect(bal).to.equal(net);
    });

    it("should resolve freelancer milestone dispute off-chain", async function () {
      await freelancerEscrow.connect(freelancer).postService(
        meta("Design"), ethers.parseEther("5"), ethers.ZeroAddress, 1
      );
      await freelancerEscrow.connect(funder).fundMilestone(1, 0, { value: ethers.parseEther("5") });
      await freelancerEscrow.connect(freelancer).completeMilestone(1, 0);
      await freelancerEscrow.connect(funder).disputeMilestone(1, 0);

      const disputeId = ethers.id("freelancer-dispute-1");
      const reasonHash = ethers.id("AI ruled: refund buyer");
      const sig = await signDispute(disputeId, 1, 1, 0, false, reasonHash);

      await aiResolver.connect(other).submitAndExecute(disputeId, 1, 1, 0, false, reasonHash, sig);

      const ms = await freelancerEscrow.mstates(1, 0);
      expect(ms.status).to.equal(5n); // Refunded

      const bal = await core.pendingWithdrawals(funder.address, ethers.ZeroAddress);
      expect(bal).to.equal(ethers.parseEther("5"));
    });

    it("should reject invalid signature", async function () {
      await digitalGoods.connect(seller).listItem(
        meta("ipfs://QmTest"), ethers.parseEther("1"), ethers.ZeroAddress
      );
      await digitalGoods.connect(buyer).buyItem(1, { value: ethers.parseEther("1") });
      await digitalGoods.connect(buyer).disputeOrder(1);

      const disputeId = ethers.id("bad-sig");
      const reasonHash = ethers.id("fake");
      const fakeSig = await other.signMessage(ethers.getBytes(disputeId));

      await expect(
        aiResolver.connect(other).submitResolution(disputeId, 0, 1, 0, true, reasonHash, fakeSig)
      ).to.be.revertedWithCustomError(aiResolver, "InvalidSignature");
    });
  });

  describe("Withdrawals", function () {
    it("should withdraw MATIC from Core", async function () {
      await digitalGoods.connect(seller).listItem(
        meta("ipfs://QmTest"), ethers.parseEther("1"), ethers.ZeroAddress
      );
      await digitalGoods.connect(buyer).buyItem(1, { value: ethers.parseEther("1") });
      await digitalGoods.connect(buyer).confirmDelivery(1);

      const before = await ethers.provider.getBalance(seller.address);
      const tx = await core.connect(seller).withdraw(ethers.ZeroAddress);
      const receipt = await tx.wait();
      const spent = receipt.gasUsed * receipt.gasPrice;
      const after = await ethers.provider.getBalance(seller.address);

      const net = ethers.parseEther("1") - (ethers.parseEther("1") * FEE / 10000n);
      expect(after - before + spent).to.equal(net);
    });
  });
});
