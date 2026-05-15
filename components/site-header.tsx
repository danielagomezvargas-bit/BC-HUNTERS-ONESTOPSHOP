"use client"

import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/": "Nueva Propuesta",
  "/benchmark": "Benchmark",
  "/simulator/summary": "One Pager",
}

export function SiteHeader() {
  const pathname = usePathname()
  const title = titles[pathname] ?? "Business Case"

  return (
    <header className="flex h-[var(--header-height)] shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <span className="text-sm font-medium">{title}</span>
      </div>
    </header>
  )
}
