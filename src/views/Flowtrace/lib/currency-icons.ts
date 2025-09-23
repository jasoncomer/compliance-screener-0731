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
  { code: 'BTC', name: 'Bitcoin', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png', type: 'crypto' },
  { code: 'ETH', name: 'Ethereum', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png', type: 'crypto' },
  { code: 'USDC', name: 'USD Coin', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png', type: 'crypto' },
  { code: 'USDT', name: 'Tether', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png', type: 'crypto' },
  { code: 'DAI', name: 'Dai', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4943.png', type: 'crypto' },
  { code: 'MATIC', name: 'Polygon', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png', type: 'crypto' },
  { code: 'AVAX', name: 'Avalanche', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5805.png', type: 'crypto' },
  { code: 'BNB', name: 'BNB', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png', type: 'crypto' },
  { code: 'SOL', name: 'Solana', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png', type: 'crypto' },
  { code: 'ADA', name: 'Cardano', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2010.png', type: 'crypto' },
  { code: 'LTC', name: 'Litecoin', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/2.png', type: 'crypto' },
  { code: 'XRP', name: 'XRP', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/52.png', type: 'crypto' },
  { code: 'DOGE', name: 'Dogecoin', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/74.png', type: 'crypto' },

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
  return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png'
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