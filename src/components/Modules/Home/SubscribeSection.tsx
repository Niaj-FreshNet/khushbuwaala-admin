import NewsletterForm from "@/components/Shared/Newsletter"
import { SectionTitle } from "./SectionTitle"

export function SubscribeSection() {
  return (
    <section
      className="mx-auto w-full max-w-7xl 2xl:max-w-384 3xl:max-w-[1800px] px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4 lg:pt-6"
      aria-labelledby="newsletter-heading">
      <div className="max-w-5xl mx-auto rounded-xl border border-rose-100 bg-linear-to-br from-rose-50/70 via-white to-pink-50/60 p-6 sm:p-10 shadow-sm">
        <SectionTitle
          title="Get Exclusive Offers"
          className="mb-2 sm:mb-4"
        />

        <div className="max-w-xl mx-auto">
          <NewsletterForm />
          <p className="text-xs text-gray-500 text-center">
            By subscribing, you agree to receive emails from Khushbuwaala. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  )
}
