import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { useSnackbar } from "notistack";
import { useSocket } from "../../hooks/useSocket";
import ReadingChart from "../../components/ReadingChart";

const ranges = [
  { key: "1h", label: "Última hora", ms: 60 * 60 * 1000 },
  { key: "24h", label: "24H", ms: 24 * 60 * 60 * 1000 },
  { key: "7d", label: "Semana", ms: 7 * 24 * 60 * 60 * 1000 },
];

export default function Monitor() {
  const { enqueueSnackbar } = useSnackbar();

  const [deviceId, setDeviceId] = useState(
    localStorage.getItem("fg_device_id") || ""
  );
  const [devices, setDevices] = useState([]);
  const [series, setSeries] = useState([]);
  const [tab, setTab] = useState(localStorage.getItem("fg_mon_tab") || "1h");
  const [loading, setLoading] = useState(false);

  // Carga SOLO activos
  const loadActiveDevices = async () => {
    try {
      const { data } = await api.get("/api/devices?onlyActive=1");
      const list = Array.isArray(data) ? data : [];
      setDevices(list);

      // Si el guardado ya no existe, selecciona el primero activo
      if (!list.find((d) => String(d.id) === String(deviceId))) {
        if (list.length) {
          const id = String(list[0].id);
          setDeviceId(id);
          localStorage.setItem("fg_device_id", id);
        } else {
          // No hay activos
          setDeviceId("");
          localStorage.removeItem("fg_device_id");
          setSeries([]);
          enqueueSnackbar("No hay dispositivos activos.", { variant: "warning" });
        }
      }
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Error al cargar dispositivos";
      enqueueSnackbar(msg, { variant: "error" });
      setDevices([]);
    }
  };

  const loadRange = async (dId, _rangeKey) => {
    if (!dId) return;
    try {
      setLoading(true);
      const { data } = await api.get("/api/readings", {
        params: { deviceId: dId, limit: 1000, order: "asc" },
      });

      // Soportar tanto [] como { rows: [] }
      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data?.rows)
        ? data.rows
        : [];

      const rows = arr.map((r) => ({
        time: new Date(r.createdAt).toLocaleTimeString(),
        temperature: r.temperature,
        humidity: r.humidity,
        pm25: r.pm25,
        pm10: r.pm10,
      }));
      setSeries(rows);
    } catch (e) {
      if (
        e?.response?.status === 403 &&
        e?.response?.data?.error === "DEVICE_INACTIVE"
      ) {
        enqueueSnackbar("El dispositivo está inactivo.", { variant: "warning" });
        // Re-sincroniza selección a un activo
        await loadActiveDevices();
      } else {
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Error al cargar lecturas";
        enqueueSnackbar(msg, { variant: "error" });
      }
      setSeries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadActiveDevices();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (deviceId) loadRange(deviceId, tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, tab]);

  // Actualizaciones en vivo solo en "Última hora"
  useSocket({
    "reading:new": (payload) => {
      if (!payload || String(payload.deviceId) !== String(deviceId)) return;
      if (tab !== "1h") return;
      const p = {
        time: new Date(payload.createdAt || Date.now()).toLocaleTimeString(),
        temperature: payload.temperature,
        humidity: payload.humidity,
        pm25: payload.pm25,
        pm10: payload.pm10,
      };
      setSeries((prev) => [...prev.slice(-599), p]);
    },
  });

  const options = useMemo(
    () => (Array.isArray(devices) ? devices : []).map((d) => ({ id: d.id, name: d.name })),
    [devices]
  );

  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h5" sx={{ flexGrow: 1 }}>
            Monitoreo
          </Typography>

          <Tabs
            value={tab}
            onChange={(_, v) => {
              setTab(v);
              localStorage.setItem("fg_mon_tab", v);
            }}
            textColor="inherit"
            indicatorColor="primary"
          >
            {ranges.map((r) => (
              <Tab key={r.key} label={r.label} value={r.key} />
            ))}
          </Tabs>

          <FormControl size="small" sx={{ minWidth: 240 }}>
            <InputLabel>Dispositivo</InputLabel>
            <Select
              label="Dispositivo"
              value={deviceId}
              onChange={(e) => {
                setDeviceId(e.target.value);
                localStorage.setItem("fg_device_id", e.target.value);
              }}
              disabled={!options.length}
            >
              {options.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.name} (#{o.id})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Chip label={`muestras: ${series.length}`} />
        </Stack>
      </Paper>

      <ReadingChart data={series} loading={loading} />
    </Stack>
  );
}
