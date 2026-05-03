import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: "Contenido vacío" }, { status: 400 });
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `Eres un extractor de datos para un sistema de benchmark de comisiones de Mercado Pago.

Analiza el siguiente contenido de un ejercicio de monetización y extrae la información estructurada.

Responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin bloques de código:
{
  "seller": "nombre del seller",
  "rfc": "RFC si existe, sino cadena vacía",
  "industria": "una de: Retail / Moda, Restaurantes / Food & Bev, Supermercados / Grocery, Salud / Farmacia, Electrónica / Tech, Educación, Viajes / Turismo, Servicios Profesionales, Construcción / Ferretería, Entretenimiento / Ocio, Automotriz, Otro",
  "producto": "Point o Online Payments",
  "proveedor": "nombre del banco o proveedor actual",
  "tpv": numero_mensual_sin_simbolos_o_null,
  "ticket": numero_promedio_sin_simbolos_o_null,
  "hunter": "nombre del hunter si aparece, sino cadena vacía",
  "tasas": {
    "td": numero_o_null,
    "tc": numero_o_null,
    "amex": numero_o_null,
    "intl": numero_o_null
  },
  "tasas_mp": {
    "td": numero_o_null,
    "tc": numero_o_null,
    "amex": numero_o_null,
    "intl": numero_o_null
  },
  "msi": {
    "3x":  { "ba": numero, "sb": numero } o null,
    "6x":  { "ba": numero, "sb": numero } o null,
    "9x":  { "ba": numero, "sb": numero } o null,
    "12x": { "ba": numero, "sb": numero } o null,
    "18x": { "ba": numero, "sb": numero } o null,
    "24x": { "ba": numero, "sb": numero } o null
  },
  "msi_mp": {
    "3x":  { "ba": numero, "sb": numero } o null,
    "6x":  { "ba": numero, "sb": numero } o null,
    "9x":  { "ba": numero, "sb": numero } o null,
    "12x": { "ba": numero, "sb": numero } o null,
    "18x": { "ba": numero, "sb": numero } o null,
    "24x": { "ba": numero, "sb": numero } o null
  },
  "notas_ia": "resumen breve: qué encontraste, qué campos no pudiste extraer y por qué"
}

Reglas:
- Las tasas deben estar en porcentaje (ej: 1.67 no 0.0167)
- En msi: ba = tasa base (generalmente = tc del seller), sb = sobretasa
- Si no puedes determinar un valor con certeza, usa null
- El JSON debe ser parseable con JSON.parse() sin ningún procesamiento adicional

CONTENIDO DEL EJERCICIO:
${content}`,
        }],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    const raw = data.content?.find((c: any) => c.type === "text")?.text || "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json({ parsed });
  } catch (err: any) {
    console.error("[interpret-exercise]", err);
    return NextResponse.json(
      { error: err.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
