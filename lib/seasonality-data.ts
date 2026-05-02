/**
 * Industrias y benchmarks de estacionalidad para el Business Case Simulator.
 *
 * Benchmarks derivados de:
 *  - Data real BigQuery portfolio BS Hunting MLM (Nov/Dic 2025 vs Oct 2025):
 *    - Buen Fin 2025 (Nov 21-24): +24% vs día base | Nov total: +76% | Dic: +67%
 *  - Los días de BF en el portfolio actual (mayormente Point físico) son moderados;
 *    OP/e-commerce muestra efectos 3-5x más altos en los mismos eventos.
 *  - Escalado por industria según patrones de consumo México.
 */

export const INDUSTRIES = [
  'Retail / Tiendas de Ropa y Moda',
  'Restaurantes y Cafeterías',
  'Supermercados y Abarrotes',
  'Farmacias y Salud',
  'Electrónica y Tecnología',
  'Joyería y Accesorios',
  'Servicios Médicos y Dentales',
  'Hoteles y Hospedaje',
  'Educación y Academias',
  'Gimnasios y Bienestar',
  'Salones de Belleza y Estética',
  'Ferretería y Materiales de Construcción',
  'Automotriz y Refaccionarias',
  'Veterinarias',
  'Entretenimiento y Ocio',
  'Gasolineras',
  'E-commerce / Ventas en Línea',
  'Servicios Profesionales',
  'Ópticas',
  'Muebles y Decoración del Hogar',
  'Deportes y Artículos Deportivos',
  'Otro / General',
] as const

export type Industry = typeof INDUSTRIES[number]

export interface IndustrySeasonality {
  /** % adicional al TPV base mensual durante Buen Fin (noviembre). Ej: 70 = +70% ese mes. */
  buenFin: number
  /** % adicional durante Hot Sale (mayo-junio). */
  hotSale: number
  /** % adicional durante Navidad / diciembre. */
  navidad: number
}

export const SEASONALITY_BY_INDUSTRY: Record<string, IndustrySeasonality> = {
  'Retail / Tiendas de Ropa y Moda':        { buenFin: 70,  hotSale: 45,  navidad: 90  },
  'Restaurantes y Cafeterías':               { buenFin: 20,  hotSale: 10,  navidad: 55  },
  'Supermercados y Abarrotes':               { buenFin: 30,  hotSale: 15,  navidad: 65  },
  'Farmacias y Salud':                       { buenFin: 40,  hotSale: 20,  navidad: 45  },
  'Electrónica y Tecnología':                { buenFin: 110, hotSale: 100, navidad: 130 },
  'Joyería y Accesorios':                    { buenFin: 130, hotSale: 35,  navidad: 180 },
  'Servicios Médicos y Dentales':            { buenFin: 5,   hotSale: 5,   navidad: 10  },
  'Hoteles y Hospedaje':                     { buenFin: 25,  hotSale: 40,  navidad: 85  },
  'Educación y Academias':                   { buenFin: 10,  hotSale: 8,   navidad: 5   },
  'Gimnasios y Bienestar':                   { buenFin: 15,  hotSale: 12,  navidad: 15  },
  'Salones de Belleza y Estética':           { buenFin: 20,  hotSale: 10,  navidad: 40  },
  'Ferretería y Materiales de Construcción': { buenFin: 15,  hotSale: 10,  navidad: 20  },
  'Automotriz y Refaccionarias':             { buenFin: 10,  hotSale: 8,   navidad: 15  },
  'Veterinarias':                            { buenFin: 8,   hotSale: 6,   navidad: 12  },
  'Entretenimiento y Ocio':                  { buenFin: 35,  hotSale: 25,  navidad: 70  },
  'Gasolineras':                             { buenFin: 8,   hotSale: 5,   navidad: 12  },
  'E-commerce / Ventas en Línea':            { buenFin: 160, hotSale: 130, navidad: 170 },
  'Servicios Profesionales':                 { buenFin: 5,   hotSale: 5,   navidad: 5   },
  'Ópticas':                                 { buenFin: 25,  hotSale: 15,  navidad: 35  },
  'Muebles y Decoración del Hogar':          { buenFin: 65,  hotSale: 50,  navidad: 85  },
  'Deportes y Artículos Deportivos':         { buenFin: 45,  hotSale: 35,  navidad: 55  },
  'Otro / General':                          { buenFin: 40,  hotSale: 25,  navidad: 55  },
}

