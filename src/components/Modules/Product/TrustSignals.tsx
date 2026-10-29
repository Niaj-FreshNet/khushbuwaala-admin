import React from "react";
import {
  Shield,
  Truck,
  RotateCcw,
  Award,
  Star,
  CheckCircle,
  Phone,
  MessageSquare,
  Clock,
} from "lucide-react";

const TrustSignals = () => {
  const trustFeatures = [
    {
      icon: Clock,
      title: "Since 2020",
      description: "6+ years of trust",
      bgColor: "bg-slate-50",
      iconColor: "text-slate-700",
      borderColor: "border-slate-200",
    },
    {
      icon: Shield,
      title: "100% Authentic",
      description: "Genuine products only",
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
      borderColor: "border-emerald-200",
    },
    {
      icon: Truck,
      title: "Fast Delivery",
      description: "1–2 days in Dhaka",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200",
    },
    {
      icon: RotateCcw,
      title: "Easy Returns",
      description: "7-day return policy",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      borderColor: "border-purple-200",
    },
    {
      icon: Award,
      title: "Premium Quality",
      description: "Long-lasting fragrances",
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
      borderColor: "border-amber-200",
    },
    {
      icon: CheckCircle,
      title: "Secure Payment",
      description: "Safe & secure checkout",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      borderColor: "border-green-200",
    },
  ];

  const customerStats = [
    { number: "Since 2020", label: "Serving customers", icon: Clock, color: "text-sky-400" },
    { number: "99%", label: "Satisfaction Rate", icon: MessageSquare, color: "text-blue-600" },
    { number: "4.8/5", label: "Customer rating", icon: CheckCircle, color: "text-emerald-400" },
    { number: "Repeat Customers", label: "Our biggest strength", icon: Award, color: "text-purple-400" },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Trust Features Grid */}
      {/* <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
        {trustFeatures.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <div
              key={index}
              className={`${feature.bgColor} ${feature.borderColor} border rounded-2xl p-3 sm:p-4 text-center hover:shadow-md transition-all duration-300`}
            >
              <div className="flex justify-center mb-2 sm:mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/70 rounded-full flex items-center justify-center shadow-sm border border-white/60">
                  <IconComponent className={`w-5 h-5 sm:w-6 sm:h-6 ${feature.iconColor}`} />
                </div>
              </div>

              <h3 className="font-bold text-gray-900 text-xs sm:text-sm mb-1">
                {feature.title}
              </h3>

              <p className="text-[11px] sm:text-xs text-gray-600 leading-snug hidden sm:block">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div> */}

      {/* Customer Statistics */}
      {/* <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-5 sm:p-8 text-white">
        <div className="text-center mb-5 sm:mb-8">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
            Trusted Since 2020
          </h3>
          <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
            Over the years, our customers have returned again and again for one simple reason:
            authentic fragrance, consistent quality, and reliable service.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {customerStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-2 sm:mb-3">
                  <IconComponent className={`w-7 h-7 sm:w-8 sm:h-8 ${stat.color}`} />
                </div>
                <div className="text-lg sm:text-2xl md:text-3xl font-bold mb-1">
                  {stat.number}
                </div>
                <div className="text-xs sm:text-sm text-gray-300">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-300">
          ⭐ Most of our growth comes from repeat customers & referrals — thank you for trusting Khushbuwaala.
        </p>
      </div> */}

      {/* Contact Section */}
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200">
        <div className="text-center">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 sm:mb-3">
            Need Help Choosing?
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-4">
            Tell us what you like — we’ll recommend the perfect scent for you.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="tel:+8801777152588"
              className="inline-flex items-center justify-center px-6 py-1.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200"
            >
              <Phone className="w-5 h-5 mr-2" />
              Call Us
            </a>

            <a
              href="https://wa.me/8801777152588"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-1.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors duration-200"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustSignals;
