import type { Metadata } from 'next'
import './globals.css'
import { Agentation } from 'agentation'

export const metadata: Metadata = {
  title: 'Business Case Simulator — Mercado Pago',
  description: 'Genera propuestas de valor personalizadas para clientes',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-background min-h-screen">
        {children}
        {process.env.NODE_ENV === 'development' && <Agentation />}
      </body>
    </html>
  )
}
