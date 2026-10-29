"use client"

import { useRef } from "react"
import { motion, useInView, useReducedMotion, Variants } from "framer-motion"
import { CategoryCard } from "./CategoryCard"

type CategoryItem = {
    CategoryName: string
    CategoryImage: string
    CategoryLink: string
    description?: string
}

export function CategoryGridClient({ categories }: { categories: CategoryItem[] }) {
    const reduce = useReducedMotion()
    const wrapRef = useRef<HTMLDivElement | null>(null)
    const inView = useInView(wrapRef, { amount: 0.2, once: true })

    const container: Variants = reduce
        ? { hidden: {}, show: {} }
        : {
            hidden: {},
            show: {
                transition: { staggerChildren: 0.08, delayChildren: 0.05 },
            },
        }

    const item: Variants = reduce
        ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
        : {
            hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
            show: {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                transition: { duration: 0.55, ease: "easeOut" },
            },
        }

    return (
        <motion.div
            ref={wrapRef}
            variants={container}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            className="grid grid-cols-2 sm:grid-cols-6 gap-0 sm:gap-0 lg:gap-0"
        >
            {categories.map((category) => (
                <motion.div key={category.CategoryName} variants={item}>
                    <CategoryCard
                        CategoryName={category.CategoryName}
                        CategoryImage={category.CategoryImage}
                        CategoryLink={category.CategoryLink}
                        description={category.description ?? "Explore this premium fragrance collection."}
                    />
                </motion.div>
            ))}
        </motion.div>
    )
}
