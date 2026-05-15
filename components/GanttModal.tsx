"use client";
import type { Negocio, Productos } from "@/types";

const NAVY = "#0E1B3D";
const YEL  = "#FFE600";
const G150 = "#E5E5E5";

export interface GanttModalProps {
  open: boolean;
  onClose: () => void;
  negocio: Negocio;
  productos: Productos;
  palancasSel: { pt: Set<string>; op: Set<string> };
}

export default function GanttModal({ open, onClose }: GanttModalProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(14,27,61,0.65)",
          zIndex: 2000, backdropFilter: "blur(4px)",
        }}
      />

      {/* Modal — ajustado al tamaño 1440×820 del Gantt */}
      <div style={{
        position: "fixed",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(1472px, 98vw)",
        height: "min(876px, 96vh)",
        borderRadius: 16,
        zIndex: 2001,
        boxShadow: "0 32px 80px rgba(0,0,0,0.35)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: NAVY,
      }}>

        {/* Header mínimo: título + abrir en pestaña + cerrar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 16px", flexShrink: 0,
          background: NAVY, borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: YEL, flex: 1 }}>
            Cronograma de Implementación
          </span>


          {/* Cerrar */}
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)", border: "none",
              borderRadius: "50%", width: 28, height: 28,
              cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Iframe — el Gantt standalone ocupa todo */}
        <iframe
          src="/gantt/index.html"
          style={{
            flex: 1, border: "none", display: "block",
            width: "100%", minHeight: 0,
          }}
          title="Cronograma de implementación"
        />
      </div>
    </>
  );
}
