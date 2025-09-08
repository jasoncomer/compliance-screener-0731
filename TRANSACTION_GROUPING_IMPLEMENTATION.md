# Transaction Grouping Implementation

## Overview

This implementation provides **Option 1: Alternating Row Colors by Transaction** for grouping rows with the same TXID in compliance tables. Rows sharing the same transaction ID are visually grouped using consistent, subtle background colors.

## Files Created/Modified

### New Files:
1. **`src/utils/transactionGrouping.ts`** - Utility functions for transaction grouping
2. **`src/styles/transactionGrouping.css`** - CSS styles for visual grouping
3. **`src/components/demo/TransactionGroupingDemo.tsx`** - Demo component showcasing the feature
4. **`src/utils/__tests__/transactionGrouping.test.ts`** - Unit tests for the utilities

### Modified Files:
1. **`src/views/Compliance/components/unassigned-transactions/UnassignedTransactionsTable.tsx`**
2. **`src/views/Compliance/components/active-cases/ActiveCasesTable.tsx`**

## How It Works

### 1. Color Index Generation
- Each transaction ID (TXID) is hashed to generate a consistent color index (0-3)
- The same TXID always produces the same color index
- Uses a simple hash function for consistent results

### 2. CSS Classes
- Four subtle background colors: `tx-group-0` through `tx-group-3`
- Each color has light and dark theme variants
- Hover effects highlight related rows
- Compatible with Ant Design table selection states

### 3. Table Integration
- Added `rowClassName` prop to Ant Design Table components
- Uses `getTransactionGroupClassWithHover()` function
- Maintains existing functionality (selection, pagination, etc.)

## Visual Design

### Color Palette:
- **Group 0**: White (`#ffffff`) / Dark (`#1a1a1a`)
- **Group 1**: Light Gray (`#f8f9fa`) / Dark Gray (`#2d2d2d`)
- **Group 2**: Medium Gray (`#f1f3f4`) / Darker Gray (`#3a3a3a`)
- **Group 3**: Darker Gray (`#e8eaed`) / Darkest Gray (`#474747`)

### Hover Effects:
- Light theme: Light blue (`#e3f2fd`)
- Dark theme: Dark blue (`#1e3a5f`)

## Usage

### In Table Components:
```tsx
import { getTransactionGroupClassWithHover } from '../../../../utils/transactionGrouping';
import '../../../../styles/transactionGrouping.css';

// In your Table component:
<Table
  // ... other props
  rowClassName={(record) => getTransactionGroupClassWithHover(record.txId)}
/>
```

### Utility Functions:
```tsx
import { 
  getTransactionColorIndex, 
  getTransactionGroupClass, 
  getTransactionGroupClassWithHover 
} from '../utils/transactionGrouping';

// Get color index for a transaction
const colorIndex = getTransactionColorIndex('abc123'); // Returns 0-3

// Get CSS class name
const className = getTransactionGroupClass('abc123'); // Returns 'tx-group-0'

// Get CSS class with hover effects
const classNameWithHover = getTransactionGroupClassWithHover('abc123'); // Returns 'tx-group-0 tx-group-hover'
```

## Benefits

1. **Visual Clarity**: Easy to identify related transactions at a glance
2. **Subtle Design**: Professional appearance that doesn't interfere with data readability
3. **Consistent**: Same TXID always gets the same color
4. **Accessible**: Works in both light and dark themes
5. **Interactive**: Hover effects provide additional visual feedback
6. **Compatible**: Works with existing table features (selection, sorting, pagination)

## Testing

The implementation includes:
- Unit tests for utility functions
- Demo component with sample data
- Manual testing with real compliance data

## Future Enhancements

Potential improvements could include:
- More color variations (currently 4)
- Customizable color schemes
- Animation effects for better visual feedback
- Group headers or separators
- Export functionality that preserves grouping

## Browser Support

- Modern browsers with CSS Grid and Flexbox support
- Ant Design v5+ compatibility
- Responsive design for mobile devices