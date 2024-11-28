import {
  Route,
  Routes
} from "react-router-dom";
import Login from './views/Login';
import Register from "./views/Register";
import Home from "./views/Home";
import BlockHam from './views/BlockHam';
import { ConfigProvider, ThemeConfig } from "antd";
import { colors } from './styles/variables';
import { useAppContext } from "./context/AppContext";

function App() {
  const { user } = useAppContext();

  const theme: ThemeConfig = {
    token: {
      colorPrimary: colors.primary,
    }
  };

  return (
    <ConfigProvider theme={theme}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home/*" element={<Home />} />

        <Route path="*" element={user ? <Home /> : <Login />} />
      </Routes>
    </ConfigProvider>
  )
}

export default App;
