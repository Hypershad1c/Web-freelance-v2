"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function PageViewsChart({ data }: { data: { date: string; vues: number }[] }) {
  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F293710" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#1F293799" }} />
          <YAxis tick={{ fontSize: 12, fill: "#1F293799" }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 30px -8px rgba(31,41,55,0.18)" }}
          />
          <Bar dataKey="vues" fill="#CD9C20" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
