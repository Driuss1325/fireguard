import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Paper from '@mui/material/Paper';
import { getGeo } from '../services/gps';

const icon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

// Centro por defecto (Guatemala)
const FALLBACK_CENTER = { lat: 14.6349, lng: -90.5069 };

export default function MapView({ devices = [], height = 420 }){
  const [viewerCenter, setViewerCenter] = useState(null);

  useEffect(() => {
    // pide ubicación del navegador y centra el mapa allí
    getGeo().then(geo => { if (geo) setViewerCenter({ lat: geo.lat, lng: geo.lng }); });
  }, []);

  // Normaliza y filtra solo los que tienen lat/lng numéricos
  const points = (devices || [])
    .map(d => {
      const loc = d?.lastLocation || d?.location;
      const lat = typeof loc?.lat === 'number' ? loc.lat : undefined;
      const lng = typeof loc?.lng === 'number' ? loc.lng : undefined;
      return lat != null && lng != null ? { ...d, lat, lng } : null;
    })
    .filter(Boolean);

  // Prioridad de centrado: GPS navegador -> primer dispositivo -> fallback
  const center =
    viewerCenter ||
    (points.length ? { lat: points[0].lat, lng: points[0].lng } : FALLBACK_CENTER);

  return (
    <Paper sx={{ p: 1 }}>
      <div style={{height}}>
        <MapContainer center={[center.lat, center.lng]} zoom={8} style={{height:'100%'}}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {points.map(d => (
            <Marker key={d.id} position={[d.lat, d.lng]} icon={icon}>
              <Popup>
                <b>{d.name || `Device #${d.id}`}</b><br/>
                {typeof d.lat === 'number' && typeof d.lng === 'number'
                  ? `${d.lat.toFixed(5)}, ${d.lng.toFixed(5)}`
                  : 'Sin ubicación'}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </Paper>
  );
}
