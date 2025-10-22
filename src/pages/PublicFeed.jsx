import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useSnackbar } from 'notistack';

export default function PublicFeed(){
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const load = async () => {
    const { data } = await api.get('/api/community/public');
    setItems(data || []);
  };
  useEffect(()=>{ load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const authorName = user?.name || user?.email || 'ANONIMO';
      await api.post('/api/community/public', { authorName, content: text });
      setText('');
      await load();
      enqueueSnackbar('Reporte publicado', { variant: 'success' });
    } catch (e) {
      enqueueSnackbar(e?.response?.data?.message || e.message, { variant: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Paper sx={{ p: 2, mb: 2 }} component="form" onSubmit={submit}>
        <Typography variant="h6" sx={{ mb: 1 }}>Comunidad (público)</Typography>
        <Stack direction="row" spacing={2}>
          <TextField fullWidth placeholder="Reporta un incendio/anomalía…" value={text} onChange={e=>setText(e.target.value)} />
          <Button variant="contained" type="submit" disabled={loading}>Enviar</Button>
        </Stack>
      </Paper>
      <Stack spacing={2}>
        {items.map(p => (
          <Paper key={p.id} sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              {p.authorName === 'ANONIMO' ? <span style={{color:'#94a3b8'}}>(anónimo)</span> : (p.authorName || p.authorName || p.author || 'Anónimo')}
            </Typography>
            <Typography variant="caption" color="text.secondary">{new Date(p.createdAt).toLocaleString()}</Typography>
            <Typography sx={{ mt: 1 }}>{p.content}</Typography>
          </Paper>
        ))}
      </Stack>
      <Stack direction="row" justifyContent="center" sx={{ mt: 3 }}>
        <Button size="large" variant="outlined" href="/login">Ir al panel (Login)</Button>
      </Stack>
    </Container>
  );
}
