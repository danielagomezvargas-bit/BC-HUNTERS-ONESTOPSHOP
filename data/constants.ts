import type { Palanca } from "@/types";

export const COLORS = {
  blue:  "#009EE3",
  navy:  "#00304A",
  green: "#00A650",
  amber: "#B45309",
  red:   "#E53935",
  border:"#E0E0E0",
  bg:    "#F4F6FA",
  white: "#fff",
  muted: "#6B7280",
  text:  "#1A1A2E",
  lb:    "#E6F6FD",
  lg:    "#E6F5ED",
  la:    "#FEF3DA",
  lr:    "#FEE8EA",
} as const;

export const INDUSTRIES: string[] = [
  "Retail / Moda",
  "Restaurantes / Food & Bev",
  "Supermercados / Grocery",
  "Salud / Farmacia",
  "Electrónica / Tech",
  "Educación",
  "Viajes / Turismo",
  "Servicios Profesionales",
  "Construcción / Ferretería",
  "Entretenimiento / Ocio",
  "Automotriz",
  "Otro",
];

export const PROVEEDORES_PT: string[] = [
  "BBVA Bancomer","Banamex / Citibanamex","Santander","HSBC",
  "Banorte","Scotiabank","Inbursa","Clip","Fiserv","Getnet",
  "Otro","Desconocido",
];

export const PROVEEDORES_OP: string[] = [
  "Conekta","OpenPay","Sr. Pago","Stripe","PayPal",
  "Adyen","MIT / Prosa","E-Global","Otro","Desconocido",
];

export const MSI_PLAZOS = ["3x","6x","9x","12x","18x","24x"] as const;

export const TPV_RANGES = [
  { id:"lt1",   label:"< $1M",       min:0,          max:1_000_000  },
  { id:"1-5",   label:"$1M – $5M",   min:1_000_000,  max:5_000_000  },
  { id:"5-10",  label:"$5M – $10M",  min:5_000_000,  max:10_000_000 },
  { id:"10-20", label:"$10M – $20M", min:10_000_000, max:20_000_000 },
  { id:"20-40", label:"$20M – $40M", min:20_000_000, max:40_000_000 },
  { id:"gt40",  label:"> $40M",      min:40_000_000, max:Infinity   },
] as const;

export const STATUSES = [
  { id:"por_definir", label:"Por definir",  color:"#6B7280", bg:"#F0F0F0" },
  { id:"en_proceso",  label:"En proceso",   color:"#B45309", bg:"#FEF3DA" },
  { id:"presentado",  label:"Presentado",   color:"#009EE3", bg:"#E6F6FD" },
  { id:"ganado",      label:"Ganado ✓",     color:"#00A650", bg:"#D6EDD9" },
  { id:"perdido",     label:"Perdido ✗",    color:"#E53935", bg:"#FAD7D7" },
  { id:"en_pausa",    label:"En pausa",     color:"#6B7280", bg:"#E5E7EB" },
] as const;

export const WIZARD_STEPS = [
  "Datos del negocio",
  "Producto",
  "Proveedores",
  "Share de pagos",
  "Comisiones",
  "Propuesta de valor",
] as const;

export const MEDIOS_PT_OT = [
  { key:"td",   label:"T. Débito"    },
  { key:"tc",   label:"T. Crédito"   },
  { key:"amex", label:"AMEX"         },
  { key:"intl", label:"Internacional"},
] as const;

export const MEDIOS_OP_OT = [
  { key:"td",       label:"T. Débito"       },
  { key:"tc",       label:"T. Crédito"      },
  { key:"amex",     label:"AMEX"            },
  { key:"intl",     label:"Internacional"   },
  { key:"oxxo",     label:"OXXO"            },
  { key:"paycash",  label:"Red PayCash"     },
  { key:"transfer", label:"Dep. y Transf."  },
  { key:"am",       label:"AM & MP Crédito" },
] as const;

export const PALANCAS_PT: Palanca[] = [
  { id:"medios",    label:"Más medios de pago",          icon:"💳", bench:"↑ 5–15% conversión",     benchPct:10 },
  { id:"msi-all",  label:"Todas las tarjetas en MSI",   icon:"📅", bench:"↑ 8–20% ticket promedio", benchPct:12 },
  { id:"bnpl",     label:"BNPL",                        icon:"🔄", bench:"↑ 10–25% conversión",    benchPct:15 },
  { id:"opciones", label:"Opciones de Pago",            icon:"⚙️", bench:"↑ 3–8% checkout",        benchPct:5  },
  { id:"tarjetas", label:"Aceptación de Tarjetas",      icon:"💰", bench:"↑ 5–12% ventas",         benchPct:7  },
  { id:"hotsale",  label:"Seasonal — Hot Sale",         icon:"🔥", bench:"↑ 20–40% en evento",     benchPct:30 },
  { id:"buenfin",  label:"Seasonal — Buen Fin",         icon:"🛍", bench:"↑ 30–60% en evento",     benchPct:45 },
  { id:"marketing",label:"Estrategias de Marketing",    icon:"📣", bench:"↑ 5–15% tráfico",        benchPct:8  },
  { id:"cupones",  label:"Cupones",                     icon:"🎟", bench:"↑ 3–10% conversión",     benchPct:6  },
  { id:"concilia", label:"Conciliación eficiente",      icon:"📊", bench:"↓ 2–5% errores",         benchPct:3  },
  { id:"otro-pt",  label:"Otro",                        icon:"✏️", bench:"A definir por hunter",   benchPct:0  },
];

export const PALANCAS_OP: Palanca[] = [
  { id:"medios-op", label:"Más medios de pago",         icon:"💳", bench:"↑ 5–15% conversión",     benchPct:10 },
  { id:"msi-op",    label:"Todas las tarjetas en MSI",  icon:"📅", bench:"↑ 8–20% ticket promedio", benchPct:12 },
  { id:"bnpl-op",   label:"BNPL",                       icon:"🔄", bench:"↑ 10–25% conversión",    benchPct:15 },
  { id:"opc-op",    label:"Opciones de Pago",           icon:"⚙️", bench:"↑ 3–8% checkout",        benchPct:5  },
  { id:"tar-op",    label:"Aceptación de Tarjetas",     icon:"💰", bench:"↑ 5–12% ventas",         benchPct:7  },
  { id:"hs-op",     label:"Seasonal — Hot Sale",        icon:"🔥", bench:"↑ 20–40% en evento",     benchPct:30 },
  { id:"bf-op",     label:"Seasonal — Buen Fin",        icon:"🛍", bench:"↑ 30–60% en evento",     benchPct:45 },
  { id:"mkt-op",    label:"Estrategias de Marketing",   icon:"📣", bench:"↑ 5–15% tráfico",        benchPct:8  },
  { id:"cup-op",    label:"Cupones",                    icon:"🎟", bench:"↑ 3–10% conversión",     benchPct:6  },
  { id:"otro-op",   label:"Otro",                       icon:"✏️", bench:"A definir por hunter",   benchPct:0  },
];
