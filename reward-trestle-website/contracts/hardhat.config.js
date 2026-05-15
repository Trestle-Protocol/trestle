import dotenv from "dotenv";
dotenv.config();
import "@nomicfoundation/hardhat-toolbox";

export default {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  paths: {
    sources: "./contracts",
  },
  networks: {
    hardhat: { chainId: 31337 },
    polygon: {
      url: process.env.POLYGON_RPC || "https://polygon-rpc.com/",
      chainId: 137,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
    customChains: [
      {
        network: "polygon",
        chainId: 137,
        urls: {
          apiURL: "https://api-polygonscan.com/api",
          browserURL: "https://polygonscan.com",
        },
      },
    ],
  },
};