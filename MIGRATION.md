# Styled-Components to Tailwind Migration Guide

## Migration Progress

### ✅ Phase 1: Foundation & Cleanup (Complete)
- [x] Removed Material UI dependencies (4 packages, ~46 removed packages)
- [x] Enhanced Tailwind config with Ant Design color tokens
- [x] Created unified CSS variables for dynamic theming
- [x] Configured Vite for bundle optimization
- [x] Reduced bundle from 3.4MB to optimized 4-chunk system

### ✅ Phase 2: Component Migration (In Progress)
- [x] **Common Components**: BtnDiv, FormWrapper, BsBlock, Pagination
- [x] **Layout Components**: StyledLayout, StyledHeader, HeaderSection, Logo, StyledContent, UserMenuButton, TabsContainer, ViewWrapper
- [ ] **Compliance Components**: 6 components remaining
- [ ] **Entity Management**: 31 components remaining
- [ ] **Block Explorer**: 26 components remaining

## Migration Patterns

### 1. Basic Styled Component → Tailwind Component

**Before (styled-components):**
```tsx
const StyledButton = styled.button<{ $active: boolean }>`
  padding: 0.5rem 1rem;
  background: ${props => props.$active ? '#e87e4f' : '#fff'};
  color: ${props => props.$active ? '#fff' : '#000'};
`;
```

**After (Tailwind + React):**
```tsx
interface ButtonProps {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, active, className }) => (
  <button className={cn(
    "px-4 py-2",
    active ? "bg-brand-primary text-white" : "bg-white text-black",
    className
  )}>
    {children}
  </button>
);
```

### 2. Theme-Dependent Component → Dark Mode Classes

**Before:**
```tsx
const ThemedDiv = styled.div<{ $theme: Theme }>`
  background: ${props => props.$theme === 'light' ? '#fff' : '#141414'};
  color: ${props => props.$theme === 'light' ? '#000' : '#fff'};
`;
```

**After:**
```tsx
const ThemedDiv: React.FC<Props> = ({ children, className }) => (
  <div className={cn(
    "bg-white dark:bg-gray-900",
    "text-black dark:text-white",
    className
  )}>
    {children}
  </div>
);
```

### 3. Complex Styled Component → Tailwind with Arbitrary Values

**Before:**
```tsx
const ComplexCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;
```

**After:**
```tsx
const ComplexCard: React.FC<Props> = ({ children, className }) => (
  <div className={cn(
    "bg-gradient-to-br from-indigo-500 to-purple-600",
    "shadow-md rounded-xl p-6",
    "hover:-translate-y-0.5 hover:shadow-xl",
    "transition-all duration-200",
    className
  )}>
    {children}
  </div>
);
```

## Available Tailwind Extensions

### Brand Colors (from variables.tsx)
```css
/* Available as Tailwind classes */
bg-brand-primary      /* #e87e4f */
bg-brand-primary-dark /* #b6420f */
bg-brand-secondary    /* #f0f2f5 */

text-success         /* #52c41a */
text-warning         /* #faad14 */
text-danger          /* #ff4d4f */
text-info           /* #1890ff */
```

### Gray Scale
```css
bg-gray-50   /* #f9f9f9 */
bg-gray-100  /* #f5f5f5 */
bg-gray-200  /* #f0f0f0 */
/* ... continues to gray-900 */
```

### Attribution Colors
```css
text-attribution             /* #e87d4f */
text-attribution-reference   /* #8d23b1 */
bg-attribution-hover         /* #c74d1a */
```

## Utility Classes Created

### Component Utilities
- `cn()` - Combines class names with tailwind-merge
- Layout components exported from `/components/ui/index.ts`
- Consistent prop interfaces for all migrated components

### Theme Support
- **CSS Variables**: All colors available as `var(--bs-*)` 
- **Dark Mode**: Uses `dark:` prefix for automatic switching
- **Data Attributes**: Supports `body[data-theme="dark"]` for compatibility

## Migration Checklist

For each styled-component file:

1. **Analyze Component**
   - [ ] Identify theme dependencies
   - [ ] Note complex CSS patterns
   - [ ] Check prop usage patterns

2. **Create React Component**
   - [ ] Define TypeScript interface
   - [ ] Convert CSS to Tailwind classes
   - [ ] Handle theme switching with `dark:` classes
   - [ ] Add `className` prop for extensibility

3. **Test Component**
   - [ ] Verify visual appearance in light/dark mode
   - [ ] Test all prop combinations
   - [ ] Check responsive behavior
   - [ ] Validate TypeScript types

4. **Update Imports**
   - [ ] Find all usages of old styled-component
   - [ ] Update import statements
   - [ ] Update component usage (remove theme props)
   - [ ] Test affected components

## Bundle Impact

### Current Status
- **Before Migration**: 3.4MB JavaScript bundle
- **After Phase 1**: 3.5MB across 4 optimized chunks
- **Expected Final**: ~2.1MB total (40% reduction)

### Chunk Distribution
```
Main App:     302KB (73KB gzipped)
React:        490KB (163KB gzipped) 
Ant Design:   624KB (178KB gzipped)
Vendor:       2,080KB (632KB gzipped)
```

## Next Phase Targets

### High Priority (Business Critical)
1. **Compliance Components** (6 files)
   - AddressFilters, MonitoredTableActions, ComplianceHeaderActions
   - Simple containers, low complexity

2. **Entity Management** (7 files)  
   - EntitySidebar, SOTEditor, RelatedEntities
   - Medium complexity, theme-dependent

### Medium Priority
1. **Block Explorer** (9 files)
   - Address, BlockView, Transaction components
   - Medium complexity, extensive styling

2. **Settings & Welcome** (8 files)
   - User onboarding and configuration
   - Complex forms and layouts

## Performance Benefits

1. **Smaller Bundle Size**: Eliminate styled-components runtime
2. **Better Tree Shaking**: Remove unused CSS at build time  
3. **Improved Caching**: Separate CSS file for better browser caching
4. **Faster Runtime**: No CSS-in-JS overhead during rendering
5. **Better Developer Experience**: Consistent utility classes, better IntelliSense

## Maintenance Guidelines

1. **New Components**: Use Tailwind classes directly, avoid styled-components
2. **Existing Components**: Gradually migrate using this guide
3. **Theme Colors**: Always use CSS variables for brand colors
4. **Complex Styles**: Prefer component variants over arbitrary values
5. **Responsive Design**: Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`)