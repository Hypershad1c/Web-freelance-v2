"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMAD } from "@/lib/utils";

type RevenuePoint = {
  month: string;
  label: string;
  revenue: number;
};

export function MonthlyRevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#1F293710" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#1F293799" }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#1F293799" }} tickFormatter={(value: number) => `${value >= 1000 ? `${Math.round(value / 1000)}k` : value}`} />
          <Tooltip
            cursor={{ fill: "#FBF7EF" }}
            contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 30px -8px rgba(31,41,55,0.18)" }}
            formatter={(value) => [formatMAD(Number(value)), "Revenus"]}
            labelFormatter={(label) => `Mois : ${label}`}
          />
          <Bar dataKey="revenue" fill="#CD9C20" radius={[7, 7, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
