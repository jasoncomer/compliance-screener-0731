# Blockscout App Design System

## Overview

This document outlines the design system for the Blockscout App, providing guidelines for consistent UI implementation across the application.

## 🎨 Core Principles

1. **Consistency** - Use standardized tokens and patterns
2. **Accessibility** - Ensure proper contrast and keyboard navigation
3. **Performance** - Leverage Tailwind utilities over custom CSS
4. **Maintainability** - Single source of truth for design values

## 📁 File Structure

```
src/
├── design-system/
│   ├── tokens.ts        # Core design tokens (colors, spacing, typography)
│   ├── constants.ts     # UI constants and standards
│   └── utils.ts         # Helper functions
├── components/ui/       # Reusable UI components
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   └── ...
└── index.css           # Global styles and CSS variables
```

## 🎨 Color System

### Brand Colors

- **Primary**: `#e87e4f` - Blockscout Orange
- **Primary Dark**: `#b6420f` - Darker orange for hover states
- **Secondary**: `#f0f2f5` - Light gray background

### Semantic Colors

```typescript
// Success
success: '#52c41a'
successDark: '#327a0e'

// Warning
warning: '#faad14'
warningDark: '#d48806'

// Danger
danger: '#ff4d4f'
dangerDark: '#d43838'

// Info
info: '#1890ff'
infoDark: '#1352ff'
```

### Gray Scale

A comprehensive gray scale from `gray-50` to `gray-950` for text, borders, and backgrounds.

## 📏 Spacing System

Based on a 4px grid for consistent spacing:

```typescript
// Common spacing values
spacing: {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',   // Default for most components
  6: '24px',   // Card padding
  8: '32px',   // Section spacing
}
```

### Component Spacing Standards

```typescript
// Card padding
card.default: 'p-6'     // 24px
card.compact: 'p-4'     // 16px

// Button padding
button.sm: 'px-3 py-1.5'
button.md: 'px-4 py-2'
button.lg: 'px-6 py-3'

// Section padding
section.default: 'py-8 px-6'
```

## 🔤 Typography

### Font Stack

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', ...
```

### Type Scale

```typescript
// Headings
h1: 'text-4xl font-semibold'
h2: 'text-3xl font-semibold'
h3: 'text-2xl font-semibold'

// Body
body.base: 'text-base'  // 16px
body.sm: 'text-sm'      // 14px
body.xs: 'text-xs'      // 12px
```

## 🎯 Icon Sizes

Standardized icon sizes for consistency:

```typescript
xs: 'h-3 w-3'   // 12px - badges
sm: 'h-4 w-4'   // 16px - inline icons
md: 'h-5 w-5'   // 20px - buttons (DEFAULT)
lg: 'h-6 w-6'   // 24px - headers
xl: 'h-8 w-8'   // 32px - features
```

## 🌓 Dark Mode

Dark mode is implemented using:
1. Tailwind's `dark:` modifier
2. CSS variables that switch based on theme
3. The `dark` class on `<html>` element

### Implementation Example

```tsx
// Component with dark mode support
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Content
</div>
```

### CSS Variables

Light and dark themes use CSS variables that automatically switch:

```css
/* Light theme */
--background: 0 0% 100%;
--foreground: 220 9% 11%;

/* Dark theme */
.dark {
  --background: 220 15% 10%;
  --foreground: 0 0% 98%;
}
```

## 🧩 Components

### Input Component

Enhanced input with variants and dark mode support:

```tsx
import { Input } from '@/components/ui/input'

// Basic usage
<Input placeholder="Enter text..." />

// With size variant
<Input size="lg" placeholder="Large input" />

// With form field wrapper
<FormField
  label="Email"
  error="Invalid email"
  required
>
  <Input type="email" />
</FormField>
```

### Button Component

```tsx
import { Button } from '@/components/ui/button'

// Variants
<Button variant="default">Primary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

### Card Component

```tsx
import { Card, CardHeader, CardContent } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>
```

## 🛠 Utility Functions

### cn() - Class Name Merger

```tsx
import { cn } from '@/lib/utils'

// Merge classes with conflict resolution
className={cn(
  "base-classes",
  condition && "conditional-classes",
  className // User provided classes
)}
```

### Design System Utils

```tsx
import {
  getIconSize,
  getSpacing,
  getCardClasses
} from '@/design-system/utils'

// Get standardized icon size
<Icon className={getIconSize('md')} />

// Get card classes with variant
<div className={getCardClasses('compact')}>
```

## 📋 Migration Guide

### From Ant Design

```tsx
// Before (Ant Design)
import { Input, Button } from 'antd'
<Input placeholder="..." />
<Button type="primary">Click</Button>

// After (Native/Shadcn)
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
<Input placeholder="..." />
<Button variant="default">Click</Button>
```

### Dark Mode Inputs

```tsx
// Before (with forced CSS)
<input className="force-dark-mode" />

// After (with Tailwind)
<Input className="dark:bg-gray-800 dark:text-white" />
// Or just use the Input component which handles it
<Input />
```

## ✅ Best Practices

1. **Use design tokens** - Import from `design-system/tokens.ts`
2. **Use utility functions** - For consistent spacing, sizing, etc.
3. **Use Tailwind utilities** - Avoid custom CSS where possible
4. **Follow naming conventions** - PascalCase for components, camelCase for utilities
5. **Test dark mode** - Always verify components in both themes
6. **Maintain consistency** - Use standard spacing and sizing

## 🚫 Anti-patterns to Avoid

1. ❌ Using `!important` in CSS
2. ❌ Hardcoding colors instead of using tokens
3. ❌ Creating custom CSS for existing utilities
4. ❌ Mixing spacing systems (use 4px grid)
5. ❌ Using Ant Design components in new code

## 📚 Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn/UI Components](https://ui.shadcn.com)
- [Design Tokens](./src/design-system/tokens.ts)
- [Constants](./src/design-system/constants.ts)