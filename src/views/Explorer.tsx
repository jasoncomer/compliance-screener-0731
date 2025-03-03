import React, { useState } from 'react';
import { Input, Button } from 'antd';
import { GraphCanvas, GraphNode, GraphEdge, LayoutTypes } from 'reagraph';
import ViewWrapper from '../components/ViewWrapper';
import { SwapOutlined } from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/variables';

const Explorer: React.FC = () => {
  const { theme } = useTheme();
  const [address, setAddress] = useState('');
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([]);
  const [layout, setLayout] = useState<LayoutTypes>('treeLr2d');

  // Function to load the initial node
  const loadNode = () => {
    if (!address) {
      alert('Please enter an address');
      return;
    }
    // Add the initial node if it doesn't already exist
    if (!graphNodes.some(n => n.id === address)) {
      setGraphNodes([...graphNodes, { id: address, label: address }]);
    }
  };

  // Function to handle node click and simulate expansion
  const handleNodeClick = (node: GraphNode) => {
    const child1Id = `${node.id}-child1`;
    const child2Id = `${node.id}-child2`;
    const newNodes: GraphNode[] = [];
    const newEdges: GraphEdge[] = [];

    if (!graphNodes.some(n => n.id === child1Id)) {
      newNodes.push({ id: child1Id, label: child1Id });
      newEdges.push({ id: `${node.id}-${child1Id}`, source: node.id, target: child1Id, label: '' });
    }
    if (!graphNodes.some(n => n.id === child2Id)) {
      newNodes.push({ id: child2Id, label: child2Id });
      newEdges.push({ id: `${node.id}-${child2Id}`, source: node.id, target: child2Id, label: '' });
    }
    setGraphNodes(prev => [...prev, ...newNodes]);
    setGraphEdges(prev => [...prev, ...newEdges]);
  };

  return (
    <ViewWrapper title="Explorer" icon={<SwapOutlined style={{ fontSize: '28px', color: colors.attributionHover, fontWeight: 'bold' }} />}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Search Bar */}
        <div style={{ padding: '20px', borderBottom: `1px solid ${colors.gray[400]}`, display: 'flex', alignItems: 'center' }}>
          <Input 
            placeholder="Enter Address" 
            value={address} 
            onChange={(e) => setAddress(e.target.value)} 
            style={{ width: '300px', marginRight: '10px' }}
          />
          <Button type="primary" onClick={loadNode}>Load Node</Button>
        </div>
        {/* Graph Visualization */}
        <div style={{ flex: 1, position: 'relative' }}>
          {graphNodes.length > 0 ? (
            <div style={{ backgroundColor: theme === 'light' ? colors.white : colors.gray[800], height: '100%' }}>
              <GraphCanvas 
                nodes={graphNodes} 
                edges={graphEdges} 
                layoutType={layout} 
                onNodeClick={(node) => handleNodeClick(node)}
              />
            </div>
          ) : (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: theme === 'light' ? colors.black : colors.white }}>
              Graph visualization will appear here
            </div>
          )}
        </div>
      </div>
    </ViewWrapper>
  );
};

export default Explorer;