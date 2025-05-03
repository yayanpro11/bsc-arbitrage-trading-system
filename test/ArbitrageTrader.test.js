const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ArbitrageTrader", function () {
  let ArbitrageTrader;
  let arbitrageTrader;
  let owner;
  let user;
  let mockTokenA;
  let mockTokenB;
  let mockRouterA;
  let mockRouterB;

  beforeEach(async function () {
    // Get signers
    [owner, user] = await ethers.getSigners();

    // Deploy mock tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockTokenA = await MockERC20.deploy("Mock Token A", "MTA");
    await mockTokenA.deployed();
    mockTokenB = await MockERC20.deploy("Mock Token B", "MTB");
    await mockTokenB.deployed();

    // Deploy mock routers
    const MockRouter = await ethers.getContractFactory("MockRouter");
    mockRouterA = await MockRouter.deploy();
    await mockRouterA.deployed();
    mockRouterB = await MockRouter.deploy();
    await mockRouterB.deployed();

    // Deploy ArbitrageTrader
    ArbitrageTrader = await ethers.getContractFactory("ArbitrageTrader");
    arbitrageTrader = await ArbitrageTrader.deploy();
    await arbitrageTrader.deployed();

    // Setup initial balances and approvals
    const setupAmount = ethers.utils.parseEther("1000");
    
    // Fund user
    await mockTokenA.transfer(user.address, setupAmount);
    
    // Fund routers with both tokens
    await mockTokenA.approve(mockRouterA.address, setupAmount);
    await mockTokenA.approve(mockRouterB.address, setupAmount);
    await mockTokenB.approve(mockRouterA.address, setupAmount);
    await mockTokenB.approve(mockRouterB.address, setupAmount);
    
    await mockRouterA.fundRouter(mockTokenA.address, setupAmount);
    await mockRouterA.fundRouter(mockTokenB.address, setupAmount);
    await mockRouterB.fundRouter(mockTokenA.address, setupAmount);
    await mockRouterB.fundRouter(mockTokenB.address, setupAmount);
    
    // Approve tokens for trading
    await mockTokenA.connect(user).approve(arbitrageTrader.address, setupAmount);
    await mockTokenB.connect(user).approve(arbitrageTrader.address, setupAmount);
  });

  describe("Market Management", function () {
    it("Should add a new market", async function () {
      const marketName = "PancakeSwap";
      await arbitrageTrader.addMarket(marketName, mockRouterA.address);
      
      const market = await arbitrageTrader.markets(0);
      expect(market.name).to.equal(marketName);
      expect(market.router).to.equal(mockRouterA.address);
      expect(market.isActive).to.equal(true);
    });

    it("Should add a trading pair", async function () {
      await arbitrageTrader.addTradingPair(mockTokenA.address, mockTokenB.address);
      
      const pair = await arbitrageTrader.tradingPairs(0);
      expect(pair.tokenA).to.equal(mockTokenA.address);
      expect(pair.tokenB).to.equal(mockTokenB.address);
      expect(pair.isActive).to.equal(true);
    });

    it("Should only allow owner to add markets", async function () {
      await expect(
        arbitrageTrader.connect(user).addMarket("BiSwap", mockRouterB.address)
      ).to.be.reverted;
    });

    it("Should only allow owner to add trading pairs", async function () {
      await expect(
        arbitrageTrader.connect(user).addTradingPair(
          mockTokenA.address,
          mockTokenB.address
        )
      ).to.be.reverted;
    });
  });

  describe("Fee Management", function () {
    beforeEach(async function () {
      await arbitrageTrader.addMarket("Market1", mockRouterA.address);
      await arbitrageTrader.addMarket("Market2", mockRouterB.address);
      await arbitrageTrader.addTradingPair(mockTokenA.address, mockTokenB.address);
    });

    it("Should correctly calculate and transfer fees", async function () {
      const amount = ethers.utils.parseEther("100");
      const expectedFee = amount.mul(30).div(10000); // 0.3% fee
      
      // Get initial balances
      const initialUserBalance = await mockTokenA.balanceOf(user.address);
      const initialOwnerBalance = await mockTokenA.balanceOf(owner.address);

      // Execute arbitrage
      await arbitrageTrader.connect(user).executeArbitrage(
        0,
        1,
        0,
        amount,
        "0x",
        "0x"
      );

      // Get final balances
      const finalUserBalance = await mockTokenA.balanceOf(user.address);
      const finalOwnerBalance = await mockTokenA.balanceOf(owner.address);

      // Verify fee went to owner
      expect(finalOwnerBalance.sub(initialOwnerBalance)).to.equal(expectedFee);

      // Verify user got back original amount minus fee
      const expectedUserBalance = initialUserBalance.sub(expectedFee);
      expect(finalUserBalance).to.equal(expectedUserBalance);
    });
  });

  describe("Arbitrage Execution", function () {
    beforeEach(async function () {
      await arbitrageTrader.addMarket("Market1", mockRouterA.address);
      await arbitrageTrader.addMarket("Market2", mockRouterB.address);
      await arbitrageTrader.addTradingPair(mockTokenA.address, mockTokenB.address);
    });

    it("Should revert if market does not exist", async function () {
      await expect(
        arbitrageTrader.executeArbitrage(
          99, // Invalid market ID
          0,
          0,
          ethers.utils.parseEther("1"),
          "0x",
          "0x"
        )
      ).to.be.revertedWith("Invalid market");
    });

    it("Should revert if pair does not exist", async function () {
      await expect(
        arbitrageTrader.executeArbitrage(
          0,
          1,
          99, // Invalid pair ID
          ethers.utils.parseEther("1"),
          "0x",
          "0x"
        )
      ).to.be.revertedWith("Invalid pair");
    });

    it("Should execute complete arbitrage flow successfully", async function () {
      const amount = ethers.utils.parseEther("100");
      const expectedFee = amount.mul(30).div(10000); // 0.3% fee
      
      // Get initial balances
      const initialUserBalance = await mockTokenA.balanceOf(user.address);
      const initialOwnerBalance = await mockTokenA.balanceOf(owner.address);

      // Execute arbitrage
      await arbitrageTrader.connect(user).executeArbitrage(
        0,
        1,
        0,
        amount,
        "0x",
        "0x"
      );

      // Get final balances
      const finalUserBalance = await mockTokenA.balanceOf(user.address);
      const finalOwnerBalance = await mockTokenA.balanceOf(owner.address);

      // Verify fee went to owner
      expect(finalOwnerBalance.sub(initialOwnerBalance)).to.equal(expectedFee);

      // Verify user got back original amount minus fee
      const expectedUserBalance = initialUserBalance.sub(expectedFee);
      expect(finalUserBalance).to.equal(expectedUserBalance);
    });
  });
});
