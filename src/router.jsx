import { createBrowserRouter } from 'react-router-dom';
import AppShell from './layout/AppShell';
import Login from './pages/Login';
import PublicFeed from './pages/PublicFeed';
import Monitor from './pages/monitor/Monitor';
import Devices from './pages/devices/Devices';
import Alerts from './pages/alerts/Alerts';
import Reports from './pages/reports/Reports';
import PrivateRoute from './utils/PrivateRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <PublicFeed /> },
      { path: 'public', element: <PublicFeed /> },
      { path: 'login', element: <Login /> },
      { path: 'dashboard/monitor', element: <PrivateRoute><Monitor /></PrivateRoute> },
      { path: 'dashboard/devices', element: <PrivateRoute><Devices /></PrivateRoute> },
      { path: 'dashboard/alerts', element: <PrivateRoute><Alerts /></PrivateRoute> },
      { path: 'dashboard/reports', element: <PrivateRoute><Reports /></PrivateRoute> },
    ]
  }
]);
