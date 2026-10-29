"use client";
import React, { useState } from "react";
import { Star, User, ThumbsUp, MessageCircle, Truck, Shield, Info, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductTabsProps {
  product: {
    _id: string;
    name: string;
    description?: string;
    notes?: string;
    specification?: string;
    origin?: string;
    brand?: string;
    measurement?: string;
    category: string;
  };
}

// Mock reviews data - in a real app, this would come from your database
const mockReviews = [
  {
    id: 1,
    name: "Aminul Islam",
    rating: 5,
    date: "2024-01-15",
    comment: "Outstanding fragrance! The longevity is amazing and the projection is perfect. I get compliments every time I wear it. Highly recommended for special occasions.",
    verified: true,
    helpful: 12
  },
  {
    id: 2,
    name: "Fatima Rahman", 
    rating: 4,
    date: "2024-01-10",
    comment: "Really nice scent, very elegant and sophisticated. The only reason I'm giving 4 stars instead of 5 is that I wish it lasted a bit longer on my skin.",
    verified: true,
    helpful: 8
  },
  {
    id: 3,
    name: "Mohammed Hassan",
    rating: 5,
    date: "2024-01-08",
    comment: "Excellent quality perfume oil. The fragrance is exactly as described and the packaging was perfect. Will definitely order again!",
    verified: true,
    helpful: 15
  },
  {
    id: 4,
    name: "Nusrat Jahan",
    rating: 5,
    date: "2024-01-05",
    comment: "This is my third purchase from Khushbuwaala and they never disappoint. The scent is beautiful and lasts all day. Fast delivery too!",
    verified: true,
    helpful: 9
  }
];

export default function ProductTabs({ product }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState("description");

  const tabs = [
    {
      id: "description",
      label: "Description",
      icon: <Info className="h-4 w-4" />
    },
    {
      id: "specifications",
      label: "Specifications", 
      icon: <Sparkles className="h-4 w-4" />
    },
    {
      id: "reviews",
      label: "Reviews",
      icon: <Star className="h-4 w-4" />,
      badge: mockReviews.length
    },
    {
      id: "shipping",
      label: "Shipping & Returns",
      icon: <Truck className="h-4 w-4" />
    }
  ];

  const renderDescription = () => (
    <div className="space-y-6">
      <div className="prose prose-gray max-w-none">
        <div className="text-gray-700 leading-relaxed whitespace-pre-line">
          {product.description || "Premium quality perfume oil with exceptional longevity and projection. Carefully crafted with the finest ingredients to create a memorable fragrance experience."}
        </div>
      </div>
      
      {product.notes && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-100 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-red-600" />
            Fragrance Notes
          </h3>
          <div className="text-gray-700 leading-relaxed">
            {product.notes.split('\n').map((note, index) => (
              <div key={index} className="mb-2">
                {note.trim() && (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                    {note.trim()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSpecifications = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Product Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Category:</span>
              <span className="font-medium capitalize">
                {product.category === 'inspiredPerfumeOil' ? 'Inspired Perfume Oil' : product.category}
              </span>
            </div>
            {product.brand && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Brand:</span>
                <span className="font-medium">{product.brand}</span>
              </div>
            )}
            {product.origin && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Origin:</span>
                <span className="font-medium">{product.origin}</span>
              </div>
            )}
            {product.measurement && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Available Sizes:</span>
                <span className="font-medium">3ml, 6ml, 12ml, 25ml</span>
              </div>
            )}
            {product.specification && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Gender:</span>
                <span className="font-medium capitalize">{product.specification}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Product Features</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Shield className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <div className="font-medium text-green-800">100% Authentic</div>
                <div className="text-sm text-green-600">Original quality guaranteed</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div>
                <div className="font-medium text-blue-800">Long Lasting</div>
                <div className="text-sm text-blue-600">8-12 hours duration</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <Star className="h-5 w-5 text-purple-600 flex-shrink-0" />
              <div>
                <div className="font-medium text-purple-800">Premium Quality</div>
                <div className="text-sm text-purple-600">Tested & certified</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReviews = () => (
    <div className="space-y-6">
      {/* Reviews Summary */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                ))}
              </div>
              <span className="text-xl font-bold">4.8</span>
              <span className="text-gray-600">out of 5</span>
            </div>
            <div className="text-sm text-gray-600">{mockReviews.length} verified reviews</div>
          </div>
          <Button variant="outline" className="bg-white">
            Write a Review
          </Button>
        </div>
        
        {/* Rating Breakdown */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = mockReviews.filter(r => r.rating === rating).length;
            const percentage = (count / mockReviews.length) * 100;
            return (
              <div key={rating} className="flex items-center gap-3 text-sm">
                <span className="w-8">{rating}★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="w-12 text-gray-600">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual Reviews */}
      <div className="space-y-4">
        {mockReviews.map((review) => (
          <div key={review.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {review.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{review.name}</span>
                    {review.verified && (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        <Shield className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={cn(
                            "h-4 w-4",
                            i < review.rating ? "text-yellow-500 fill-current" : "text-gray-300"
                          )} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">{review.date}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-gray-700 leading-relaxed mb-3">{review.comment}</p>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <button className="flex items-center gap-1 hover:text-gray-700 transition-colors">
                <ThumbsUp className="h-4 w-4" />
                Helpful ({review.helpful})
              </button>
              <button className="flex items-center gap-1 hover:text-gray-700 transition-colors">
                <MessageCircle className="h-4 w-4" />
                Reply
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderShipping = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Shipping Information</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Truck className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Free Shipping</div>
                <div className="text-sm text-gray-600">On orders over ৳1000 within Bangladesh</div>
              </div>
            </div>
            <div className="flex gap-4">
              <Shield className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Secure Packaging</div>
                <div className="text-sm text-gray-600">Carefully packaged to prevent damage</div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Delivery Timeline</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Dhaka: 1-2 business days</li>
                <li>• Other major cities: 2-3 business days</li>
                <li>• Rural areas: 3-5 business days</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Returns & Refunds</h3>
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 mb-2">7-Day Return Policy</h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Return within 7 days of delivery</li>
                <li>• Product must be unused and in original packaging</li>
                <li>• Free return for defective products</li>
              </ul>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Money Back Guarantee</h4>
              <p className="text-sm text-green-800">
                If you&apos;re not completely satisfied with your purchase, we&apos;ll refund your money within 3-5 business days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "description":
        return renderDescription();
      case "specifications":
        return renderSpecifications();
      case "reviews":
        return renderReviews();
      case "shipping":
        return renderShipping();
      default:
        return renderDescription();
    }
  };

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200",
                activeTab === tab.id
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.badge && (
                <span className="ml-1 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {renderTabContent()}
      </div>
    </div>
  );
}