import styled from 'styled-components';
import { Typography, Card } from 'antd';
import { colors } from '../../styles/variables';

const { Title } = Typography;

export const SidebarCard = styled(Card)<{ $hasContent: boolean }>`
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.theme === 'dark' ? '#141414' : '#fff'};
  max-height: 80vh;
  overflow: hidden;
  border-radius: 8px;
  .ant-card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 16px 16px 0 16px;
    overflow: hidden;
    background-color: inherit;
  }
`;

export const ScrollableContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  & > div.Section:last-of-type {
    margin-bottom: 0;
  }
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.theme === 'dark' ? '#434343' : '#d9d9d9'};
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.theme === 'dark' ? '#595959' : '#bfbfbf'};
  }
`;

export const Section = styled.div`
  margin-bottom: 12px;
  &:last-child {
    margin-bottom: 0;
  }
`;

export const SectionTitle = styled(Title)`
  &.ant-typography {
    margin-top: 0px;
    font-size: 16px;
  }
`;

export const EntityList = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-top: 0px;
`;

export const StyledCard = styled(Card)`
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 0;
  border: 1px solid ${({ theme }) => theme.theme === 'dark' ? '#303030' : '#d9d9d9'};
  background: ${({ theme }) => theme.theme === 'dark' ? '#1f1f1f' : '#fff'};
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
    border-color: ${({ theme }) => theme.theme === 'dark' ? '#404040' : '#b9b9b9'};
  }
  .ant-card-body {
    padding: 12px;
    border-radius: 8px;
  }
`;

export const CardContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const EntityInfo = styled.div`
  flex: 1;
  .entity-name {
    font-weight: 500;
    margin-bottom: 2px;
  }
  .entity-type {
    color: ${({ theme }) => theme.theme === 'dark' ? colors.gray[400] : colors.gray[600]};
    font-size: 12px;
  }
`;

export const ScrollableSection = styled.div`
  max-height: 500px;
  overflow-y: auto;
  position: relative;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.theme === 'dark' ? '#434343' : '#d9d9d9'};
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.theme === 'dark' ? '#595959' : '#bfbfbf'};
  }
`;

export const ScrollMoreMessage = styled.div`
  text-align: center;
  padding: 4px 0;
  color: ${({ theme }) => theme.theme === 'dark' ? '#888' : '#666'};
  font-size: 12px;
`; 