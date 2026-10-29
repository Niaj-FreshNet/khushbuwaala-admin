import { SectionTitle } from "./SectionTitle"
import { ReviewsGridClient } from "./ReviewsGridClient"

const REVIEWS = [
  {
    image: "/images/reviews1.webp",
    facebook: "https://www.facebook.com/khushbuwaala",
    instagram: "https://www.instagram.com/khushbuwaala_perfumes",
    youtube: "https://www.youtube.com/@khushbuwaala_perfumes",
  },
  {
    image: "/images/reviews2.webp",
    instagram: "https://www.instagram.com/khushbuwaala_perfumes",
    youtube: "https://www.youtube.com/@khushbuwaala_perfumes",
  },
  {
    image: "/images/reviews3.webp",
    facebook: "https://www.facebook.com/khushbuwaala",
  },
  {
    image: "/images/reviews4.webp",
    instagram: "https://www.instagram.com/khushbuwaala_perfumes",
  },
]


export function ReviewsSection() {
  return (
    <section
      className="mx-auto w-full max-w-7xl 2xl:max-w-384 3xl:max-w-[1800px] px-3 sm:px-6 lg:px-8"
      aria-labelledby="reviews-heading">
      <SectionTitle
        title="Inspired by Our Customers"
        className="mt-6 sm:mt-8 lg:mt-10 mb-2 sm:mb-4"
      />

      <ReviewsGridClient items={REVIEWS} />
    </section>
  )
}
