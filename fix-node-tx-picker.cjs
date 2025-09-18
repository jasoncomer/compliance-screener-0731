const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/features/flowtrace/components/NodeTxPicker.tsx', 'utf8');

// Fix the issues systematically
// 1. Fix the 'in' section (around line 644) - should check for 'in' and use inputAddress
content = content.replace(
  /\/\/ Add connection matching logic for incoming transactions\n\s+if \(transactionDirection === 'out'\) \{/g,
  '// Add connection matching logic for incoming transactions\n              if (transactionDirection === \'in\') {'
);

// 2. Fix the 'out' section (around line 841) - should check for 'out' and use outputAddress
content = content.replace(
  /\/\/ Add connection matching logic for incoming transactions\n\s+if \(transactionDirection === 'in'\) \{/g,
  '// Add connection matching logic for outgoing transactions\n              if (transactionDirection === \'out\') {'
);

// 3. Fix the sourceAddress/destinationAddress in the 'in' section
content = content.replace(
  /sourceAddress: address,\n\s+destinationAddress: outputAddress,/g,
  'sourceAddress: inputAddress,\n                  destinationAddress: address,'
);

// 4. Fix the sourceAddress/destinationAddress in the 'out' section
content = content.replace(
  /sourceAddress: inputAddress,\n\s+destinationAddress: address,/g,
  'sourceAddress: address,\n                  destinationAddress: outputAddress,'
);

// Write the file back
fs.writeFileSync('src/features/flowtrace/components/NodeTxPicker.tsx', content);

console.log('Fixed NodeTxPicker.tsx transaction direction logic');