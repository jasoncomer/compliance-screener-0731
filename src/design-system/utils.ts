/**
 * Design System Utility Functions
 * Helper functions for consistent UI implementation
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ICON_SIZES, SPACING_STANDARDS, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from './constants'

/**
 * Merge class names with Tailwind CSS conflict resolution
 * This is the standard cn function used throughout the app
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get standardized icon size class
 * @param size - Size key from ICON_SIZES
 * @returns Tailwind classes for icon sizing
 */
export function getIconSize(size: keyof typeof ICON_SIZES = 'md') {
  return ICON_SIZES[size]
}

/**
 * Get standardized spacing class
 * @param type - Component type (card, modal, button, section)
 * @param variant - Size variant (default, compact, spacious)
 * @returns Tailwind padding classes
 */
export function getSpacing(
  type: keyof typeof SPACING_STANDARDS,
  variant?: string
) {
  const spacingConfig = SPACING_STANDARDS[type]
  if (typeof spacingConfig === 'string') {
    return spacingConfig
  }
  // Type guard to check if spacingConfig has a default property
  if ('default' in spacingConfig) {
    return spacingConfig[variant as keyof typeof spacingConfig] || spacingConfig.default
  }
  // For objects without default, return the first available key
  return spacingConfig[variant as keyof typeof spacingConfig] || Object.values(spacingConfig)[0]
}

/**
 * Get standardized typography class
 * @param type - Typography type (h1, h2, body, etc.)
 * @param variant - Size variant for body text
 * @returns Tailwind typography classes
 */
export function getTypography(
  type: keyof typeof TYPOGRAPHY,
  variant?: string
) {
  const typographyConfig = TYPOGRAPHY[type]
  if (typeof typographyConfig === 'string') {
    return typographyConfig
  }
  return typographyConfig[variant as keyof typeof typographyConfig] || typographyConfig.base
}

/**
 * Get standardized border radius class
 * @param size - Border radius size
 * @returns Tailwind border radius class
 */
export function getBorderRadius(size: keyof typeof BORDER_RADIUS = 'DEFAULT') {
  return BORDER_RADIUS[size]
}

/**
 * Get standardized shadow class
 * @param size - Shadow size
 * @param hover - Include hover effect
 * @returns Tailwind shadow classes
 */
export function getShadow(
  size: keyof typeof SHADOWS = 'DEFAULT',
  hover?: boolean
) {
  const shadow = SHADOWS[size]
  if (hover && SHADOWS.hover[size as keyof typeof SHADOWS.hover]) {
    return cn(shadow, SHADOWS.hover[size as keyof typeof SHADOWS.hover])
  }
  return shadow
}

/**
 * Build consistent card classes
 * @param variant - Card variant (default, compact, spacious)
 * @param className - Additional classes
 * @returns Combined card classes
 */
export function getCardClasses(
  variant: 'default' | 'compact' | 'spacious' = 'default',
  className?: string
) {
  return cn(
    getBorderRadius('lg'),
    'border bg-card text-card-foreground',
    getShadow('sm', true),
    getSpacing('card', variant),
    className
  )
}

/**
 * Build consistent button classes based on size
 * @param size - Button size (sm, md, lg)
 * @returns Button spacing classes
 */
export function getButtonSpacing(size: 'sm' | 'md' | 'lg' = 'md') {
  return getSpacing('button', size)
}

/**
 * Build consistent section classes
 * @param variant - Section variant
 * @returns Section classes
 */
export function getSectionClasses(
  variant: 'default' | 'compact' | 'spacious' = 'default',
  className?: string
) {
  return cn(
    getSpacing('section', variant),
    className
  )
}

/**
 * Format color value for CSS custom properties
 * @param color - Hex color value
 * @returns HSL values for CSS custom property
 */
export function hexToHSL(hex: string): string {
  // Remove the hash if present
  hex = hex.replace(/^#/, '')

  // Parse RGB values
  const r = parseInt(hex.substr(0, 2), 16) / 255
  const g = parseInt(hex.substr(2, 2), 16) / 255
  const b = parseInt(hex.substr(4, 2), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

/**
 * Check if we're in dark mode
 * @returns Boolean indicating dark mode status
 */
export function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark')
}

/**
 * Get appropriate color based on theme
 * @param lightColor - Color for light theme
 * @param darkColor - Color for dark theme
 * @returns Appropriate color based on current theme
 */
export function getThemeColor(lightColor: string, darkColor: string): string {
  return isDarkMode() ? darkColor : lightColor
}