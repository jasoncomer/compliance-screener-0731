const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/features/flowtrace/components/NodeTxPicker.tsx', 'utf8');

// Fix the specific issues
// 1. Remove unused sourceNode parameter
content = content.replace(
  'const NodeTxPicker: React.FC<Props> = ({ open, address, onOpenChange, onAdd, nodeLabel, existingConnections = [], sourceNode = null }) => {',
  'const NodeTxPicker: React.FC<Props> = ({ open, address, onOpenChange, onAdd, nodeLabel, existingConnections = [] }) => {'
);

// 2. Fix the misplaced 'in' check in 'out' section
content = content.replace(
  '              // Add connection matching logic for incoming transactions\n              if (transactionDirection === \'in\') {',
  '              // Add connection matching logic for outgoing transactions\n              if (transactionDirection === \'out\') {'
);

// 3. Fix the inputAddress reference in 'out' section
content = content.replace(
  '                  sourceAddress: inputAddress,\n                  destinationAddress: address,',
  '                  sourceAddress: address,\n                  destinationAddress: outputAddress,'
);

// Write the file back
fs.writeFileSync('src/features/flowtrace/components/NodeTxPicker.tsx', content);

console.log('Fixed TypeScript errors in NodeTxPicker.tsx');