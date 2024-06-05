import { useMemo, useState } from 'react';
import Sider from 'antd/es/layout/Sider';
import styled from 'styled-components';
import { Button, Tooltip } from 'antd';
import { FolderOpenOutlined, FolderOutlined, LogoutOutlined, SearchOutlined, SettingFilled, SettingOutlined } from '@ant-design/icons';
import { colors } from '../styles/variables';
import { useNavigate, useParams } from 'react-router-dom';

const SiderWrapper = styled(Sider)`
  display: flex;
  flex-direction: column;
`;

const SiderContent = styled.div<{ $collapsed: boolean }>`
  display: flex;
  flex-direction: column;
  height: 100%;
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
    &:hover {
      color: ${colors.primary};
      cursor: pointer;
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

  const handleLogout = () => {
    nav('/');
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
            {activeSection === 'cases' ? (
              <Tooltip placement="bottom" title={'Cases'} mouseEnterDelay={1}>
                <FolderOpenOutlined className='active' />
              </Tooltip>
            ) : (
              <Tooltip placement="bottom" title={'Cases'} mouseEnterDelay={1}>
                <FolderOutlined onClick={() => handleSectionChange('cases')} />
              </Tooltip>
            )}
            {activeSection === 'settings' ? (
              <Tooltip placement="bottom" title={'Settings'} mouseEnterDelay={1}>
                <SettingFilled className='active' />
              </Tooltip>
            ) : (
              <Tooltip placement="bottom" title={'Settings'} mouseEnterDelay={1}>
                <SettingOutlined onClick={() => handleSectionChange('settings')} />
              </Tooltip>
            )}
            {activeSection === 'explorer' ? (
              <Tooltip placement="bottom" title={'Explorer'} mouseEnterDelay={1}>
                <SearchOutlined className='active' />
              </Tooltip>
            ) : (
              <Tooltip placement="bottom" title={'Explorer'} mouseEnterDelay={1}>
                <SearchOutlined onClick={() => handleSectionChange('explorer')} />
              </Tooltip>
            )}
            <Tooltip placement="bottom" title={'Log Out'} mouseEnterDelay={1}>
              <LogoutOutlined style={{ marginTop: 'auto' }} />
            </Tooltip>
          </>
        ) : (
          <>
            <div>
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
            <Button
              ghost
              onClick={handleLogout}
              icon={<LogoutOutlined style={{ marginTop: 'auto' }} />}
              style={{ marginTop: 'auto' }}
            >Log Out</Button>
          </>
        )}
      </SiderContent>
    </SiderWrapper>
  );
};

export default Sidebar;