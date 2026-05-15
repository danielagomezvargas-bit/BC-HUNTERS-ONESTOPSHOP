import type { Palanca } from "@/types";

export const COLORS = {
  blue:  "#009EE3",
  navy:  "#00304A",
  green: "#00A650",
  amber: "#B45309",
  red:   "#E53935",
  border:"#E5E7EB",
  bg:    "#F8F9FB",
  white: "#fff",
  muted: "#6B7280",
  text:  "#1A1A2E",
  lb:    "#F4FAFD",
  lg:    "#F2F9F5",
  la:    "#FFF8E8",
  lr:    "#FDF2F3",
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
  "Resultado",
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
  // ── Producto ────────────────────────────────────────────────
  {
    id: "mas-medios", label: "Más Medios de pago", icon: "card",
    range: "0.01–0.5%", category: "producto",
    desc: "No rechaces ningún tipo de cobro",
    suboptions: [
      { id: "valeras",   label: "Valeras",              defaultPct: 0.01 },
      { id: "amex",      label: "Amex",                 defaultPct: 0.01 },
      { id: "neobancos", label: "Neobancos",            defaultPct: 0.01 },
      { id: "bienestar", label: "Bienestar",            defaultPct: 0.01 },
      { id: "otros",     label: "Otros",                defaultPct: 0.5  },
      { id: "todos",     label: "Todos los medios",     defaultPct: 0.5  },
    ],
  },
  {
    id: "msi", label: "MSIs", icon: "stack",
    range: "0.01–0.5%", category: "producto",
    desc: "Aceptar todos los bancos para MSIs",
    suboptions: [
      { id: "prosa",   label: "Prosa",                    defaultPct: 0.02 },
      { id: "bbva",    label: "BBVA",                     defaultPct: 0.02 },
      { id: "amex",    label: "AMEX",                     defaultPct: 0.01 },
      { id: "aceptar", label: "Aceptar todos los bancos", defaultPct: 0.5  },
      { id: "otro",    label: "Otro",                     defaultPct: 0.5  },
    ],
  },
  {
    id: "bnpl", label: "BNPL en tienda", icon: "refresh",
    range: "0.1%", category: "producto",
    desc: "Acepta Mercado Crédito y Account Money en tienda",
    suboptions: [
      { id: "mc", label: "Mercado Crédito", defaultPct: 0.1 },
      { id: "am", label: "Account Money",  defaultPct: 0.1 },
    ],
  },
  {
    id: "link-pago", label: "Link de Pago", icon: "link",
    range: "0.1%", category: "producto",
    desc: "Cajeros y equipo de ventas envían links desde la terminal",
  },
  {
    id: "ruteo", label: "Ruteo Inteligente", icon: "options",
    range: "0.1%", category: "producto",
    desc: "Las terminales definen la mejor ruta de pago automáticamente",
  },
  // ── Innovación ───────────────────────────────────────────────
  {
    id: "cuotas-interes", label: "Cuotas con Interés", icon: "bolt",
    range: "0.5%", category: "innovacion",
    desc: "Deslinda al seller del costo financiero y ofrece cuotas a clientes",
  },
  // ── Marketing ────────────────────────────────────────────────
  {
    id: "seasonals", label: "Seasonals", icon: "megaphone",
    range: "0.5%", category: "marketing",
    desc: "Campañas y promocionales en temporalidades clave",
    suboptions: [
      { id: "hot-sale", label: "Hot Sale",  defaultPct: 0.5 },
      { id: "buen-fin", label: "Buen Fin",  defaultPct: 0.5 },
    ],
  },
  {
    id: "campanas-mensuales", label: "Campañas Mensuales", icon: "tag",
    range: "0.5%", category: "marketing",
    desc: "Descuentos y cupones una vez al mes",
  },
  {
    id: "trafico", label: "Tráfico de Usuarios", icon: "chart",
    range: "0.5%", category: "marketing",
    desc: "Hub de beneficios y Landing Page para atraer clientes",
  },
  {
    id: "material-pop", label: "Material POP", icon: "bag",
    range: "0.5%", category: "marketing",
    desc: "Material para promocionar opciones de pago en tiendas",
  },
];

export const PALANCAS_OP: Palanca[] = [
  { id: "checkout-pro", label: "Checkout Pro",            icon: "globe",    range: "8–14% conversión"        },
  { id: "smart-tokens", label: "Smart tokens",            icon: "key",      range: "2–5% aprobación"         },
  { id: "subs",         label: "Suscripciones",           icon: "refresh",  range: "5–10% recurrencia"       },
  { id: "msi-op",       label: "MSI Online",              icon: "stack",    range: "6–15% ticket"            },
  { id: "antifraude",   label: "Antifraude avanzado",     icon: "shield",   range: "1–3% chargebacks ↓"     },
  { id: "one-click",    label: "One-click",               icon: "bolt",     range: "10–18% recompra"         },
  { id: "wallet",       label: "Wallet MP",               icon: "wallet",   range: "4–9% conversión"         },
  { id: "links",        label: "Payment Links",           icon: "link",     range: "2–6% canales"            },
  { id: "qr-online",    label: "QR Online",               icon: "qr",       range: "1–4% incremental"        },
  { id: "otro-op",      label: "Otro",                    icon: "edit",     range: "Custom"                  },
];
