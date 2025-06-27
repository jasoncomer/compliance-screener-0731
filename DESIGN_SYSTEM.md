# Blockscout Design System

## Overview

The Blockscout app uses a multi-layered design system that combines modern design principles with blockchain-specific UI patterns. This document serves as the central reference for design tokens, components, and theming guidelines.

## Design Systems Stack

### 1. Ant Design (Primary UI Library)
- **Purpose**: Core component library for forms, tables, navigation
- **Theme**: Custom light/dark themes with Blockscout brand colors
- **Configuration**: `src/styles/theme.ts`

### 2. Shadcn/UI (Modern Components)
- **Purpose**: Accessible, customizable components built on Radix primitives
- **Styling**: Tailwind CSS with CSS custom properties
- **Components**: Dialog, Button, Card, Input, Select variants

### 3. Styled Components (Custom Styling)
- **Purpose**: CSS-in-JS for complex, dynamic styling
- **Theme Integration**: Via ThemeProvider with light/dark mode support
- **Usage**: Layout components, animations, custom designs

### 4. Tailwind CSS (Utility Framework)
- **Purpose**: Utility-first styling with extended custom colors
- **Configuration**: `tailwind.config.js`
- **Custom Classes**: Blockscout brand colors, charts, animations

## Color System

### Brand Colors
```css
/* Primary Brand */
--bs-primary: #e87e4f;           /* Blockscout Orange */
--bs-primary-dark: #b6420f;      /* Darker Orange */
--bs-secondary: #f0f2f5;         /* Light Gray */
```

### Semantic Colors
```css
/* Status Colors */
--bs-success: #52c41a;
--bs-warning: #faad14;
--bs-danger: #ff4d4f;
--bs-info: #1890ff;
```

### Neutral Palette
```css
/* Gray Scale (50-900) */
--bs-gray-50: #f9f9f9;
--bs-gray-100: #f5f5f5;
--bs-gray-200: #f0f0f0;
--bs-gray-300: #e0e0e0;
--bs-gray-400: #ccc;
--bs-gray-500: #999;
--bs-gray-600: #666;
--bs-gray-700: #4a5568;
--bs-gray-800: #1f1f1f;
--bs-gray-900: #141414;
```

### Attribution Colors (Blockchain-specific)
```css
--bs-attribution: #e87d4f;
--bs-attribution-reference: #8d23b1;
--bs-attribution-reference-hover: #cf45fe;
```

## Theme System

### Light Theme
- **Background**: White (`#ffffff`)
- **Text**: Black (`#000000`)
- **Cards**: White with subtle shadows
- **Borders**: Light gray (`#d9d9d9`)

### Dark Theme
- **Background**: Deep gray (`#141414`)
- **Text**: White (`#ffffff`)
- **Cards**: Dark gray (`#1f1f1f`)
- **Borders**: Dark gray (`#434343`)

### Theme Implementation
```typescript
// Theme Context Usage
const { theme, toggleTheme } = useTheme();

// Styled Components
const Container = styled.div<{ theme: { theme: 'light' | 'dark' } }>`
  background: ${props => props.theme.theme === 'dark' ? '#141414' : '#fff'};
`;

// Tailwind Classes
<div className={cn(
  "p-4 rounded-lg",
  theme === 'light' ? "bg-white text-black" : "bg-gray-800 text-white"
)}>
```

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
  'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
```

### Hierarchy
- **H1**: 2rem (32px), font-weight: 600
- **Body**: 14px, line-height: 1.45
- **Code**: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace

## Spacing System

### Scale (4px base)
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px

## Border Radius

### System
- **sm**: 4px
- **md**: 6px
- **lg**: 8px
- **xl**: 12px
- **2xl**: 16px

## Shadows & Elevation

### Light Theme
```css
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
```

### Dark Theme
```css
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
```

## Component Patterns

### Cards
- **Light**: White background with subtle shadow
- **Dark**: Dark gray background with darker shadow
- **Padding**: 16px-24px
- **Border Radius**: 8px

### Buttons
- **Primary**: Blockscout orange (`#e87e4f`)
- **Height**: 40px
- **Border Radius**: 6px
- **Hover**: Darker shade

### Forms
- **Focus State**: Orange border with orange shadow
- **Error State**: Red border and text
- **Disabled State**: 50% opacity

## Blockchain-Specific Components

### Transaction Hash
- **Font**: Monospace
- **Color**: Theme-aware text color
- **Truncation**: Middle truncation for long hashes

### Address Display
- **Font**: Monospace
- **Attribution Colors**: Special colors for tagged addresses
- **Hover States**: Subtle background change

### Risk Indicators
- **Colors**: Red (high), Yellow (medium), Green (low)
- **Format**: Badges with rounded corners

## Accessibility

### Color Contrast
- **Light Theme**: Minimum 4.5:1 contrast ratio
- **Dark Theme**: Minimum 4.5:1 contrast ratio
- **Focus States**: Visible focus indicators

### Keyboard Navigation
- **Tab Order**: Logical flow
- **Focus Indicators**: Orange outline matching brand
- **Skip Links**: For screen readers

## Animation & Transitions

### Durations
- **Fast**: 150ms
- **Normal**: 300ms
- **Slow**: 500ms

### Easing
- **Standard**: cubic-bezier(0.3, 0, 0.7, 1)
- **Enter**: cubic-bezier(0, 0, 0.2, 1)
- **Exit**: cubic-bezier(0.4, 0, 1, 1)

## Usage Guidelines

### Do's
✅ Use semantic color tokens instead of hardcoded colors
✅ Implement theme switching for all components
✅ Follow spacing system for consistent layout
✅ Use appropriate typography hierarchy
✅ Maintain accessibility standards

### Don'ts
❌ Mix different styling approaches within single components
❌ Hardcode colors outside of design tokens
❌ Ignore theme context in custom components
❌ Use inconsistent spacing values
❌ Skip accessibility considerations

## File Structure

```
src/
├── styles/
│   ├── theme.ts           # Ant Design theme configuration
│   ├── variables.tsx      # Color tokens and theme variables
│   ├── globals.css        # Global styles and Tailwind imports
│   └── theme-overrides.css # Ant Design component overrides
├── context/
│   └── ThemeContext.tsx   # Theme state management
├── components/ui/         # Shadcn/UI components
└── components/           # Custom components
```

## Migration Notes

### Current Issues Being Addressed
1. **Inconsistent theme prop patterns** - Standardizing to single `theme` prop
2. **Hardcoded dark mode** - Converting to dynamic theme switching
3. **Color mismatches** - Aligning all color systems
4. **Missing TypeScript types** - Adding proper theme typing

### Future Improvements
- Implement design tokens system
- Add more animation presets
- Expand accessibility features
- Create component showcase/Storybook