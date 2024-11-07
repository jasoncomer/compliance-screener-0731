export const truncateStringMiddle = (str: string, maxLength: number) => {
  if (str.length <= maxLength) {
    return str;
  }

  const start = str.slice(0, maxLength / 2 - 1);
  const end = str.slice(-maxLength / 2 + 1);

  return `${start}...${end}`;
}