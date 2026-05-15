"use client";
import { WIZARD_STEPS, COLORS } from "@/data/constants";

interface Props {
  currentStep: number;
  onGoTo?: (step: number) => void;
}

export default function Stepper({ currentStep, onGoTo }: Props) {
  return (
    <div style={{ display:"flex", alignItems:"center", marginBottom:36 }}>
      {WIZARD_STEPS.map((label, i) => {
        const done   = i < currentStep;
        const active = i === currentStep;
        const clickable = done && !!onGoTo;
        const cirBg  = done ? COLORS.green : active ? COLORS.blue : "#E5E7EB";
        const lblClr = active ? COLORS.navy : done ? COLORS.green : COLORS.muted;

        return (
          <div key={i} style={{ display:"flex", alignItems:"center", flex: i < WIZARD_STEPS.length - 1 ? 1 : "unset" }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:7 }}>
              <div
                onClick={() => clickable && onGoTo!(i)}
                title={clickable ? `Ir a: ${label}` : undefined}
                style={{
                  width:32, height:32, borderRadius:"50%",
                  background:cirBg, color:"#fff",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:12, fontWeight:700,
                  transition:"background-color .2s ease, transform .15s ease, box-shadow .15s ease",
                  cursor: clickable ? "pointer" : "default",
                  boxShadow: clickable ? "0 0 0 0px transparent" : "none",
                }}
                onMouseEnter={e => { if (clickable) { (e.currentTarget as HTMLElement).style.transform = "scale(1.12)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,167,80,.35)"; } }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                onClick={() => clickable && onGoTo!(i)}
                style={{
                  fontSize:10, textAlign:"center", lineHeight:1.3,
                  whiteSpace:"nowrap", color:lblClr,
                  fontWeight: active ? 700 : 500,
                  letterSpacing:".01em",
                  cursor: clickable ? "pointer" : "default",
                  textDecoration: clickable ? "underline dotted" : "none",
                  textUnderlineOffset: 3,
                }}
              >
                {label}
              </span>
            </div>
            {i < WIZARD_STEPS.length - 1 && (
              <div style={{
                flex:1, height:2, margin:"0 6px", marginBottom:20,
                background: done ? COLORS.green : "#E5E7EB",
                transition:"background-color .2s ease",
              }}/>
            )}
          </div>
        );
      })}
    </div>
  );
}
