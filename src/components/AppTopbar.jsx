import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Settings from '@mui/icons-material/Settings';
import Logout from '@mui/icons-material/Logout';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { getApiBase, setApiBase } from '../services/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../theme/ThemeContext.jsx';

export default function AppTopbar({ onMenu }){
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [api, setApi] = useState(getApiBase());
  const { mode, toggle } = useThemeMode();

  const save = () => { setApiBase(api); location.reload(); };

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar>
        <IconButton color="inherit" onClick={onMenu} sx={{ mr: 1 }}><MenuIcon/></IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>FireGuard</Typography>
        <Tooltip title={mode==='dark' ? 'Tema claro' : 'Tema oscuro'}>
          <IconButton color="inherit" onClick={toggle}>
            {mode==='dark' ? <Brightness7Icon/> : <Brightness4Icon/>}
          </IconButton>
        </Tooltip>
        <IconButton color="inherit" onClick={()=>setOpen(true)}><Settings/></IconButton>
        {user ? (
          <Button color="inherit" startIcon={<Logout/>} onClick={logout}>Salir</Button>
        ) : (
          <Button color="inherit" component={Link} to="/login">Login</Button>
        )}
      </Toolbar>
      <Dialog open={open} onClose={()=>setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ajustes</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="API Base" value={api} onChange={e=>setApi(e.target.value)} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={save}>Guardar & recargar</Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
}
