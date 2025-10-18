"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

import { ShimmeringText } from "@/components/ui/shimmering-text"

const phrases = [
  "Thinking...",
  "Just a moment...",
  "Let me check on that...",
  "Putting my thoughts together...",
  "Connecting the dots...",
  "Almost there...",
]

export function ThinkingIndicator() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % phrases.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <ShimmeringText text={phrases[currentIndex]} />
      </motion.div>
    </AnimatePresence>
  )
}
