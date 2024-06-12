export const satsToBTC = (sats: number) => sats / 100000000;

export const truncateAddress = (address: string) => {
  const digits = 4;
  return `${address.slice(0, digits)}...${address.slice(-digits)}`;
};