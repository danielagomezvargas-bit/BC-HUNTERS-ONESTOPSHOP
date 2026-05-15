"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const data = [
  { mes: "Nov", propuestas: 12, gmv: 120 },
  { mes: "Dic", propuestas: 18, gmv: 185 },
  { mes: "Ene", propuestas: 14, gmv: 142 },
  { mes: "Feb", propuestas: 22, gmv: 230 },
  { mes: "Mar", propuestas: 28, gmv: 310 },
  { mes: "Abr", propuestas: 34, gmv: 399 },
]

export function ChartAreaInteractive() {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Propuestas y GMV Potencial</CardTitle>
          <CardDescription>Últimos 6 meses · GMV en millones MXN</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1A1F71" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1A1F71" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPropuestas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#009EE3" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#009EE3" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="mes"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="gmv"
              orientation="right"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v}M`}
            />
            <YAxis
              yAxisId="propuestas"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
              formatter={(value, name) =>
                name === "gmv" ? [`$${value}M`, "GMV"] : [value, "Propuestas"]
              }
            />
            <Area
              yAxisId="gmv"
              type="monotone"
              dataKey="gmv"
              stroke="#1A1F71"
              strokeWidth={2}
              fill="url(#colorGmv)"
            />
            <Area
              yAxisId="propuestas"
              type="monotone"
              dataKey="propuestas"
              stroke="#009EE3"
              strokeWidth={2}
              fill="url(#colorPropuestas)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
