import { useMemo, useState } from 'react';
import Sider from 'antd/es/layout/Sider';
import styled from 'styled-components';
import { Button, Tooltip } from 'antd';
import { AlertFilled, AlertOutlined, FolderOpenOutlined, FolderOutlined, GlobalOutlined, LogoutOutlined, SafetyOutlined, SearchOutlined, SettingFilled, SettingOutlined, UserOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { colors } from '../styles/variables';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Theme } from '../context/ThemeContext';

const SiderWrapper = styled(Sider)`
  display: flex;
  flex-direction: column;

  .ant-layout-sider-trigger {
    background: transparent;
    border-right: 1px solid ${props => props.theme === 'dark' ? '#303030' : '#f0f0f0'};
    color: ${colors.primary};
    transition: all 0.3s;

    &:hover {
      background: ${props => props.theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'};
      color: ${colors.primary};
    }
  }
`;

const SiderContent = styled.div<{ $collapsed: boolean; $theme: Theme }>`
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
    color: ${props => props.$theme === 'dark' ? `${colors.primary}80` : colors.primary} !important;

    &.active {
      color: ${colors.primary} !important;
      border-color: ${colors.primary} !important;
      background: ${props => props.$theme === 'dark' ? 'transparent' : `${colors.primary}10`};
    }
    
    &:focus,
    &:hover {
      color: ${colors.primary} !important;
      border-color: ${colors.primary} !important;
      background: ${props => props.$theme === 'dark' ? 'transparent' : `${colors.primary}10`};
    }

    .anticon {
      color: inherit;
    }
  }
  img {
    width: 100%;
    border-radius: 6px;
  }
`;

const ButtonDiv = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  button {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
  }
