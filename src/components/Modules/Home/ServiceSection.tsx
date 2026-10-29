"use client"

import { Package, LifeBuoy, RefreshCcw, Lock } from "lucide-react"
import { SectionTitle } from "./SectionTitle"
import { motion, useReducedMotion } from "framer-motion"

export function ServicesSection() {
  const reduce = useReducedMotion()

  const services = [
    {
      title: "Fast Delivery",
      description: "Free delivery on orders over 1000 BDT (selected areas).",
      icon: <Package className="h-5 w-5 sm:h-6 sm:w-6" />,
    },
    {
      title: "Support 24/7",
      description: "Chat or call anytime — we’re always here to help.",
      icon: <LifeBuoy className="h-5 w-5 sm:h-6 sm:w-6" />,
    },
    {
      title: "Easy Exchange",
      description: "Hassle-free exchange within 7 days (terms apply).",
      icon: <RefreshCcw className="h-5 w-5 sm:h-6 sm:w-6" />,
    },
    {
      title: "Secure Payment",
      description: "Trusted checkout with encrypted transactions.",
      icon: <Lock className="h-5 w-5 sm:h-6 sm:w-6" />,
    },
  ]

  return (
    <section
      className="mx-auto w-full max-w-7xl 2xl:max-w-384 3xl:max-w-[1800px] px-3 sm:px-6 lg:px-8"
      aria-labelledby="services-heading"
    >
      <SectionTitle
        title="Why Choose Khushbuwaala"
        className="mt-6 sm:mt-8 lg:mt-10 mb-2 sm:mb-4"
      />

      <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {services.map((service, index) => (
          <motion.div
            key={index}
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 14 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={reduce ? undefined : { duration: 0.4, ease: "easeOut", delay: index * 0.05 }}
            whileHover={reduce ? undefined : { y: -3 }}
            className="group rounded-xl border border-emerald-200/80 bg-white shadow-2xs hover:shadow-md transition-all"
          >
            <div className="p-3 sm:p-4 flex flex-col items-center sm:items-start text-center sm:text-left h-full">
              {/* Icon badge */}
              <div className="shrink-0 rounded-xl bg-linear-to-br from-rose-50 to-pink-50 border border-rose-100 p-2 sm:p-2.5 text-emerald-600 group-hover:scale-105 transition-transform mb-2 sm:mb-3">
                {service.icon}
              </div>

              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug">
                  {service.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-500 mt-1 leading-normal">
                  {service.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}