import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import SensorsIcon from '@mui/icons-material/Sensors';
import DevicesIcon from '@mui/icons-material/DevicesOther';
import ReportIcon from '@mui/icons-material/Assessment';
import WarningIcon from '@mui/icons-material/WarningAmber';
import ApiIcon from '@mui/icons-material/Api';
import Divider from '@mui/material/Divider';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/dashboard/monitor', label: 'Monitoreo', icon: <SensorsIcon/> },
  { to: '/dashboard/devices', label: 'Dispositivos', icon: <DevicesIcon/> },
  { to: '/dashboard/alerts', label: 'Alertas', icon: <WarningIcon/> },
  { to: '/dashboard/reports', label: 'Reportes', icon: <ReportIcon/> },
  { to: '/public', label: 'Posts', icon: <ReportIcon/> },
];

export default function AppDrawer({ open, onClose }){
  const { user } = useAuth();
  return (
    <Drawer open={open} onClose={onClose}>
      <List sx={{ width: 260, p: 1 }}>
        {links.map(l => (
          <NavLink key={l.to} to={l.to} style={{ textDecoration: 'none', color: 'inherit' }} onClick={onClose}>
            <ListItemButton>
              <ListItemIcon>{l.icon}</ListItemIcon>
              <ListItemText primary={l.label} />
            </ListItemButton>
          </NavLink>
        ))}
        <a href={(import.meta.env.VITE_SWAGGER_URL || '/api/docs/')} style={{ textDecoration: 'none', color: 'inherit' }}>
          <ListItemButton>
            <ListItemIcon><ApiIcon/></ListItemIcon>
            <ListItemText primary="Swagger" />
          </ListItemButton>
        </a>
        <Divider sx={{ my: 1 }} />
        {!user && (
          <NavLink to="/login" style={{ textDecoration: 'none', color: 'inherit' }} onClick={onClose}>
            <ListItemButton>
              <ListItemText primary="Login" />
            </ListItemButton>
          </NavLink>
        )}
      </List>
    </Drawer>
  );
}