`;

type Section = 'alerts' | 'cases' | 'explorer' | 'settings' | 'block-explorer' | 'blockham' | 'admin' | 'risk-scoring';

const Sidebar = () => {
  const nav = useNavigate();
  const params = useParams();
  const [collapsed, setCollapsed] = useState(false);
  const section = useMemo(() => params['*'], [params]);
  const { clearAppData } = useAppContext();
  const { theme } = useTheme();

  const [activeSection, setActiveSection] = useState<Section>(section as Section);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const handleSectionChange = (section: Section) => {
    setActiveSection(section);
    nav(`/home/${section}`);
  }

  const handleLogout = () => {
    clearAppData();
    nav('/');
  }

  return (
    <SiderWrapper
      collapsible
      collapsed={collapsed}
      onCollapse={toggleCollapsed}
      width={250}
      theme="dark"
    >
      <SiderContent $collapsed={collapsed} $theme={theme}>
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
            {activeSection === 'explorer' ? (
              <Tooltip placement="bottom" title={'Explorer'} mouseEnterDelay={1}>
                <SearchOutlined className='active' />
              </Tooltip>
            ) : (
              <Tooltip placement="bottom" title={'Explorer'} mouseEnterDelay={1}>
                <SearchOutlined onClick={() => handleSectionChange('explorer')} />
              </Tooltip>
            )}
            {activeSection === 'block-explorer' ? (
              <Tooltip placement="bottom" title={'Block Explorer'} mouseEnterDelay={1}>
                <GlobalOutlined className='active' />
              </Tooltip>
            ) : (
              <Tooltip placement="bottom" title={'Block Explorer'} mouseEnterDelay={1}>
                <GlobalOutlined onClick={() => handleSectionChange('block-explorer')} />
              </Tooltip>
            )}
            {activeSection === 'alerts' ? (
              <Tooltip placement="bottom" title={'Alerts'} mouseEnterDelay={1}>
                <AlertFilled className='active' />
              </Tooltip>
            ) : (
              <Tooltip placement="bottom" title={'Alerts'} mouseEnterDelay={1}>
                <AlertOutlined onClick={() => handleSectionChange('alerts')} />
              </Tooltip>
            )}
            {activeSection === 'blockham' ? (
              <Tooltip placement="bottom" title={'Entity Explorer'} mouseEnterDelay={1}>
                <GlobalOutlined className='active' />
              </Tooltip>
            ) : (
              <Tooltip placement="bottom" title={'Entity Explorer'} mouseEnterDelay={1}>
                <GlobalOutlined onClick={() => handleSectionChange('blockham')} />
              </Tooltip>
            )}
            {activeSection === 'risk-scoring' ? (
              <Tooltip placement="bottom" title={'Risk Scoring'} mouseEnterDelay={1}>
                <SafetyOutlined className='active' />
              </Tooltip>
            ) : (
              <Tooltip placement="bottom" title={'Risk Scoring'} mouseEnterDelay={1}>
                <SafetyOutlined onClick={() => handleSectionChange('risk-scoring')} />
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
            {activeSection === 'admin' ? (
              <Tooltip placement="bottom" title={'Admin'} mouseEnterDelay={1}>
                <UserSwitchOutlined className='active' style={{ marginTop: 'auto' }} />
              </Tooltip>
            ) : (
              <Tooltip placement="bottom" title={'Admin'} mouseEnterDelay={1}>
                <UserOutlined onClick={() => handleSectionChange('admin')} style={{ marginTop: 'auto' }} />
              </Tooltip>
            )}

            <Tooltip placement="right" title="Log Out">
              <LogoutOutlined onClick={handleLogout} />
            </Tooltip>
          </>
        ) : (
          <>
            <ButtonDiv>
              {activeSection === 'cases' ? (
                <Button
                  ghost
                  block
                  className='active'
                  icon={<FolderOpenOutlined className='active' />}>Cases</Button>
              ) : (
                <Button
                  ghost
                  block
                  color='primary'
                  onClick={() => handleSectionChange('cases')}
                  icon={<FolderOutlined />}>Cases</Button>
              )}
              {activeSection === 'explorer' ? (
                <Button
                  ghost
                  block
                  className='active'
                  icon={<SearchOutlined className='active' />}>Explorer</Button>
              ) : (
                <Button
                  ghost
                  block
                  onClick={() => handleSectionChange('explorer')}
                  icon={<SearchOutlined />}>Explorer</Button>
              )}
              {activeSection === 'block-explorer' ? (
                <Button
                  ghost
                  block
                  className='active'
                  icon={<GlobalOutlined className='active' />}>Block Explorer</Button>
              ) : (
                <Button
                  ghost
                  block
                  onClick={() => handleSectionChange('block-explorer')}
                  icon={<GlobalOutlined />}>Block Explorer</Button>
              )}
              {activeSection === 'alerts' ? (
                <Button
                  ghost
                  block
                  className='active'
                  icon={<AlertFilled className='active' />}>Alerts</Button>
              ) : (
                <Button
                  ghost
                  block
                  onClick={() => handleSectionChange('alerts')}
                  icon={<AlertOutlined />}>Alerts</Button>
              )}
              {activeSection === 'blockham' ? (
                <Button
                  ghost
                  block
                  className='active'
                  icon={<GlobalOutlined className='active' />}>Entity Explorer</Button>
              ) : (
                <Button
                  ghost
                  block
                  onClick={() => handleSectionChange('blockham')}
                  icon={<GlobalOutlined />}>Entity Explorer</Button>
              )}
              {activeSection === 'risk-scoring' ? (
                <Button
                  ghost
                  block
                  className='active'
                  icon={<SafetyOutlined className='active' />}>Risk Scoring</Button>
              ) : (
                <Button
                  ghost
                  block
                  onClick={() => handleSectionChange('risk-scoring')}
                  icon={<SafetyOutlined />}>Risk Scoring</Button>
              )}
              {activeSection === 'settings' ? (
                <Button
                  ghost
                  block
                  className='active'
                  icon={<SettingFilled className='active' />}>Settings</Button>
              ) : (
                <Button
                  ghost
                  block
                  onClick={() => handleSectionChange('settings')}
                  icon={<SettingOutlined />}>Settings</Button>
              )}

            </ButtonDiv>

            <ButtonDiv style={{ marginTop: 'auto' }}>
              {activeSection === 'admin' ? (
                <Button
                  ghost
                  block
                  className='active'
                  icon={<UserSwitchOutlined className='active' />}
                >Admin</Button>
              ) : (
                <Button
                  ghost
                  block
                  onClick={() => handleSectionChange('admin')}
                  icon={<UserOutlined />}
                >Admin</Button>
              )}

              <Button
                ghost
                block
                onClick={handleLogout}
                icon={<LogoutOutlined />}>Logout</Button>
            </ButtonDiv>

          </>
        )}
      </SiderContent>
    </SiderWrapper>
  );
};

export default Sidebar;