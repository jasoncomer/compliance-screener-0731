// import React, { useEffect, useState } from 'react';
// import { Input, Button, Select } from 'antd';
// import { GraphCanvas, GraphNode, GraphEdge, LayoutTypes } from 'reagraph';
// import ViewWrapper from '../components/ViewWrapper';
// import { FundOutlined } from '@ant-design/icons';
// import { useTheme } from '../context/ThemeContext';
// import { colors } from '../styles/variables';

// const FlowTrace: React.FC = () => {
//   const { theme } = useTheme();
//   const [blockchain, setBlockchain] = useState('Ethereum');
//   const [query, setQuery] = useState('');
//   const [nodes, setNodes] = useState<GraphNode[]>([]);
//   const [edges, setEdges] = useState<GraphEdge[]>([]);
//   const [layout, setLayout] = useState<LayoutTypes>('treeLr2d');

//   useEffect(() => {
//     setLayout('treeLr2d');
//   }, [theme]);

//   const traceFunds = () => {
//     if (!query) {
//       alert('Please enter an address or transaction ID');
//       return;
//     }
//     // Dummy fund tracing: add main node and two dummy child nodes if not already present.
//     if (!nodes.some(node => node.id === query)) {
//       const mainNode: GraphNode = { id: query, label: query + ' (' + blockchain + ')' };
//       const child1: GraphNode = { id: `${query}-child1`, label: `${query} - Intermediate 1` };
//       const child2: GraphNode = { id: `${query}-child2`, label: `${query} - Intermediate 2` };
//       setNodes([...nodes, mainNode, child1, child2]);
//       setEdges([
//         ...edges,
//         { id: `${query}-edge1`, source: query, target: child1.id, label: 'transfer' },
//         { id: `${query}-edge2`, source: query, target: child2.id, label: 'transfer' }
//       ]);
//     }
//   };

//   return (
//     <ViewWrapper title="Flow Trace" icon={<FundOutlined style={{ fontSize: '28px', color: colors.attributionHover, fontWeight: 'bold' }} />}>
//       <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center' }}>
//         <Select
//           value={blockchain}
//           onChange={(value) => setBlockchain(value)}
//           style={{ width: 200, marginRight: 10 }}
//         >
//           <Select.Option value="Bitcoin">Bitcoin</Select.Option>
//           <Select.Option value="Ethereum">Ethereum</Select.Option>
//           <Select.Option value="BNB Chain">BNB Chain</Select.Option>
//           <Select.Option value="Polygon">Polygon</Select.Option>
//           <Select.Option value="Avalanche">Avalanche</Select.Option>
//           <Select.Option value="Solana">Solana</Select.Option>
//           <Select.Option value="Optimism">Optimism</Select.Option>
//           <Select.Option value="Arbitrum">Arbitrum</Select.Option>
//           <Select.Option value="zkSync">zkSync</Select.Option>
//         </Select>
//         <Input 
//           placeholder="Enter Address or Transaction ID" 
//           value={query} 
//           onChange={(e) => setQuery(e.target.value)}
//           style={{ width: 300, marginRight: 10 }}
//         />
//         <Button type="primary" style={{ height: 32 }} onClick={traceFunds}>Trace Funds</Button>
//       </div>
//       <div style={{ height: '500px', backgroundColor: theme === 'light' ? colors.white : colors.gray[800], padding: 10 }}>
//         {nodes.length > 0 ? (
//           <GraphCanvas 
//             nodes={nodes} 
//             edges={edges} 
//             layoutType={layout} 
//             onNodeClick={(node) => console.log('Clicked node:', node)}
//           />
//         ) : (
//           <div style={{ textAlign: 'center', marginTop: '40px', color: theme === 'light' ? colors.black : colors.white }}>
//             Fund tracing graph will appear here.
//           </div>
//         )}
//       </div>
//       <div style={{ marginTop: 20 }}>
//         <h3>Risk Scoring & Analysis</h3>
//         <p>Risk Score: {nodes.length > 0 ? 'Low' : 'N/A'}</p>
//         <p>Additional fund flow details and analytics coming soon...</p>
//       </div>
//     </ViewWrapper>
//   );
// };

const FlowTrace = () => {
  return <div>Flow Trace</div>;
};

export default FlowTrace; 