export function getSeasonality(industry: string): IndustrySeasonality {
  return SEASONALITY_BY_INDUSTRY[industry] ?? SEASONALITY_BY_INDUSTRY['Otro / General']
}

// ─── Industry defaults (for "no seller data" mode) ────────────────────────────

export interface IndustryDefaults {
  tpvMonthly:  number
  ticketAvg:   number
  tdShare:     number
  tcShare:     number
  amexShare:   number
  msi3Share:   number
  msi6Share:   number
  msi9Share:   number
  tcIntShare:  number
  tdIntShare:  number
}

export const INDUSTRY_DEFAULTS: Record<string, IndustryDefaults> = {
  'Retail / Tiendas de Ropa y Moda':        { tpvMonthly: 3500000,  ticketAvg: 580,  tdShare: 35, tcShare: 42, amexShare: 5,  msi3Share: 12, msi6Share: 4,  msi9Share: 1, tcIntShare: 1, tdIntShare: 0 },
  'Restaurantes y Cafeterías':               { tpvMonthly: 2800000,  ticketAvg: 320,  tdShare: 48, tcShare: 38, amexShare: 4,  msi3Share: 8,  msi6Share: 1,  msi9Share: 0, tcIntShare: 1, tdIntShare: 0 },
  'Supermercados y Abarrotes':               { tpvMonthly: 8000000,  ticketAvg: 420,  tdShare: 55, tcShare: 35, amexShare: 3,  msi3Share: 5,  msi6Share: 1,  msi9Share: 0, tcIntShare: 0, tdIntShare: 0 },
  'Farmacias y Salud':                       { tpvMonthly: 4500000,  ticketAvg: 280,  tdShare: 58, tcShare: 32, amexShare: 3,  msi3Share: 5,  msi6Share: 1,  msi9Share: 0, tcIntShare: 0, tdIntShare: 0 },
  'Electrónica y Tecnología':                { tpvMonthly: 6000000,  ticketAvg: 1800, tdShare: 22, tcShare: 38, amexShare: 5,  msi3Share: 18, msi6Share: 10, msi9Share: 4, tcIntShare: 2, tdIntShare: 1 },
  'Joyería y Accesorios':                    { tpvMonthly: 2200000,  ticketAvg: 2400, tdShare: 18, tcShare: 40, amexShare: 10, msi3Share: 15, msi6Share: 10, msi9Share: 5, tcIntShare: 2, tdIntShare: 0 },
  'Servicios Médicos y Dentales':            { tpvMonthly: 1800000,  ticketAvg: 850,  tdShare: 45, tcShare: 38, amexShare: 5,  msi3Share: 8,  msi6Share: 3,  msi9Share: 1, tcIntShare: 0, tdIntShare: 0 },
  'Hoteles y Hospedaje':                     { tpvMonthly: 5000000,  ticketAvg: 2200, tdShare: 30, tcShare: 42, amexShare: 8,  msi3Share: 8,  msi6Share: 4,  msi9Share: 2, tcIntShare: 5, tdIntShare: 2 },
  'Educación y Academias':                   { tpvMonthly: 1200000,  ticketAvg: 3500, tdShare: 42, tcShare: 40, amexShare: 3,  msi3Share: 8,  msi6Share: 5,  msi9Share: 2, tcIntShare: 0, tdIntShare: 0 },
  'Gimnasios y Bienestar':                   { tpvMonthly: 900000,   ticketAvg: 650,  tdShare: 48, tcShare: 38, amexShare: 4,  msi3Share: 8,  msi6Share: 2,  msi9Share: 0, tcIntShare: 0, tdIntShare: 0 },
  'Salones de Belleza y Estética':           { tpvMonthly: 600000,   ticketAvg: 380,  tdShare: 55, tcShare: 35, amexShare: 3,  msi3Share: 5,  msi6Share: 1,  msi9Share: 0, tcIntShare: 0, tdIntShare: 0 },
  'Ferretería y Materiales de Construcción': { tpvMonthly: 3200000,  ticketAvg: 720,  tdShare: 50, tcShare: 35, amexShare: 3,  msi3Share: 8,  msi6Share: 3,  msi9Share: 1, tcIntShare: 0, tdIntShare: 0 },
  'Automotriz y Refaccionarias':             { tpvMonthly: 2500000,  ticketAvg: 950,  tdShare: 45, tcShare: 38, amexShare: 4,  msi3Share: 8,  msi6Share: 3,  msi9Share: 1, tcIntShare: 0, tdIntShare: 0 },
  'Veterinarias':                            { tpvMonthly: 800000,   ticketAvg: 480,  tdShare: 52, tcShare: 36, amexShare: 3,  msi3Share: 6,  msi6Share: 2,  msi9Share: 0, tcIntShare: 0, tdIntShare: 0 },
  'Entretenimiento y Ocio':                  { tpvMonthly: 2000000,  ticketAvg: 520,  tdShare: 40, tcShare: 42, amexShare: 5,  msi3Share: 8,  msi6Share: 3,  msi9Share: 1, tcIntShare: 1, tdIntShare: 0 },
  'Gasolineras':                             { tpvMonthly: 12000000, ticketAvg: 600,  tdShare: 70, tcShare: 25, amexShare: 3,  msi3Share: 1,  msi6Share: 0,  msi9Share: 0, tcIntShare: 0, tdIntShare: 1 },
  'E-commerce / Ventas en Línea':            { tpvMonthly: 4500000,  ticketAvg: 680,  tdShare: 28, tcShare: 48, amexShare: 6,  msi3Share: 10, msi6Share: 6,  msi9Share: 4, tcIntShare: 3, tdIntShare: 1 },
  'Servicios Profesionales':                 { tpvMonthly: 1500000,  ticketAvg: 4500, tdShare: 38, tcShare: 42, amexShare: 8,  msi3Share: 6,  msi6Share: 4,  msi9Share: 2, tcIntShare: 1, tdIntShare: 0 },
  'Ópticas':                                 { tpvMonthly: 1200000,  ticketAvg: 1800, tdShare: 42, tcShare: 40, amexShare: 5,  msi3Share: 8,  msi6Share: 4,  msi9Share: 1, tcIntShare: 0, tdIntShare: 0 },
  'Muebles y Decoración del Hogar':          { tpvMonthly: 2800000,  ticketAvg: 3200, tdShare: 28, tcShare: 40, amexShare: 5,  msi3Share: 15, msi6Share: 8,  msi9Share: 4, tcIntShare: 1, tdIntShare: 0 },
  'Deportes y Artículos Deportivos':         { tpvMonthly: 2000000,  ticketAvg: 820,  tdShare: 38, tcShare: 42, amexShare: 5,  msi3Share: 10, msi6Share: 4,  msi9Share: 1, tcIntShare: 1, tdIntShare: 0 },
  'Otro / General':                          { tpvMonthly: 3000000,  ticketAvg: 500,  tdShare: 43, tcShare: 41, amexShare: 4,  msi3Share: 10, msi6Share: 2,  msi9Share: 0, tcIntShare: 0, tdIntShare: 0 },
}

export function getIndustryDefaults(industry: string): IndustryDefaults | null {
  return INDUSTRY_DEFAULTS[industry] ?? null
}
