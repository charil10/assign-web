// Contract addresses on BSC Testnet
export const CONTRACT_ADDRESSES = {
  stakingContract: "0x1E03A43cf2f5Db721c633ED5FE4Cea431b424154",
  mockToken: "0x728C0dC2DA74063354B94091fb9117BCD41D091e"
};

// BSC Testnet configuration
export const NETWORK_CONFIG = {
  chainId: "0x61", // 97 in hex
  chainName: "BSC Testnet",
  nativeCurrency: {
    name: "tBNB",
    symbol: "tBNB",
    decimals: 18
  },
  rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
  blockExplorerUrls: ["https://testnet.bscscan.com/"]
};
