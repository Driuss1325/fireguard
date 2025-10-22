import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Unstable_Grid2';
import Chip from '@mui/material/Chip';
import { useSnackbar } from 'notistack';

const ALERTS_ENDPOINTS = {
  list: '/api/alerts',
  ack: (id)=>`/api/alerts/${id}/ack`,
  mute: (id)=>`/api/alerts/${id}/mute`,
  thresholdsGet: '/api/alerts/thresholds',
  thresholdsPut: '/api/alerts/thresholds',
  thresholdsEffective: '/api/alerts/thresholds/effective',
};

const DEFAULTS = { temperature: 60, humidity: 15, pm25: 200, pm10: 300 };

export default function Alerts(){
  const { enqueueSnackbar } = useSnackbar();
  const [items, setItems] = useState([]);
  const [thresholds, setThresholds] = useState(DEFAULTS);
  const [devices, setDevices] = useState([]); // SOLO activos
  const [deviceId, setDeviceId] = useState('global');
  const [effectiveSource, setEffectiveSource] = useState('default');

  const fetchDevicesActive = async () => {
    try {
      const { data } = await api.get('/api/devices?onlyActive=1');
      const list = Array.isArray(data) ? data : [];
      setDevices(list);

      // Si el ámbito actual es un device que ya no está (se inactivó), volver a global
      if (deviceId !== 'global' && !list.find(d => String(d.id) === String(deviceId))) {
        setDeviceId('global');
        enqueueSnackbar('El dispositivo seleccionado está inactivo. Cambiando a ámbito Global.', { variant: 'warning' });
      }
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Error al cargar dispositivos';
      enqueueSnackbar(msg, { variant: 'error' });
      setDevices([]);
    }
  };

  const load = async (_deviceId = deviceId) => {
    // 1) lista de alertas y devices activos
    const [a] = await Promise.all([
      api.get(ALERTS_ENDPOINTS.list),
      fetchDevicesActive()
    ]);
    setItems(Array.isArray(a.data) ? a.data : []);

    // 2) thresholds segun ámbito
    const params = _deviceId === 'global' ? {} : { deviceId: Number(_deviceId) };

    try {
      const { data } = await api.get(ALERTS_ENDPOINTS.thresholdsGet, { params });
      if (data) {
        setThresholds({
          temperature: Number(data.temperature ?? DEFAULTS.temperature),
          humidity: Number(data.humidity ?? DEFAULTS.humidity),
          pm25: Number(data.pm25 ?? DEFAULTS.pm25),
          pm10: Number(data.pm10 ?? DEFAULTS.pm10),
        });
      }
    } catch {
      setThresholds(DEFAULTS);
    }

    // 3) umbral efectivo + fuente
    try {
      const { data } = await api.get(ALERTS_ENDPOINTS.thresholdsEffective, { params });
      setEffectiveSource(data?.source ? String(data.source) : 'default');
    } catch {
      setEffectiveSource('default');
    }
  };

  useEffect(()=>{ load(); /* primera carga */ }, []);
  useEffect(()=>{ load(deviceId); }, [deviceId]);

  const ack = async (id) => {
    try {
      await api.post(ALERTS_ENDPOINTS.ack(id));
      enqueueSnackbar('Alerta confirmada', { variant: 'success' });
      await load();
    } catch(e){
      enqueueSnackbar(e?.response?.data?.message || e.message, { variant: 'error' });
    }
  };

  const mute = async (id) => {
    try {
      const raw = window.prompt('¿Cuántos minutos quieres silenciar esta alerta?', '60');
      if (raw === null) return;
      const minutes = Number(raw);
      await api.post(ALERTS_ENDPOINTS.mute(id), Number.isFinite(minutes) ? { minutes } : {});
      enqueueSnackbar('Alerta silenciada', { variant: 'warning' });
      await load();
    } catch(e){
      enqueueSnackbar(e?.response?.data?.message || e.message, { variant: 'error' });
    }
  };

  // Guardado de umbrales (forzando deviceId en la URL si no es global)
  const saveThresholds = async () => {
    try {
      const isGlobal = deviceId === 'global';
      const url = isGlobal
        ? ALERTS_ENDPOINTS.thresholdsPut
        : `${ALERTS_ENDPOINTS.thresholdsPut}?deviceId=${encodeURIComponent(Number(deviceId))}`;

      await api.put(url, thresholds);

      enqueueSnackbar(isGlobal ? 'Umbrales globales guardados' : `Umbrales del device #${deviceId} guardados`, { variant: 'success' });
      await load();
    } catch (e) {
      enqueueSnackbar(e?.response?.data?.message || e.message, { variant: 'error' });
    }
  };

  const filteredItems = useMemo(()=> Array.isArray(items) ? items : [], [items]);

  const sourceChip = useMemo(()=>{
    const map = {
      device: { label: 'Fuente: device', color: 'success' },
      global: { label: 'Fuente: global', color: 'info' },
      default: { label: 'Fuente: default', color: 'warning' },
    };
    const meta = map[effectiveSource] || map.default;
    const scope = deviceId === 'global' ? 'global' : `#${deviceId}`;
    return <Chip size="small" label={`${meta.label} · ámbito: ${scope}`} color={meta.color} variant="outlined" />;
  }, [effectiveSource, deviceId]);

  return (
    <Stack spacing={2}>
      <Paper sx={{ p:2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="h5">Umbrales</Typography>
          {sourceChip}
        </Stack>

        <Grid container spacing={2}>
          <Grid xs={12} md={3}>
            <TextField
              select fullWidth label="Ámbito" value={deviceId}
              onChange={e=>setDeviceId(e.target.value)}
            >
              <MenuItem value="global">Global</MenuItem>
              {devices.map(d => (
                <MenuItem key={d.id} value={String(d.id)}>
                  {d.name} (#{d.id})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid xs={12} md={9}>
            <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
              <TextField label="Temp (°C) max" type="number"
                         value={thresholds.temperature}
                         onChange={e=>setThresholds({...thresholds, temperature:Number(e.target.value)})}/>
              <TextField label="Humedad (%) min" type="number"
                         value={thresholds.humidity}
                         onChange={e=>setThresholds({...thresholds, humidity:Number(e.target.value)})}/>
              <TextField label="PM2.5 max" type="number"
                         value={thresholds.pm25}
                         onChange={e=>setThresholds({...thresholds, pm25:Number(e.target.value)})}/>
              <TextField label="PM10 max" type="number"
                         value={thresholds.pm10}
                         onChange={e=>setThresholds({...thresholds, pm10:Number(e.target.value)})}/>
              <Button variant="contained" onClick={saveThresholds}>
                {deviceId === 'global' ? 'Guardar (Global)' : `Guardar (#${deviceId})`}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p:2 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>Alertas</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell><TableCell>Tipo</TableCell>
              <TableCell>Mensaje</TableCell><TableCell>Nivel</TableCell>
              <TableCell>Fecha</TableCell><TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.map(a => (
              <TableRow key={a.id}>
                <TableCell>{a.id}</TableCell>
                <TableCell>{a.type || '—'}</TableCell>
                <TableCell>{a.message}</TableCell>
                <TableCell>{a.level}</TableCell>
                <TableCell>{new Date(a.createdAt).toLocaleString()}</TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={()=>ack(a.id)}>Ack</Button>
                  <Button size="small" color="warning" onClick={()=>mute(a.id)}>Mute</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}
