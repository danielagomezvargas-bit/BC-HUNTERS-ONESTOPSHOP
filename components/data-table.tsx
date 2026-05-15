"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Row = {
  id: string
  cliente: string
  segmento: string
  rfc: string
  tdr: number
  gmv_estimado: number
  comision_estimada: number
  propuesta_generada: string
  status: string
  vendedor: string
}

const statusVariant: Record<string, "default" | "outline" | "secondary" | "destructive" | "success" | "warning" | "mp" | "mp-yellow" | "mp-blue"> = {
  Cerrada: "success",
  Enviada: "mp-blue",
  "En revisión": "warning",
  Borrador: "outline",
}

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n)
}

export function DataTable({ data }: { data: Row[] }) {
  return (
    <div className="px-4 lg:px-6">
      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <h3 className="font-semibold text-card-foreground">Propuestas Recientes</h3>
          <span className="text-sm text-muted-foreground">{data.length} registros</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Segmento</TableHead>
              <TableHead className="text-right">TDR</TableHead>
              <TableHead className="text-right">GMV Estimado</TableHead>
              <TableHead className="text-right">Comisión</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.cliente}</TableCell>
                <TableCell className="text-muted-foreground">{row.segmento}</TableCell>
                <TableCell className="text-right tabular-nums">{row.tdr.toFixed(1)}%</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(row.gmv_estimado)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(row.comision_estimada)}</TableCell>
                <TableCell className="text-muted-foreground">{row.vendedor}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[row.status] ?? "outline"}>
                    {row.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
