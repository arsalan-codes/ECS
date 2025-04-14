"use client"

import * as React from "react"

interface ThemeProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  defaultTheme?: "dark" | "light" | "system"
  storageKey?: string
}

export function ThemeProvider({
  children,
  ...props
}: ThemeProviderProps) {
  return <>{children}</>
}
