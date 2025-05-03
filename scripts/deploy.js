require("dotenv").config();
const hre = require("hardhat");

async function main() {
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy ArbitrageTrader
  console.log("Deploying ArbitrageTrader...");
  const ArbitrageTrader = await ethers.getContractFactory("ArbitrageTrader");
  const arbitrageTrader = await ArbitrageTrader.deploy();
  await arbitrageTrader.deployed();
  console.log("ArbitrageTrader deployed to:", arbitrageTrader.address);

  // Add initial markets (BSC DEXes)
  console.log("\nAdding initial markets...");
  const markets = [
    { name: "PancakeSwap", router: "0x10ED43C718714eb63d5aA57B78B54704E256024E" },
    { name: "BiSwap", router: "0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8" },
    { name: "ApeSwap", router: "0xcF0feBd3f17CEf5b47b0cD257aCf6025c5BFf3b7" },
    { name: "MDEX", router: "0x7DAe51BD3E3376B8c7c4900E9107f12Be3AF1bA8" }
  ];

  for (const market of markets) {
    console.log(`Adding market: ${market.name}`);
    await arbitrageTrader.addMarket(market.name, market.router);
  }

  // Add initial trading pairs
  console.log("\nAdding initial trading pairs...");
  const pairs = [
    { tokenA: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", tokenB: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c" }, // BUSD-BTCB
    { tokenA: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", tokenB: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8" }, // BUSD-ETH
    { tokenA: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", tokenB: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82" }, // BUSD-CAKE
    { tokenA: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", tokenB: "0x55d398326f99059fF775485246999027B3197955" }, // BUSD-USDT
    { tokenA: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", tokenB: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8" }, // BTCB-ETH
    { tokenA: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", tokenB: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82" }, // BTCB-CAKE
    { tokenA: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", tokenB: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82" }, // ETH-CAKE
    { tokenA: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", tokenB: "0x55d398326f99059fF775485246999027B3197955" }, // ETH-USDT
    { tokenA: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", tokenB: "0x55d398326f99059fF775485246999027B3197955" }, // CAKE-USDT
    { tokenA: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", tokenB: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56" }, // BNB-BUSD
    { tokenA: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", tokenB: "0x55d398326f99059fF775485246999027B3197955" }  // BNB-USDT
  ];

  for (const pair of pairs) {
    console.log(`Adding pair: ${pair.tokenA} - ${pair.tokenB}`);
    await arbitrageTrader.addTradingPair(pair.tokenA, pair.tokenB);
  }

  console.log("\nDeployment and setup complete!");
  console.log("ArbitrageTrader:", arbitrageTrader.address);
  console.log("Markets added:", markets.length);
  console.log("Trading pairs added:", pairs.length);

  // Verify contract on BSCScan
  if (process.env.BSCSCAN_API_KEY) {
    console.log("\nVerifying contract on BSCScan...");
    await hre.run("verify:verify", {
      address: arbitrageTrader.address,
      constructorArguments: []
    });
    console.log("Contract verified on BSCScan!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
