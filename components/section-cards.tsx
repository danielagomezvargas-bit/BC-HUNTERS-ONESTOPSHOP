import { TrendingDown, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const cards = [
  {
    title: "Propuestas Generadas",
    value: "34",
    trend: "+12.5%",
    trendUp: true,
    footer: "vs mes anterior",
    description: "Este mes",
  },
  {
    title: "GMV Potencial",
    value: "$399.3M",
    trend: "+8.2%",
    trendUp: true,
    footer: "sobre propuestas activas",
    description: "Acumulado activo",
  },
  {
    title: "TDR Promedio",
    value: "2.43%",
    trend: "-0.2pp",
    trendUp: false,
    footer: "frente a benchmark industria",
    description: "Último trimestre",
  },
  {
    title: "Comisión Estimada",
    value: "$8.8M",
    trend: "+18.7%",
    trendUp: true,
    footer: "en propuestas cerradas",
    description: "Mes en curso",
  },
]

export function SectionCards() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:from-primary/10 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} data-slot="card">
          <CardHeader className="relative">
            <CardDescription>{card.description}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {card.value}
            </CardTitle>
            <div className="absolute right-4 top-4">
              <Badge
                variant="outline"
                className={
                  card.trendUp
                    ? "gap-1 border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "gap-1 border-rose-200 bg-rose-50 text-rose-700"
                }
              >
                {card.trendUp ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {card.trend}
              </Badge>
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1 text-sm">
            <div className="font-medium">{card.title}</div>
            <div className="text-muted-foreground">{card.footer}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
