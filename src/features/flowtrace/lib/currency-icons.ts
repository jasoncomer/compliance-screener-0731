// Currency icon mapping using proper currency logo images
// This provides high-quality currency logos for both crypto and fiat currencies

export interface CurrencyIcon {
  code: string
  name: string
  logo: string
  type: 'crypto' | 'fiat'
}

export const currencyIcons: CurrencyIcon[] = [
  // Major Cryptocurrencies
  { code: 'BTC', name: 'Bitcoin', logo: '/logos/btc.png', type: 'crypto' },
  { code: 'ETH', name: 'Ethereum', logo: '/logos/eth.png', type: 'crypto' },
  { code: 'USDC', name: 'USD Coin', logo: '/logos/usdc.png', type: 'crypto' },
  { code: 'USDT', name: 'Tether', logo: '/logos/usdt.png', type: 'crypto' },
  { code: 'DAI', name: 'Dai', logo: '/logos/dai.png', type: 'crypto' },
  { code: 'MATIC', name: 'Polygon', logo: '/logos/matic.png', type: 'crypto' },
  { code: 'AVAX', name: 'Avalanche', logo: '/logos/avax.png', type: 'crypto' },
  { code: 'BNB', name: 'BNB', logo: '/logos/bnb.png', type: 'crypto' },
  { code: 'SOL', name: 'Solana', logo: '/logos/sol.png', type: 'crypto' },
  { code: 'ADA', name: 'Cardano', logo: '/logos/ada.png', type: 'crypto' },

  // Major Fiat Currencies
  { code: 'USD', name: 'US Dollar', logo: '/logos/currencies/usd.svg', type: 'fiat' },
  { code: 'EUR', name: 'Euro', logo: '/logos/currencies/eur.svg', type: 'fiat' },
  { code: 'GBP', name: 'British Pound', logo: '/logos/currencies/gbp.svg', type: 'fiat' },
  { code: 'JPY', name: 'Japanese Yen', logo: '/logos/currencies/jpy.svg', type: 'fiat' },
  { code: 'CAD', name: 'Canadian Dollar', logo: '/logos/currencies/cad.svg', type: 'fiat' },
  { code: 'CHF', name: 'Swiss Franc', logo: '/logos/currencies/chf.svg', type: 'fiat' },
  { code: 'AUD', name: 'Australian Dollar', logo: '/logos/currencies/aud.svg', type: 'fiat' },
  { code: 'CNY', name: 'Chinese Yuan', logo: '/logos/cn.svg', type: 'fiat' },
  { code: 'INR', name: 'Indian Rupee', logo: '/logos/in.svg', type: 'fiat' },
  { code: 'BRL', name: 'Brazilian Real', logo: '/logos/br.svg', type: 'fiat' },
  { code: 'MXN', name: 'Mexican Peso', logo: '/logos/mx.svg', type: 'fiat' },
  { code: 'KRW', name: 'South Korean Won', logo: '/logos/kr.svg', type: 'fiat' },
  { code: 'SGD', name: 'Singapore Dollar', logo: '/logos/sg.svg', type: 'fiat' },
]

const currencyIconMap = new Map<string, CurrencyIcon>()
currencyIcons.forEach(icon => {
  currencyIconMap.set(icon.code.toUpperCase(), icon)
})

export function getCurrencyIcon(code: string): CurrencyIcon | undefined {
  return currencyIconMap.get(code.toUpperCase())
}

export function getCurrencyLogo(code: string): string {
  const icon = getCurrencyIcon(code)
  if (icon) return icon.logo
  return '/logos/btc.png'
}

export function getCurrencyName(code: string): string {
  return getCurrencyIcon(code)?.name || code.toUpperCase()
}

export function getPopularCurrencies(): CurrencyIcon[] {
  return [
    { code: 'USD', name: 'US Dollar', logo: '/logos/currencies/usd.svg', type: 'fiat' },
    { code: 'EUR', name: 'Euro', logo: '/logos/currencies/eur.svg', type: 'fiat' },
    { code: 'GBP', name: 'British Pound', logo: '/logos/currencies/gbp.svg', type: 'fiat' },
    { code: 'JPY', name: 'Japanese Yen', logo: '/logos/currencies/jpy.svg', type: 'fiat' },
    { code: 'CAD', name: 'Canadian Dollar', logo: '/logos/currencies/cad.svg', type: 'fiat' },
    { code: 'CHF', name: 'Swiss Franc', logo: '/logos/currencies/chf.svg', type: 'fiat' },
    { code: 'AUD', name: 'Australian Dollar', logo: '/logos/currencies/aud.svg', type: 'fiat' },
    { code: 'CNY', name: 'Chinese Yuan', logo: '/logos/cn.svg', type: 'fiat' },
    { code: 'INR', name: 'Indian Rupee', logo: '/logos/in.svg', type: 'fiat' },
    { code: 'BRL', name: 'Brazilian Real', logo: '/logos/br.svg', type: 'fiat' },
    { code: 'MXN', name: 'Mexican Peso', logo: '/logos/mx.svg', type: 'fiat' },
    { code: 'KRW', name: 'South Korean Won', logo: '/logos/kr.svg', type: 'fiat' },
    { code: 'SGD', name: 'Singapore Dollar', logo: '/logos/sg.svg', type: 'fiat' },
  ]
}

export function getFiatCurrencies(): CurrencyIcon[] {
  return currencyIcons.filter(currency => currency.type === 'fiat')
}