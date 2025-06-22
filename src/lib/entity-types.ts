export const getColorForEntityType = (entityType: string): string => {
  const colorMap: Record<string, string> = {
    // Exchange types
    'centralized exchange': '#3B82F6', // blue
    'decentralized exchange': '#8B5CF6', // purple
    'dex': '#8B5CF6', // purple
    'exchange': '#3B82F6', // blue
    
    // Privacy/Mixing services
    'mixer': '#EF4444', // red
    'privacy service': '#F97316', // orange
    'tornado cash': '#EF4444', // red
    'coinjoin': '#F97316', // orange
    
    // Gambling
    'gambling': '#F59E0B', // amber
    'casino': '#F59E0B', // amber
    'sports betting': '#F59E0B', // amber
    
    // Darknet/Marketplace
    'darknet': '#DC2626', // red-600
    'marketplace': '#EA580C', // orange-600
    'illegal': '#DC2626', // red-600
    
    // DeFi/Lending
    'defi': '#10B981', // emerald
    'lending': '#059669', // emerald-600
    'yield farming': '#10B981', // emerald
    'staking': '#10B981', // emerald
    
    // Mining
    'mining pool': '#6B7280', // gray
    'mining': '#6B7280', // gray
    
    // Gaming/NFT
    'gaming': '#EC4899', // pink
    'nft': '#EC4899', // pink
    'metaverse': '#EC4899', // pink
    
    // Scam/Fraud
    'scam': '#DC2626', // red-600
    'fraud': '#DC2626', // red-600
    'phishing': '#DC2626', // red-600
    
    // Wallet/Personal
    'wallet': '#6B7280', // gray
    'personal': '#6B7280', // gray
    'individual': '#6B7280', // gray
    
    // Unknown/Other
    'unknown': '#9CA3AF', // gray-400
    'other': '#9CA3AF', // gray-400
    'service': '#6B7280', // gray
  }
  
  return colorMap[entityType] || '#9CA3AF' // default gray
}

export const getEmojiForEntityType = (entityType: string): string => {
  const emojiMap: Record<string, string> = {
    // Exchange types
    'centralized exchange': '🏦',
    'decentralized exchange': '🔄',
    'dex': '🔄',
    'exchange': '🏦',
    
    // Privacy/Mixing services
    'mixer': '🌫️',
    'privacy service': '🔒',
    'tornado cash': '🌪️',
    'coinjoin': '🤝',
    
    // Gambling
    'gambling': '🎰',
    'casino': '🎰',
    'sports betting': '⚽',
    
    // Darknet/Marketplace
    'darknet': '🕸️',
    'marketplace': '🛒',
    'illegal': '🚫',
    
    // DeFi/Lending
    'defi': '📈',
    'lending': '💰',
    'yield farming': '🌾',
    'staking': '🔒',
    
    // Mining
    'mining pool': '⛏️',
    'mining': '⛏️',
    
    // Gaming/NFT
    'gaming': '🎮',
    'nft': '🖼️',
    'metaverse': '🌐',
    
    // Scam/Fraud
    'scam': '⚠️',
    'fraud': '🚨',
    'phishing': '🎣',
    
    // Wallet/Personal
    'wallet': '👛',
    'personal': '👤',
    'individual': '👤',
    
    // Unknown/Other
    'unknown': '❓',
    'other': '📦',
    'service': '🔧',
  }
  
  return emojiMap[entityType] || '❓' // default question mark
} 