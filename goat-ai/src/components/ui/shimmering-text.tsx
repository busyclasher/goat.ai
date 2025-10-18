"use client"

import { cn } from "@/lib/utils"

interface ShimmeringTextProps {
  text: string
  className?: string
}

export function ShimmeringText({ text, className }: ShimmeringTextProps) {
  return (
    <p
      className={cn(
        "bg-gradient-to-r from-gray-500 via-gray-700 to-gray-500 bg-[length:200%_100%] bg-clip-text text-sm text-transparent animate-shimmer [animation-duration:2s]",
        className,
      )}
    >
      {text}
    </p>
  )
}
