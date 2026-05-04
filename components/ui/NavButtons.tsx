"use client";
import { COLORS } from "@/data/constants";

interface Props {
  onBack?: () => void;
  onNext: () => void;
  backLabel?: string;
  nextLabel?: string;
  backAction?: string;
  nextAction?: string;
}

export default function NavButtons({
  onBack, onNext,
  backLabel  = "← Paso anterior",
  nextLabel  = "Siguiente paso →",
  backAction = "Paso anterior",
  nextAction = "Siguiente paso",
}: Props) {
  const btnBase: React.CSSProperties = {
    padding:"11px 22px", borderRadius:8,
    fontSize:14, fontWeight:700, cursor:"pointer", border:"none",
    transition:"background-color .15s ease, border-color .15s ease",
  };

  return (
    <div style={{
      display:"flex", justifyContent:"space-between", alignItems:"center",
      marginTop:32, paddingTop:20, borderTop:`1px solid ${COLORS.border}`,
    }}>
      {onBack ? (
        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
          <span style={{ fontSize:10, fontWeight:700, color:COLORS.muted, textTransform:"uppercase", letterSpacing:".08em" }}>
            {backAction}
          </span>
          <button onClick={onBack} style={{ ...btnBase, background:"#fff", border:`1px solid ${COLORS.border}`, color:COLORS.text }}>
            {backLabel}
          </button>
        </div>
      ) : <div />}

      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5 }}>
        <span style={{ fontSize:10, fontWeight:700, color:COLORS.blue, textTransform:"uppercase", letterSpacing:".08em" }}>
          {nextAction}
        </span>
        <button onClick={onNext} style={{ ...btnBase, background:COLORS.blue, color:"#fff" }}>
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
