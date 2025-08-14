import { FTConnection, FTNode } from '../components/NetworkGraph';

export const mockNodes: FTNode[] = [
  { id: 'unknown_bc1qcr', label: 'Unknown_bc1qcr', x: 520, y: 260, type: 'wallet', risk: 85 },
  { id: 'exchange', label: 'Exchange', x: 430, y: 300, type: 'exchange', risk: 40 },
  { id: 'hacker', label: 'Hacker Wallet', x: 520, y: 320, type: 'wallet', risk: 95 },
  { id: 'pass_wallet', label: 'Pass-through Wallet', x: 585, y: 260, type: 'wallet', risk: 70 },
  { id: 'tornado1', label: 'Tornado.cash', x: 1030, y: 390, type: 'mixer', risk: 98 },
  { id: 'tornado2', label: 'Tornado.cash', x: 720, y: 520, type: 'mixer', risk: 98 },
  { id: 'bridge', label: 'Bridge', x: 760, y: 360, type: 'bridge', risk: 60 },
];

export const mockConnections: FTConnection[] = [
  { from: 'exchange', to: 'hacker', amount: '8', currency: 'BTC', color: '#9ca3af' },
  { from: 'hacker', to: 'pass_wallet', amount: '11.0', currency: 'BTC', color: '#9ca3af' },
  { from: 'pass_wallet', to: 'unknown_bc1qcr', amount: '137.65', currency: 'USDC', color: '#9ca3af' },
  { from: 'unknown_bc1qcr', to: 'bridge', amount: '9.99', currency: 'USDC', color: '#9ca3af' },
  { from: 'bridge', to: 'tornado1', amount: '19.17', currency: 'USDC', color: '#9ca3af' },
  { from: 'tornado2', to: 'tornado1', amount: '5.0', currency: 'BTC', color: '#9ca3af' },
];

export const mockLeftPanel = {
  network: 'Ethereum',
  balance: '12.5 BTC',
  usdValue: '$537,500',
  txCount: 156,
  riskScore: 85,
  address: 'bc1qcracked123456789012345678901234567890',
};


