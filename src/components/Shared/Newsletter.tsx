"use client"

import { useState } from "react"
import { ArrowRight, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion, useReducedMotion } from "framer-motion"

export default function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [success, setSuccess] = useState(false)
  const reduce = useReducedMotion()

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubscribing(true)
    setSuccess(false)

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setEmail("")
        setSuccess(true)
        setTimeout(() => setSuccess(false), 2500)
      }
    } catch (error) {
      console.error("Newsletter subscription failed:", error)
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
    <div className="w-full -mb-4">
      <form
        onSubmit={handleNewsletterSubmit}
        className="flex items-center w-full bg-white shadow-sm border border-rose-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-rose-400 transition-all"
      >
        <div className="pl-4 text-rose-500">
          <Mail className="h-5 w-5" />
        </div>

        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 h-12 text-sm md:text-base placeholder:text-gray-400"
          aria-label="Email address for newsletter"
        />

        <Button
          type="submit"
          disabled={isSubscribing}
          className="h-12 px-6 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isSubscribing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Subscribing...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              Subscribe
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </Button>
      </form>

      {/* ✅ Small success line that feels alive */}
      {!reduce && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={success ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
          transition={{ duration: 0.25 }}
          className="mt-3 text-sm text-emerald-600 text-center"
        >
          You’re subscribed! Watch out for exclusive offers ✨
        </motion.div>
      )}

      {reduce && success && (
        <div className="mt-3 text-sm text-emerald-600 text-center">
          You’re subscribed! Watch out for exclusive offers ✨
        </div>
      )}
    </div>
  )
}
