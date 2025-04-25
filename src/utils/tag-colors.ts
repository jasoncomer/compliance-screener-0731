import { PresetColorType } from 'antd/es/_util/colors';

/**
 * Determines the color of a tag based on its content
 * @param tag The tag text to analyze
 * @returns An Ant Design preset color or custom color string
 */
export const getTagColor = (tag: string): PresetColorType | string => {
  const lowerTag = tag.toLowerCase();

  // Risk and status related
  if (lowerTag.includes('high risk') || lowerTag.includes('critical')) return 'red';
  if (lowerTag.includes('medium risk') || lowerTag.includes('warning')) return 'orange';
  if (lowerTag.includes('low risk') || lowerTag.includes('safe')) return 'green';
  
  // Entity type related
  if (lowerTag.includes('exchange')) return 'blue';
  if (lowerTag.includes('defi') || lowerTag.includes('dex')) return 'geekblue';
  if (lowerTag.includes('wallet')) return 'cyan';
  if (lowerTag.includes('mixer') || lowerTag.includes('gambling') || lowerTag.includes('human trafficking')) return 'volcano';
  
  // Social media related
  if (lowerTag.includes('twitter')) return 'cyan';
  if (lowerTag.includes('telegram')) return 'purple';
  if (lowerTag.includes('discord')) return 'magenta';
  
  // Location/Jurisdiction related
  if (lowerTag.includes('country') || lowerTag.match(/[a-z]{2,3}$/)) return 'yellow';
  
  // Compliance related
  if (lowerTag.includes('kyc') || lowerTag.includes('aml')) return 'green';
  if (lowerTag.includes('sanctioned') || lowerTag.includes('ofac')) return 'red';
  
  // Default color for other tags
  return 'blue';
}; 