# D3.js Sankey Diagram Components

This directory contains React + TypeScript components for rendering Sankey diagrams using D3.js and d3-sankey.

## Components

### 1. `D3SankeyDiagram`
A basic D3.js Sankey diagram component with essential features.

**Features:**
- Pure D3.js implementation
- TypeScript support
- Interactive tooltips
- Color-coded nodes and links
- Theme support (dark/light)

**Props:**
```typescript
interface D3SankeyDiagramProps {
  incomingData: FundsDataPoint[]
  outgoingData: FundsDataPoint[]
  title?: string
  width?: number
  height?: number
}
```

### 2. `EnhancedD3SankeyDiagram`
An enhanced version with additional interactive features.

**Additional Features:**
- Responsive design
- Zoom and pan capabilities
- Better TypeScript types
- Improved tooltips
- Resize handling

**Props:**
```typescript
interface EnhancedD3SankeyDiagramProps {
  incomingData: FundsDataPoint[]
  outgoingData: FundsDataPoint[]
  title?: string
  width?: number
  height?: number
  enableZoom?: boolean
  enablePan?: boolean
}
```

### 3. `SankeyExample`
A demonstration component showing how to use both Sankey diagram components with sample data.

### 4. `CombinedFundsFlow`
The original Recharts-based implementation (for comparison).

## Data Structure

```typescript
interface FundsDataPoint {
  name: string
  value: number
  entityType: string
}
```

## Usage Example

```tsx
import { EnhancedD3SankeyDiagram } from './components'

const incomingData = [
  { name: "Exchange A", value: 50000, entityType: "Exchange" },
  { name: "Mining Pool", value: 15000, entityType: "Mining" },
]

const outgoingData = [
  { name: "Exchange B", value: 40000, entityType: "Exchange" },
  { name: "DeFi Protocol", value: 25000, entityType: "DeFi" },
]

function MyComponent() {
  return (
    <EnhancedD3SankeyDiagram
      incomingData={incomingData}
      outgoingData={outgoingData}
      title="Funds Flow Analysis"
      width={1000}
      height={600}
      enableZoom={true}
      enablePan={true}
    />
  )
}
```

## Dependencies

The components require the following dependencies (already included in the project):
- `d3: ^7.9.0`
- `d3-sankey: ^0.12.3`
- `@types/d3: ^7.4.3`
- `@types/d3-sankey: ^0.12.4`

## Features

### Color Coding
- Nodes and links are colored based on entity types and risk scores
- Risk scores are calculated using the `riskScores` mapping from `../../../lib/risk-scores`
- Colors transition from red (high risk) to green (low risk)

### Interactive Elements
- Hover tooltips showing transaction details and risk scores
- Zoom and pan capabilities (enhanced version)
- Responsive design that adapts to container size

### Theme Support
- Automatically adapts to dark/light theme
- Tooltips and text colors adjust based on theme
- Background colors and borders follow theme

### Legend
- Shows all entity types with emojis
- Color indicators for each entity type
- Wallet node color reflects average risk score

## Migration from Recharts

If you're migrating from the Recharts-based `CombinedFundsFlow` component:

1. Replace the import:
   ```tsx
   // Old
   import { CombinedFundsFlow } from './CombinedFundsFlow'
   
   // New
   import { EnhancedD3SankeyDiagram } from './EnhancedD3SankeyDiagram'
   ```

2. Update the component usage:
   ```tsx
   // Old
   <CombinedFundsFlow
     incomingData={incomingData}
     outgoingData={outgoingData}
     title="Funds Flow Analysis"
   />
   
   // New
   <EnhancedD3SankeyDiagram
     incomingData={incomingData}
     outgoingData={outgoingData}
     title="Funds Flow Analysis"
     width={1000}
     height={600}
     enableZoom={true}
     enablePan={true}
   />
   ```

The data structure remains the same, so no changes to your data preparation logic are needed. 