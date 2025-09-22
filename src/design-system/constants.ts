/**
 * Design System Constants
 * Standardized values for consistent UI implementation
 */

// ============================================================================
// Spacing Standards
// ============================================================================

/**
 * Standard padding values for different component types
 * Based on 4px grid system
 */
export const SPACING_STANDARDS = {
  // Component padding
  card: {
    default: 'p-6',     // 24px
    compact: 'p-4',     // 16px
    spacious: 'p-8',    // 32px
  },
  modal: {
    header: 'px-6 py-4', // 24px horizontal, 16px vertical
    body: 'p-6',         // 24px
    footer: 'px-6 py-4', // 24px horizontal, 16px vertical
  },
  button: {
    sm: 'px-3 py-1.5',   // 12px horizontal, 6px vertical
    md: 'px-4 py-2',     // 16px horizontal, 8px vertical
    lg: 'px-6 py-3',     // 24px horizontal, 12px vertical
  },
  section: {
    default: 'py-8 px-6', // 32px vertical, 24px horizontal
    compact: 'py-4 px-4', // 16px
    spacious: 'py-12 px-8', // 48px vertical, 32px horizontal
  },

  // Gaps between elements
  gap: {
    xs: 'gap-1',  // 4px
    sm: 'gap-2',  // 8px
    md: 'gap-4',  // 16px - DEFAULT
    lg: 'gap-6',  // 24px
    xl: 'gap-8',  // 32px
  },

  // Margins
  margin: {
    section: 'mb-8',     // 32px bottom margin for sections
    heading: 'mb-4',     // 16px bottom margin for headings
    paragraph: 'mb-4',   // 16px bottom margin for paragraphs
    element: 'mb-2',     // 8px bottom margin for elements
  },
} as const

// ============================================================================
// Icon Size Standards
// ============================================================================

/**
 * Standardized icon sizes for consistency across the app
 * Using Lucide React icon sizing classes
 */
export const ICON_SIZES = {
  xs: 'h-3 w-3',   // 12px - badges, tiny inline icons
  sm: 'h-4 w-4',   // 16px - default inline icons
  md: 'h-5 w-5',   // 20px - button icons, nav icons - DEFAULT
  lg: 'h-6 w-6',   // 24px - header icons, card icons
  xl: 'h-8 w-8',   // 32px - feature icons
  '2xl': 'h-12 w-12', // 48px - hero icons, empty states
} as const

// ============================================================================
// Typography Standards
// ============================================================================

export const TYPOGRAPHY = {
  // Headings
  h1: 'text-4xl font-semibold tracking-tight',
  h2: 'text-3xl font-semibold tracking-tight',
  h3: 'text-2xl font-semibold tracking-tight',
  h4: 'text-xl font-semibold',
  h5: 'text-lg font-semibold',
  h6: 'text-base font-semibold',

  // Body text
  body: {
    lg: 'text-lg leading-relaxed',
    base: 'text-base leading-normal',
    sm: 'text-sm leading-normal',
    xs: 'text-xs leading-normal',
  },

  // Special text
  lead: 'text-xl text-muted-foreground',
  muted: 'text-sm text-muted-foreground',
  small: 'text-sm font-medium leading-none',
  large: 'text-lg font-semibold',
} as const

// ============================================================================
// Border Radius Standards
// ============================================================================

export const BORDER_RADIUS = {
  none: 'rounded-none',
  sm: 'rounded-sm',      // 4px
  DEFAULT: 'rounded',     // 6px
  md: 'rounded-md',      // 8px
  lg: 'rounded-lg',      // 12px
  xl: 'rounded-xl',      // 16px
  '2xl': 'rounded-2xl',  // 24px
  '3xl': 'rounded-3xl',  // 32px
  full: 'rounded-full',  // 9999px
} as const

// ============================================================================
// Shadow Standards
// ============================================================================

export const SHADOWS = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  DEFAULT: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  inner: 'shadow-inner',

  // Hover effects
  hover: {
    sm: 'hover:shadow-md',
    md: 'hover:shadow-lg',
    lg: 'hover:shadow-xl',
  },
} as const

// ============================================================================
// Animation Standards
// ============================================================================

export const ANIMATIONS = {
  // Transition durations
  duration: {
    fast: 'duration-150',
    base: 'duration-200',
    slow: 'duration-300',
    slower: 'duration-500',
  },

  // Common transitions
  all: 'transition-all',
  colors: 'transition-colors',
  opacity: 'transition-opacity',
  shadow: 'transition-shadow',
  transform: 'transition-transform',

  // Hover scales
  scale: {
    sm: 'hover:scale-105',
    md: 'hover:scale-110',
    lg: 'hover:scale-125',
  },
} as const

// ============================================================================
// Z-Index Standards
// ============================================================================

export const Z_INDEX = {
  base: 'z-0',
  dropdown: 'z-10',
  sticky: 'z-20',
  fixed: 'z-30',
  modalBackdrop: 'z-40',
  modal: 'z-50',
  popover: 'z-[60]',
  tooltip: 'z-[70]',
  notification: 'z-[80]',
  commandPalette: 'z-[90]',
  max: 'z-[100]',
} as const

// ============================================================================
// Component Height Standards
// ============================================================================

export const HEIGHTS = {
  input: {
    sm: 'h-8',
    md: 'h-10',  // DEFAULT
    lg: 'h-12',
  },
  button: {
    sm: 'h-8',
    md: 'h-10',  // DEFAULT
    lg: 'h-12',
  },
  navbar: 'h-16',
  toolbar: 'h-12',
  table: {
    header: 'h-12',
    row: 'h-14',
  },
} as const

// ============================================================================
// Width Standards
// ============================================================================

export const WIDTHS = {
  sidebar: {
    collapsed: 'w-14',
    expanded: 'w-60',
  },
  modal: {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
    full: 'max-w-full',
  },
  container: {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
  },
} as const

// ============================================================================
// Grid Standards
// ============================================================================

export const GRID = {
  cols: {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    6: 'grid-cols-6',
    12: 'grid-cols-12',
  },
  gap: {
    sm: 'gap-2',  // 8px
    md: 'gap-4',  // 16px - DEFAULT
    lg: 'gap-6',  // 24px
    xl: 'gap-8',  // 32px
  },
} as const