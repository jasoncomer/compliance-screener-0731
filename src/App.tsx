import {
  Route,
  Routes,
  Navigate
} from "react-router-dom";
import { useEffect, useState } from "react";
import Login from './views/Login';
import Register from "./views/Register";
import Home from "./views/Home";
import { ConfigProvider, ThemeConfig, Spin } from "antd";
import { colors } from './styles/variables';
import { useAppContext } from "./context/AppContext";
import { config } from "./config/config";
import { setAuthToken } from "./api/api";

function App() {
  const { user, setUser } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);

  const theme: ThemeConfig = {
    token: {
      colorPrimary: colors.primary,
    }
  };

  useEffect(() => {
    const { accessToken, user: userKey } = config.localstorageKeys;
    const storedToken = localStorage.getItem(accessToken);
    const storedUser = localStorage.getItem(userKey);

    if (storedToken && storedUser) {
      setAuthToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    
    setIsLoading(false);
  }, [setUser]);

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <ConfigProvider theme={theme}>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/home/cases" /> : <Login />} />
        <Route path="/login" element={user ? <Navigate to="/home/cases" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/home/cases" /> : <Register />} />
        <Route path="/home/*" element={user ? <Home /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </ConfigProvider>
  )
}

export default App;
