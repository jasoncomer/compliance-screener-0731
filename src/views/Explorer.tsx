import { Alert, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import { GraphCanvas, GraphEdge, GraphNode, LayoutTypes } from 'reagraph';
import { IApiResponse } from '../typings/interfaces';
import styled from 'styled-components';
import { SearchOutlined } from '@ant-design/icons';

import ViewWrapper from '../components/ViewWrapper';
import AccountSummary from '../components/AccountSummary';
import { satsToBTC } from '../utils/crypto';
import GraphButtons from '../components/GraphButtons';
import { truncateStringMiddle } from '../utils/generic';
import NodeContextMenu from '../components/explorer/NodeContextMenu';
import Input from '../components/common/Input';
// import { api } from '../api/api';

interface Props { }

const SpinnerWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
`;

const Explorer: React.FC<Props> = () => {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<IApiResponse[]>();
  const [error, setError] = useState<string>('');

  // graph
  const [layout, setLayout] = useState<LayoutTypes>('treeLr2d');
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);

  const toggleLayout = () => {
    const layouts: LayoutTypes[] = ['forceDirected2d', 'forceDirected3d', 'circular2d', 'treeTd2d', 'treeTd3d', 'treeLr2d', 'treeLr3d', 'radialOut2d', 'radialOut3d', 'hierarchicalTd', 'hierarchicalLr', 'nooverlap', 'forceatlas2'];
    const currentIndex = layouts.indexOf(layout);
    const nextIndex = (currentIndex + 1) % layouts.length;
    const nextLayout = layouts[nextIndex];
    setLayout(nextLayout);
  }

  const fetchData = () => {
    if (!addresses.length) return;

    setLoading(true);
    const promises = addresses.map((address) => {
      return fetch(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/full`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
            return null;
          }
          return data;
        })
        .catch((err) => {
          console.error(err);
          setError(err.message);
          return null;
        });
    });

    Promise.all(promises)
      .then((dataArr) => {
        const allData = dataArr.filter((data) => data !== null) as IApiResponse[];
        setData(allData);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!data?.length) return;

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    data.forEach((innerData) => {
      (innerData.txs || []).forEach((tx) => {
        (tx.inputs || []).forEach((input) => {
          (input.addresses || []).forEach((fromAddress) => {
            (tx.outputs || []).forEach((output) => {
              (output.addresses || []).forEach((toAddress) => {
                nodes.push({
                  id: fromAddress,
                  label: truncateStringMiddle(fromAddress, 20),
                });
                nodes.push({
                  id: toAddress,
                  label: truncateStringMiddle(toAddress, 20),
                });

                if (fromAddress == toAddress) return;

                edges.push({
                  id: `${fromAddress}-${toAddress}`,
                  label: `${satsToBTC(output.value)} BTC`,
                  source: fromAddress,
                  target: toAddress,
                  data: {
                    amount: output.value
                  }
                });
              });
            });
          });
        });
      });
    });

    // Remove duplicate nodes
    const uniqueNodes = Array
      .from(
        new Set(
          nodes.map(n => JSON.stringify(n))
        ))
      .map(n => JSON.parse(n));

    setNodes(uniqueNodes);
    setEdges(edges);
  }, [data]);

  const onKeyDownHandler = (e: { keyCode: number; }) => {
    if (e.keyCode === 13) {
      fetchData();
    }
  };

  const onExpandAddress = (address: string) => {
    setAddresses([...addresses, address]);
  }

  return (
    <ViewWrapper
      icon={<SearchOutlined />}
      title="Transaction Explorer"
    >
      <SearchContainer>
        <Input
          placeholder='Enter a Bitcoin or Ethereum address'
          value={addresses[0] || ''}
          style={{ width: '400px' }}
          onChange={(e) => setAddresses([e.target.value])}
          onPressEnter={() => fetchData()}
          onSearch={fetchData}
          enterButton="Explore"
          onKeyDown={onKeyDownHandler}
        />
      </SearchContainer>

      {error && (
        <Alert
          message="Error Fetching Data"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError('')}
          style={{ marginBottom: 24 }}
        />
      )}

      {loading ? (
        <SpinnerWrapper>
          <Spin size="large" />
        </SpinnerWrapper>
      ) : data ? (
        <>
          <GraphButtons onClick={toggleLayout} />
          <AccountSummary data={data[0]} />
          <GraphCanvas
            labelType='all'
            nodes={nodes}
            edges={edges}
            layoutType={layout}
            edgeLabelPosition="natural"
            draggable
            layoutOverrides={{
              nodeLevelRatio: 5,
            }}
            onNodeContextMenu={(_, nodeId) => {
              console.log('nodeId', nodeId);
            }}
            contextMenu={({ data, onClose }) => (
              <NodeContextMenu 
                data={data} 
                onClose={onClose} 
                onExpandAddress={onExpandAddress} 
              />
            )}
          />
        </>
      ) : null}
    </ViewWrapper>
  );
};

export default Explorer;