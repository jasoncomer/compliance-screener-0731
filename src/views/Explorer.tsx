import { Alert, Button, Input, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import { GraphCanvas, GraphEdge, GraphNode, LayoutTypes } from 'reagraph';
import { IApiResponse } from '../typings/interfaces';
import styled from 'styled-components';
import AccountSummary from '../components/AccountSummary';
import { satsToBTC } from '../utils/crypto';
import GraphButtons from '../components/GraphButtons';
import { truncateStringMiddle } from '../utils/generic';
import NodeContextMenu from '../components/explorer/NodeContextMenu';
import { api } from '../api/api';

interface Props { }

const SpinnerWrapper = styled.div`
  position: relative;
  top: calc(50% - 90px);
  left: calc(50% - 20px);
  height: 40px;
  width: 40px;
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
    console.log('fetchData', addresses);
    if (!addresses.length) return;

    // setLoading(true);

    const promises = addresses.map((address) => {
      return fetch(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/full`)
        .then((res) => res.json())
        .then((data) => {
          console.log(data);
          if (data.error) {
            return setError(data.error);
          }
          return data;
        })
        .catch((err) => {
          console.error(err);
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    });

    Promise.all(promises).then((dataArr) => {
      const allData = dataArr.map((data) => data as IApiResponse).filter((data) => data !== null);
      setData(allData);
    });
  };

  useEffect(() => {
    if (!data?.length) return;
    console.log('addresses', addresses);
    fetchData();
  }, [addresses]);

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
  }, [data, addresses]);

  const onKeyDownHandler = (e: { keyCode: number; }) => {
    console.log('key', e);
    if (e.keyCode === 13) {
      fetchData();
    }
  };

  if (loading) {
    return (
      <SpinnerWrapper>
        <Spin size="large" />
      </SpinnerWrapper>
    );
  }

  if (!data) {
    return (
      <>
        {error && <div style={{ position: 'absolute', top: '3em', left: 'calc(250px + 3em)' }}>
          <Alert
            closable
            message="Error Fetching Data"
            showIcon
            description={error}
            type="error"
          />
        </div>}
        <div style={{ display: 'flex', margin: 'auto', gap: '1em', width: '450px' }}>
          <Input
            width={400}
            type="text"
            value={addresses}
            placeholder='Enter a Bitcoin or Ethereum address'
            onChange={(e) => setAddresses([e.target.value])}
            onKeyUp={onKeyDownHandler}
          />
          <Button type='primary' onClick={fetchData}>Explore</Button>
        </div>
      </>
    );
  }

  const onExpandAddress = (address: string) => {
    console.log('expand address', address);
    setAddresses([...addresses, address]);
  }

  return (
    <div style={{ position: 'fixed', width: '100%', height: '100%' }}>
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
        onNodeContextMenu={(event, nodeId) => {
          console.log('nodeId', nodeId);
        }}
        contextMenu={({ data, onClose }) => <NodeContextMenu data={data} onClose={onClose} onExpandAddress={onExpandAddress} />}
      />
    </div>
  );
};

export default Explorer;