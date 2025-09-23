import { CSSProperties } from 'react';

import { Card } from 'antd';
import styled from 'styled-components';

export const BlockLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
`;

export const ScrollableContent = styled.div`
  flex: 1;
  width: 100%;
  overflow-y: auto;
  min-height: 0;
`;

export const ErrorMessage = styled.div`
  color: #ff4d4f;
  padding: 20px;
  text-align: center;
  background: ${props => props.theme.theme === 'dark' ? '#2a2a2a' : '#f5f5f5'};
  border-radius: 4px;
  margin: 20px 0;
`;

export const BlockSummaryCard = styled(Card)`
  margin-bottom: 16px;
  margin-top: 0;
  background: ${({ theme }) => theme.theme === 'dark' ? '#0a0e1a' : '#fafafa'} !important;
  color: ${({ theme }) => theme.theme === 'dark' ? '#fff' : '#141414'} !important;
  border-radius: 8px;
  font-family: monospace;
`;

export const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #222;
  font-family: monospace;
  font-size: 14px;
  &:last-child {
    border-bottom: none;
  }
`;

export const Label = styled.span`
  color: #aaa;
`;

export const Value = styled.span`
  color: #fff;
  font-family: monospace;
  text-align: right;
  word-break: break-all;
`;

export const CopyButton = styled.button`
  background: none;
  border: none;
  color: #aaa;
  margin-left: 8px;
  cursor: pointer;
  &:hover {
    color: #fff;
  }
`;

export const CopyAlert = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: ${({ theme }) => theme.theme === 'dark' ? '#2a2a2a' : '#f5f5f5'};
  padding: 8px 16px;
  border-radius: 4px;
  z-index: 1000;
`;

export const StickyBlockHashCard = styled(BlockSummaryCard)`
  position: sticky;
  top: 0;
  z-index: 10;
`;

// Common styles
export const styles: Record<string, CSSProperties> = {
  blockHashContainer: {
    display: 'flex',
    alignItems: 'center',
    background: '#0a0e1a',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #374151',
    minHeight: 0
  },
  blockHashTitle: {
    margin: 10,
    fontSize: 18
  },
  blockHashValue: {
    fontSize: 13
  },
  summaryTitle: {
    fontSize: 18
  },
  summaryDivider: {
    border: 0,
    borderTop: '1px solid #444',
    margin: '8px 0 0 0'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 0
  },
  column: {
    marginRight: 16
  },
  columnRight: {
    marginLeft: 16
  },
  loadingContainer: {
    textAlign: 'center' as const,
    padding: '2rem'
  }
}; 