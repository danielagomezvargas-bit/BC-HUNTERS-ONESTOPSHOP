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
    padding:"9px 20px", borderRadius:8,
    fontSize:13, fontWeight:700, cursor:"pointer", border:"none",
  };

  return (
    <div style={{
      display:"flex", justifyContent:"space-between", alignItems:"center",
      marginTop:24, paddingTop:16, borderTop:`1px solid ${COLORS.border}`,
    }}>
      {onBack ? (
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <span style={{ fontSize:9, fontWeight:700, color:COLORS.muted, textTransform:"uppercase", letterSpacing:".07em" }}>
            {backAction}
          </span>
          <button onClick={onBack} style={{ ...btnBase, background:"#fff", border:`1px solid ${COLORS.border}`, color:COLORS.text }}>
            {backLabel}
          </button>
        </div>
      ) : <div />}

      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3 }}>
        <span style={{ fontSize:9, fontWeight:700, color:COLORS.blue, textTransform:"uppercase", letterSpacing:".07em" }}>
          {nextAction}
        </span>
        <button onClick={onNext} style={{ ...btnBase, background:COLORS.blue, color:"#fff" }}>
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
