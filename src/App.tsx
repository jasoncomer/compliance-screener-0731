import {
  Route,
  Routes,
  Navigate
} from "react-router-dom";
import { useEffect, useState } from "react";
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import Login from './views/Login';
import Register from "./views/Register";
import Home from "./views/Home";
import { ConfigProvider, Spin, message } from "antd";
import { useAppContext } from "./context/AppContext";
import { config } from "./config/config";
import { setAuthToken } from "./api/api";
import { useTheme } from "./context/ThemeContext";
import { lightTheme, darkTheme } from "./styles/theme";

function App() {
  const { user, setUser } = useAppContext();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();

  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { accessToken, user: userKey } = config.localstorageKeys;
        const storedToken = localStorage.getItem(accessToken);
        const storedUser = localStorage.getItem(userKey);

        if (!storedToken || !storedUser) {
          setIsLoading(false);
          return;
        }

        try {
          const parsedUser = JSON.parse(storedUser);
          
          // Set the auth token first
          await setAuthToken(storedToken);
          
          // Then set the user
          setUser(parsedUser);
          
        } catch (parseError) {
          // Handle invalid stored data
          localStorage.removeItem(accessToken);
          localStorage.removeItem(userKey);
          messageApi.error('Session data corrupted. Please login again.');
        }
      } catch (error) {
        messageApi.error('Error loading user session');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [setUser, messageApi]);

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <ConfigProvider theme={currentTheme}>
      <StyledThemeProvider theme={{ theme }}>
        {contextHolder}
        <Routes>
          <Route path="/" element={user ? <Navigate to="/home/cases" /> : <Login />} />
          <Route path="/login" element={user ? <Navigate to="/home/cases" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/home/cases" /> : <Register />} />
          <Route path="/home/*" element={user ? <Home /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </StyledThemeProvider>
    </ConfigProvider>
  )
}

export default App;
