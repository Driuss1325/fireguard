import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import MapView from '../../components/MapView';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import Switch from '@mui/material/Switch';
import { useSnackbar } from 'notistack';

function DeviceForm({ open, onClose, initial, onSave }) {
  const [name, setName] = useState(initial?.name || '');
  const [ownerId, setOwnerId] = useState(initial?.ownerId || '');
  const [lat, setLat] = useState(initial?.lat ?? initial?.location?.lat ?? '');
  const [lng, setLng] = useState(initial?.lng ?? initial?.location?.lng ?? '');

  useEffect(() => {
    setName(initial?.name || '');
    setOwnerId(initial?.ownerId || '');
    setLat(initial?.lat ?? initial?.location?.lat ?? '');
    setLng(initial?.lng ?? initial?.location?.lng ?? '');
  }, [initial]);

  const submit = () => {
    const body = { name, ownerId: ownerId ? Number(ownerId) : undefined };
    if (lat && lng) {
      const _lat = Number(lat), _lng = Number(lng);
      if (Number.isFinite(_lat) && Number.isFinite(_lng)) {
        body.lat = _lat;
        body.lng = _lng;
        body.location = { lat: _lat, lng: _lng }; // compat opcional
      }
    }
    onSave(body);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial ? 'Editar dispositivo' : 'Nuevo dispositivo'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          <TextField label="Owner ID (opcional)" value={ownerId} onChange={(e) => setOwnerId(e.target.value)} fullWidth />
          <Stack direction="row" spacing={2}>
            <TextField label="Lat (opcional)" value={lat} onChange={(e) => setLat(e.target.value)} fullWidth />
            <TextField label="Lng (opcional)" value={lng} onChange={(e) => setLng(e.target.value)} fullWidth />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={submit}>{initial ? 'Guardar' : 'Crear'}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Devices() {
  const { enqueueSnackbar } = useSnackbar();
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const normalizeDevices = (arr) =>
    (arr || []).map((d) => {
      const rawLat = d.lat ?? d.lastLocation?.lat ?? d.location?.lat;
      const rawLng = d.lng ?? d.lastLocation?.lng ?? d.location?.lng;
      const lat = Number(rawLat);
      const lng = Number(rawLng);
      const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
      const fallback = { lat: 14.6349, lng: -90.5069 }; // Centro GUA
      return {
        ...d,
        lat: hasCoords ? lat : undefined,
        lng: hasCoords ? lng : undefined,
        location: hasCoords ? { lat, lng } : fallback,
      };
    });

  const load = async () => {
    const { data } = await api.get('/api/devices');
    const devices = Array.isArray(data) ? data : data?.data || [];
    setList(normalizeDevices(devices));
  };
  useEffect(() => { load(); }, []);

  const create = async (body) => {
    try {
      await api.post('/api/devices', body);
      enqueueSnackbar('Dispositivo creado', { variant: 'success' });
      setOpen(false);
      await load();
    } catch (e) {
      enqueueSnackbar(e?.response?.data?.message || e.message, { variant: 'error' });
    }
  };

  const update = async (id, body) => {
    try {
      await api.put(`/api/devices/${id}`, body);
      enqueueSnackbar('Dispositivo actualizado', { variant: 'success' });
      setEditing(null);
      await load();
    } catch (e) {
      enqueueSnackbar(e?.response?.data?.message || e.message, { variant: 'error' });
    }
  };

  // AHORA: /api/devices/status  con { deviceId, status }
  const toggleStatus = async (device, checked) => {
    const id = device?.id;
    if (!id) {
      enqueueSnackbar('ID de dispositivo no válido', { variant: 'error' });
      return;
    }
    const nextStatus = checked ? 'active' : 'inactive';

    // Optimista
    setList(prev => prev.map(x => x.id === id ? { ...x, status: nextStatus } : x));
    try {
      await api.put('/api/devices/status', { deviceId: id, status: nextStatus });
      enqueueSnackbar(`Estado: ${nextStatus}`, { variant: 'info' });
    } catch (e) {
      setList(prev => prev.map(x => x.id === id ? { ...x, status: device.status } : x)); // revertir
      enqueueSnackbar(e?.response?.data?.message || e.message, { variant: 'error' });
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">Dispositivos</Typography>
        <Button variant="contained" onClick={() => { setEditing(null); setOpen(true); }}>Nuevo</Button>
      </Stack>

      <MapView devices={list} />

      <Paper sx={{ p: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Ubicación</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.id}</TableCell>
                <TableCell>{d.name}</TableCell>
                <TableCell>{d.ownerId || '-'}</TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Switch
                      checked={String(d.status).toLowerCase() === 'active'}
                      onChange={(e) => toggleStatus(d, e.target.checked)}
                      inputProps={{ 'aria-label': 'toggle device status' }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {String(d.status).toLowerCase() === 'active' ? 'Activo' : 'Inactivo'}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  {Number.isFinite(d.lat) && Number.isFinite(d.lng)
                    ? `${d.lat.toFixed(5)}, ${d.lng.toFixed(5)}`
                    : '—'}
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => { setEditing(d); setOpen(true); }}>
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <DeviceForm
        open={open}
        onClose={() => setOpen(false)}
        initial={editing}
        onSave={(body) => (editing ? update(editing.id, body) : create(body))}
      />
    </Stack>
  );
}
