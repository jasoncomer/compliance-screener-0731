export const riskScores: Record<string, number> = {
  // Exchange types
  'centralized exchange': 15,
  'decentralized exchange': 25,
  'dex': 25,
  'exchange': 15,
  
  // Privacy/Mixing services
  'mixer': 95,
  'privacy service': 90,
  'tornado cash': 95,
  'coinjoin': 85,
  
  // Gambling
  'gambling': 70,
  'casino': 70,
  'sports betting': 65,
  
  // Darknet/Marketplace
  'darknet': 100,
  'marketplace': 80,
  'illegal': 100,
  
  // DeFi/Lending
  'defi': 30,
  'lending': 35,
  'yield farming': 40,
  'staking': 20,
  
  // Mining
  'mining pool': 10,
  'mining': 10,
  
  // Gaming/NFT
  'gaming': 45,
  'nft': 50,
  'metaverse': 40,
  
  // Scam/Fraud
  'scam': 100,
  'fraud': 100,
  'phishing': 100,
  
  // Wallet/Personal
  'wallet': 5,
  'personal': 5,
  'individual': 5,
  
  // Unknown/Other
  'unknown': 60,
  'other': 50,
  'service': 40,
} 