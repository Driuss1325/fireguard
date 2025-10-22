import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Brush,
} from "recharts";

/**
 * Props:
 *  - data: Array<{ time: string | Date, temperature?: number, humidity?: number, pm25?: number, pm10?: number }>
 *  - height?: number
 */
export default function ReadingChart({ data = [], height = 360 }) {
  // Paleta con colores claramente distinguibles
  const series = [
    { key: "temperature", name: "Temperatura (°C)", color: "#ef4444" }, // rojo
    { key: "humidity",    name: "Humedad (%)",      color: "#3b82f6" }, // azul
    { key: "pm25",        name: "PM2.5 (µg/m³)",    color: "#10b981" }, // verde
    { key: "pm10",        name: "PM10 (µg/m³)",     color: "#a855f7" }, // morado
  ];

  // Eje Y dinámico (opcional: puedes fijarlo si prefieres)
  const allValues = data.flatMap(d => [
    d.temperature, d.humidity, d.pm25, d.pm10,
  ]).filter(v => typeof v === "number" && isFinite(v));
  const minY = allValues.length ? Math.min(...allValues) : 0;
  const maxY = allValues.length ? Math.max(...allValues) : 100;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 12, right: 24, left: 12, bottom: 12 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
          <XAxis
            dataKey="time"
            minTickGap={24}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            domain={[Math.floor(minY - (maxY - minY) * 0.05), Math.ceil(maxY + (maxY - minY) * 0.05)]}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(val, key) => {
              const s = series.find(s => s.key === key);
              return [val, s?.name || key];
            }}
            labelFormatter={(label) => `Hora: ${label}`}
          />
          <Legend wrapperStyle={{ paddingTop: 8 }} />
          {series.map(s => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
              connectNulls
            />
          ))}
          {/* Permite hacer zoom por rango con el mouse */}
          <Brush dataKey="time" height={20} stroke="#6b7280" travellerWidth={8} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
