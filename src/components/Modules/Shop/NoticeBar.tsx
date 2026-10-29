"use client"

import { useState, useEffect } from "react"
import { Sparkles } from "lucide-react"

interface NoticeBarProps {
  heading: string
  notices?: string[]
  interval?: number
}

export function NoticeBar({ heading, notices = [], interval = 3000 }: NoticeBarProps) {
  const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0)

  useEffect(() => {
    if (notices.length > 0) {
      const intervalId = setInterval(() => {
        setCurrentNoticeIndex((prevIndex) => (prevIndex + 1) % notices.length)
      }, interval)
      return () => clearInterval(intervalId)
    }
  }, [notices, interval])

  return (
    <div className="bg-linear-to-r from-red-50 to-pink-50 pt-6 pb-2 px-4 text-center overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl md:text-3xl font-extrabold text-gray-900 mb-0.5 flex items-center justify-center gap-3">
          {heading}
        </h2>
        {notices.length > 0 && (
          <p className="text-xs md:text-sm text-gray-700 transition-opacity duration-500 ease-in-out h-6 flex items-center justify-center">
            {notices[currentNoticeIndex]}
          </p>
        )}
      </div>
    </div>
  )
}
