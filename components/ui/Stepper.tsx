"use client";
import { WIZARD_STEPS, COLORS } from "@/data/constants";

interface Props { currentStep: number }

export default function Stepper({ currentStep }: Props) {
  return (
    <div style={{ display:"flex", alignItems:"center", marginBottom:36 }}>
      {WIZARD_STEPS.map((label, i) => {
        const done   = i < currentStep;
        const active = i === currentStep;
        const cirBg  = done ? COLORS.green : active ? COLORS.blue : "#E5E7EB";
        const lblClr = active ? COLORS.navy : done ? COLORS.green : COLORS.muted;

        return (
          <div key={i} style={{ display:"flex", alignItems:"center", flex: i < WIZARD_STEPS.length - 1 ? 1 : "unset" }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:7 }}>
              <div style={{
                width:32, height:32, borderRadius:"50%",
                background:cirBg, color:"#fff",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:12, fontWeight:700,
                transition:"background-color .2s ease",
              }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{
                fontSize:10, textAlign:"center", lineHeight:1.3,
                whiteSpace:"nowrap", color:lblClr,
                fontWeight: active ? 700 : 500,
                letterSpacing:".01em",
              }}>
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
