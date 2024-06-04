import { useMemo, useState } from 'react';
import Sider from 'antd/es/layout/Sider';
import styled from 'styled-components';
import { Button } from 'antd';
import { FolderOpenOutlined, FolderOutlined, SearchOutlined, SettingFilled, SettingOutlined } from '@ant-design/icons';
import { colors } from '../styles/variables';
import { useNavigate, useParams } from 'react-router-dom';

const SiderWrapper = styled(Sider)`
  display: flex;
  flex-direction: column;
`;

const SiderContent = styled.div<{ $collapsed: boolean }>`
  display: flex;
  flex-direction: column;
  color: white;
  padding: ${props => props.$collapsed ? '0.5em' : '1em'};
  justify-content: center;
  align-items: center;
  font-size: 2em;
  gap: 1em;
  transition: all 0.3s;

  .anticon {
    &.active {
      svg {
        fill: ${colors.primary} !important;
      }
    }
  }
  
  button {
    width: 100%;
    text-align: left;

    &.active {
      color: ${colors.primary};
      border-color: ${colors.primary};
    }
    
    &:focus,
    &:hover {
      color: ${colors.primary} !important;
      border-color: ${colors.primary} !important;
    }
  }
  img {
    width: 100%;
    border-radius: 6px;
  }
`;

type Section = 'cases' | 'settings' | 'explorer';

const Sidebar = () => {
  const nav = useNavigate();
  const params = useParams();
  const [collapsed, setCollapsed] = useState(false);
  const section = useMemo(() => params['*'], [params]);
  const [activeSection, setActiveSection] = useState<Section>(section as Section);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const handleSectionChange = (section: Section) => {
    setActiveSection(section);
    nav(`/home/${section}`);
  }

  return (
    <SiderWrapper
      collapsible
      collapsed={collapsed}
      onCollapse={toggleCollapsed}
      width={250}
    >
      <SiderContent $collapsed={collapsed}>
        <img src='https://framerusercontent.com/images/3djlle6W5wE61QQGlOQuLh5QvQ.jpg' />
        {collapsed ? (
          <>
            {/** Icons */}
            {activeSection === 'cases' ? <FolderOpenOutlined className='active' /> : <FolderOutlined onClick={() => handleSectionChange('cases')} />}
            {activeSection === 'settings' ? <SettingFilled className='active' /> : <SettingOutlined onClick={() => handleSectionChange('settings')} />}
            {activeSection === 'explorer' ? <SearchOutlined className='active' /> : <SearchOutlined onClick={() => handleSectionChange('explorer')} />}
          </>
        ) : (
          <div>
            {/** Buttons */}
            {activeSection === 'cases' ? (
              <Button
                ghost
                className='active'
                icon={<FolderOpenOutlined className='active' />}>Cases</Button>
            ) : (
              <Button
                ghost
                color='primary'
                onClick={() => handleSectionChange('cases')}
                icon={<FolderOutlined />}>Cases</Button>
            )}
            {activeSection === 'explorer' ? (
              <Button
                ghost
                className='active'
                icon={<SearchOutlined className='active' />}>Explorer</Button>
            ) : (
              <Button
                ghost
                onClick={() => handleSectionChange('explorer')}
                icon={<SearchOutlined />}>Explorer</Button>
            )}
            {activeSection === 'settings' ? (
              <Button
                ghost
                className='active'
                icon={<SettingFilled className='active' />}>Settings</Button>
            ) : (
              <Button
                ghost
                onClick={() => handleSectionChange('settings')}
                icon={<SettingOutlined />}>Settings</Button>
            )}
          </div>
        )}
      </SiderContent>
    </SiderWrapper>
  );
};

export default Sidebar;