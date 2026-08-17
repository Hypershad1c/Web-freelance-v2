"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type TrendPoint = {
  date: string;
  visitors: number;
  sessions: number;
  pageViews: number;
};

export function VisitorTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-[300px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F293710" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#1F293799" }} />
          <YAxis tick={{ fontSize: 11, fill: "#1F293799" }} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 30px -8px rgba(31,41,55,0.18)" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="visitors" name="Visiteurs uniques" fill="#123247" radius={[5, 5, 0, 0]} />
          <Bar dataKey="sessions" name="Sessions" fill="#CD9C20" radius={[5, 5, 0, 0]} />
          <Bar dataKey="pageViews" name="Pages vues" fill="#7BA8B8" radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
