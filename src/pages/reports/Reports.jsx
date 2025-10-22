import { useEffect, useState, useMemo } from "react";
import { api } from "../../services/api";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import { useSnackbar } from "notistack";

function toInputValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function toIsoFromInput(val) { return val ? new Date(val).toISOString() : ""; }
function parseFilenameFromCD(header) {
  if (!header) return null;
  const m = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(header);
  return m ? decodeURIComponent(m[1]) : null;
}

export default function Reports() {
  const { enqueueSnackbar } = useSnackbar();
  const [deviceId, setDeviceId] = useState("");
  const [devices, setDevices] = useState([]);          // todos (para validación)
  const [activeDevices, setActiveDevices] = useState([]); // solo activos (para selector)
  const [fromLocal, setFromLocal] = useState("");
  const [toLocal, setToLocal] = useState("");

  const disabled = useMemo(
    () => !deviceId || !fromLocal || !toLocal || !activeDevices.length,
    [deviceId, fromLocal, toLocal, activeDevices.length]
  );

  useEffect(() => {
    (async () => {
      try {
        // Trae todo por si el backend no filtra
        const { data } = await api.get("/api/devices");
        const list = Array.isArray(data) ? data : [];
        setDevices(list);

        // BLOQUEO EN EL FRONT: solo activos en el selector
        const onlyActive = list.filter(d => String(d.status).toLowerCase() === "active");
        setActiveDevices(onlyActive);

        if (onlyActive.length) {
          setDeviceId(String(onlyActive[0].id));
        } else {
          setDeviceId("");
          enqueueSnackbar("No hay dispositivos activos para generar reportes.", { variant: "warning" });
        }
      } catch (e) {
        enqueueSnackbar(e?.response?.data?.message || e.message, { variant: "error" });
      }
    })();

    // rango por defecto: última hora
    const now = new Date();
    const y = new Date(now.getTime() - 3600 * 1000);
    setFromLocal(toInputValue(y.toISOString()));
    setToLocal(toInputValue(now.toISOString()));
  }, []);

  const download = async () => {
    try {
      // Guardia adicional: el seleccionado debe estar activo
      const selected = devices.find(d => String(d.id) === String(deviceId));
      if (!selected || String(selected.status).toLowerCase() !== "active") {
        enqueueSnackbar("Este dispositivo está inactivo. Selecciona uno activo.", { variant: "warning" });
        return;
      }

      const from = toIsoFromInput(fromLocal);
      const to = toIsoFromInput(toLocal);

      const res = await api.get("/api/reports/xlsx", {
        params: { deviceId, from, to },
        responseType: "blob",
        headers: {
          Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });

      const cd = res.headers?.["content-disposition"];
      const suggested = parseFilenameFromCD(cd);
      const filename =
        suggested ||
        `reporte_device${deviceId}_${new Date(from).toISOString().slice(0, 19)}_${new Date(to)
          .toISOString()
          .slice(0, 19)}.xlsx`.replaceAll(":", "-");

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      enqueueSnackbar("Descarga iniciada", { variant: "success" });
    } catch (e) {
      if (e?.response?.data instanceof Blob) {
        try {
          const text = await e.response.data.text();
          const maybeJson = JSON.parse(text);
          enqueueSnackbar(maybeJson?.error || maybeJson?.message || "Error al generar el reporte", { variant: "error" });
          return;
        } catch {}
      }
      enqueueSnackbar(e?.response?.data?.message || e.message || "Error al generar el reporte", { variant: "error" });
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 1 }}>Reportes</Typography>

      <Stack direction="row" spacing={2} alignItems="center" useFlexGap flexWrap="wrap">
        <TextField
          select
          label="Dispositivo"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          sx={{ minWidth: 260 }}
          helperText="Solo dispositivos activos"
        >
          {activeDevices.map((d) => (
            <MenuItem key={d.id} value={String(d.id)}>
              {d.name} (#{d.id})
            </MenuItem>
          ))}
        </TextField>

        <TextField
          type="datetime-local"
          label="Desde"
          value={fromLocal}
          onChange={(e) => setFromLocal(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          type="datetime-local"
          label="Hasta"
          value={toLocal}
          onChange={(e) => setToLocal(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />

        <Button variant="contained" onClick={download} disabled={disabled}>
          Descargar Reporte
        </Button>
      </Stack>
    </Paper>
  );
}
