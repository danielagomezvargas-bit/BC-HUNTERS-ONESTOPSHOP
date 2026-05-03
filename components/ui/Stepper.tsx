"use client";
import { WIZARD_STEPS, COLORS } from "@/data/constants";

interface Props { currentStep: number }

export default function Stepper({ currentStep }: Props) {
  return (
    <div style={{ display:"flex", alignItems:"center", marginBottom:28 }}>
      {WIZARD_STEPS.map((label, i) => {
        const done   = i < currentStep;
        const active = i === currentStep;
        const cirBg  = done ? COLORS.green : active ? COLORS.blue : "#E0E0E0";
        const lblClr = active ? COLORS.navy : done ? COLORS.green : COLORS.muted;

        return (
          <div key={i} style={{ display:"flex", alignItems:"center", flex: i < WIZARD_STEPS.length - 1 ? 1 : "unset" }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
              <div style={{
                width:30, height:30, borderRadius:"50%",
                background:cirBg, color:"#fff",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:11, fontWeight:700,
              }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{
                fontSize:9, textAlign:"center", lineHeight:1.3,
                whiteSpace:"nowrap", color:lblClr,
                fontWeight: active ? 700 : 400,
              }}>
                {label}
              </span>
            </div>
            {i < WIZARD_STEPS.length - 1 && (
              <div style={{
                flex:1, height:2, margin:"0 4px", marginBottom:18,
                background: done ? COLORS.green : "#E0E0E0",
              }}/>
            )}
          </div>
        );
      })}
    </div>
  );
}
