const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/features/flowtrace/components/NodeTxPicker.tsx', 'utf8');

// Fix the remaining issues
// 1. Fix the 'out' check in 'in' section (line 644)
content = content.replace(
  '              // Add connection matching logic for outgoing transactions\n              if (transactionDirection === \'out\') {',
  '              // Add connection matching logic for incoming transactions\n              if (transactionDirection === \'in\') {'
);

// 2. Fix the outputAddress reference in 'in' section
content = content.replace(
  '                  sourceAddress: address,\n                  destinationAddress: outputAddress,',
  '                  sourceAddress: inputAddress,\n                  destinationAddress: address,'
);

// 3. Fix the 'in' check in 'out' section (line 705)
content = content.replace(
  '              } else if (transactionDirection === \'out\') {',
  '              } else if (transactionDirection === \'in\') {'
);

// 4. Fix the 'in' check in 'out' section (line 841)
content = content.replace(
  '              if (transactionDirection === \'in\') {',
  '              if (transactionDirection === \'out\') {'
);

// 5. Fix the inputAddress reference in 'out' section
content = content.replace(
  '                  sourceAddress: inputAddress,\n                  destinationAddress: address,',
  '                  sourceAddress: address,\n                  destinationAddress: outputAddress,'
);

// Write the file back
fs.writeFileSync('src/features/flowtrace/components/NodeTxPicker.tsx', content);

console.log('Fixed remaining errors in NodeTxPicker.tsx');