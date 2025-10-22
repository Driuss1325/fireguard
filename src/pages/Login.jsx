import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function Login(){
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@fireguard.local');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  useEffect(()=> {
    if (user) navigate('/dashboard/monitor', { replace: true });
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard/monitor', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ display:'grid', placeItems:'center', height:'100%' }}>
      <Paper component="form" onSubmit={submit} sx={{ p:3, width:'100%' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Iniciar sesión</Typography>
        <Stack spacing={2}>
          <TextField label="Email" value={email} onChange={e=>setEmail(e.target.value)} fullWidth />
          <TextField label="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} fullWidth />
          <Button type="submit" variant="contained" disabled={loading}>Entrar</Button>
          <Button href="/public">Ir al feed público</Button>
        </Stack>
      </Paper>
    </Container>
  );
}
