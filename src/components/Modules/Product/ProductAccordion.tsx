// src/components/ProductAccordion.tsx

"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  Star,
  Truck,
  Clock,
  Sparkles,
  Banknote,
  Eye,
  RotateCcw,
  Send,
  Wind,
  Layers,
  ShieldCheck,
  Camera,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { IProduct, IReview } from "@/types/product.types";
import {
  useGetProductReviewsQuery,
  useCreateReviewMutation,
} from "@/redux/store/api/review/reviewApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/redux/store/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ExtendedReview extends IReview {
  title?: string;
  imageUrl?: string;
  user?: {
    id?: string;
    name?: string;
    imageUrl?: string;
    image?: string;
    avatar?: string;
  } | null;
}

interface ProductAccordionProps {
  product: Partial<IProduct> & {
    sillage?: string;
    accords?: string | string[];
    bestFor?: string | string[];
    origin?: string;
    longevity?: string;
    performance?: string;
    projection?: string;
    brand?: string;
    gender?: string;
  };
  initialOpenSection?: string;
}

const parseStringList = (input?: string | string[]): string[] => {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter(Boolean);
  if (input.includes(",")) {
    return input.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return input.replace(/([A-Z])/g, " $1").trim().split(" ").filter(Boolean);
};

const getLongevityDetails = (val?: string) => {
  const norm = (val || "").toUpperCase().replace(/[^A_Z]/g, "_");
  switch (norm) {
    case "BEAST_MODE":
    case "ETERNAL":
    case "ULTRA":
      return { label: "Ultra Lasting", hours: "12+ Hours", percent: 100, badge: "Extreme" };
    case "EXCELLENT":
    case "LONG_LASTING":
      return { label: "Long Lasting", hours: "8–10 Hours", percent: 80, badge: "High" };
    case "GOOD":
    case "GOOD_LASTING":
      return { label: "Good Lasting", hours: "5–6 Hours", percent: 65, badge: "Medium" };
    case "MODERATE":
      return { label: "Moderate", hours: "3–5 Hours", percent: 50, badge: "Daily" };
    case "WEAK":
    case "LIGHT":
    case "VERY_WEAK":
      return { label: "Light", hours: "1–3 Hours", percent: 30, badge: "Soft" };
    default:
      return { label: "Moderate", hours: "4–6 Hours", percent: 60, badge: "Standard" };
  }
};

const getProjectionDetails = (val?: string) => {
  const norm = (val || "").toUpperCase().replace(/[^A_Z]/g, "_");
  switch (norm) {
    case "NUCLEAR":
    case "ENORMOUS":
      return { label: "Nuclear", distance: "10+ Feet (Room Filler)", percent: 100 };
    case "STRONG":
      return { label: "Strong", distance: "7–9 Feet (Noticeable Trail)", percent: 80 };
    case "MODERATE":
      return { label: "Moderate", distance: "4–6 Feet (Arm's Length)", percent: 60 };
    case "INTIMATE":
    case "CLOSE":
      return { label: "Intimate", distance: "1–2 Feet (Close to Skin)", percent: 35 };
    default:
      return { label: "Moderate", distance: "4–6 Feet (Arm's Length)", percent: 60 };
  }
};

const getInitialBgColor = (name: string) => {
  const colors = [
    "bg-emerald-100 text-emerald-800 border-emerald-200",
    "bg-blue-100 text-blue-800 border-blue-200",
    "bg-amber-100 text-amber-800 border-amber-200",
    "bg-rose-100 text-rose-800 border-rose-200",
    "bg-purple-100 text-purple-800 border-purple-200",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return colors[Math.abs(hash) % colors.length];
};

const AccordionItem = ({
  title,
  children,
  icon: Icon,
  isOpen,
  onToggle,
  badge,
  "data-section": dataSection,
}: {
  title: string;
  children: React.ReactNode;
  icon: React.ElementType;
  isOpen: boolean;
  onToggle: () => void;
  badge?: string;
  "data-section"?: string;
}) => (
  <div
    className={cn(
      "rounded-2xl border bg-white transition-all duration-200 overflow-hidden",
      isOpen
        ? "border-emerald-500/20 shadow-sm ring-1 ring-emerald-500/10"
        : "border-gray-200/80 hover:border-gray-300"
    )}
  >
    <button
      type="button"
      onClick={onToggle}
      data-section={dataSection}
      aria-expanded={isOpen}
      className={cn(
        "w-full flex items-center justify-between text-left px-3.5 py-2.5 sm:px-4 sm:py-3 select-none transition-colors",
        "hover:bg-gray-50/60 active:bg-gray-100/50"
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={cn(
            "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
            isOpen ? "bg-emerald-50 text-emerald-600" : "bg-gray-100/80 text-gray-500"
          )}
        >
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>

        <div className="flex items-center gap-2 truncate">
          <span className="text-xs sm:text-sm font-semibold text-gray-900 truncate tracking-tight">
            {title}
          </span>
          {badge && (
            <Badge
              variant="secondary"
              className="text-[10px] font-medium px-1.5 py-0 bg-emerald-50 text-emerald-700 border border-emerald-100/80"
            >
              {badge}
            </Badge>
          )}
        </div>
      </div>

      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 bg-gray-50 text-gray-400",
          isOpen && "rotate-180 bg-emerald-50 text-emerald-700"
        )}
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </div>
    </button>

    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="px-4 pb-4 pt-1 sm:px-5 sm:pb-5 border-t border-gray-100">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default function ProductAccordion({
  product,
  initialOpenSection = "description",
}: ProductAccordionProps) {
  const [openSection, setOpenSection] = useState<string>(initialOpenSection);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewImage, setReviewImage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [newReview, setNewReview] = useState({
    rating: 5,
    name: "",
    email: "",
    comment: "",
  });

  const { user } = useAuth();

  const { data, isLoading: loadingReviews, refetch } = useGetProductReviewsQuery(product?.id, {
    skip: !product?.id,
  });

  const reviews: ExtendedReview[] = Array.isArray(data?.data) ? data.data : [];
  const [createReview] = useCreateReviewMutation();

  const toggleSection = (section: string) => {
    setOpenSection((prev) => (prev === section ? "" : section));
  };

  useEffect(() => {
    const handler = () => setOpenSection("description");
    window.addEventListener("kw:open-description", handler);
    return () => window.removeEventListener("kw:open-description", handler);
  }, []);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length
      : 0;

  const RATING_CONFIG: Record<number, { label: string; className: string }> = {
    1: { label: "Poor", className: "text-rose-700 bg-rose-50 border-rose-200/60" },
    2: { label: "Fair", className: "text-orange-700 bg-orange-50 border-orange-200/60" },
    3: { label: "Good", className: "text-amber-700 bg-amber-50 border-amber-200/60" },
    4: { label: "Very Good", className: "text-blue-700 bg-blue-50 border-blue-200/60" },
    5: { label: "Excellent", className: "text-emerald-700 bg-emerald-50 border-emerald-200/60" },
  };

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WebP)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement("img");
      img.src = e.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const maxDim = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.75);
        setReviewImage(compressedDataUrl);
      };
    };

    reader.readAsDataURL(file);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    const reviewerName = user?.name || newReview.name.trim();
    if (!reviewerName) {
      toast.error("Your name is required to submit a review.");
      return;
    }

    if (!newReview.comment.trim()) {
      toast.error("Feedback message is required.");
      return;
    }

    setSubmitting(true);
    try {
      await createReview({
        rating: newReview.rating,
        title: reviewerName,
        comment: newReview.comment.trim(),
        productId: product.id!,
        userId: user?.id || null,
        imageUrl: reviewImage || undefined,
        email: !user && newReview.email.trim() ? newReview.email.trim() : undefined,
      } as any).unwrap();

      setNewReview({ rating: 5, name: "", email: "", comment: "" });
      setReviewImage("");
      toast.success("Thank you! Review submitted successfully.");
      await refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  const longevityInfo = getLongevityDetails(product.longevity || product.performance);
  const projectionInfo = getProjectionDetails(product.projection || product.sillage);
  const bestForList = parseStringList(product.bestFor);
  const accordsList = parseStringList(product.accords);

  const getStarPercentage = (starCount: number) => {
    if (reviews.length === 0) return 0;
    const match = reviews.filter((r) => Math.round(r.rating || 0) === starCount).length;
    return Math.round((match / reviews.length) * 100);
  };

  return (
    <div className="space-y-2 max-w-full">
      {/* Quick Navigation Top Tabs */}
      <div className="p-1 rounded-2xl bg-gray-100/80 flex gap-1.5 border border-gray-200/60 overflow-x-auto no-scrollbar">
        {[
          { id: "description", label: "Details" },
          { id: "reviews", label: `Reviews (${reviews.length})` },
          { id: "shipping", label: "Delivery & Returns" },
        ].map((sec) => (
          <button
            key={sec.id}
            type="button"
            onClick={() => toggleSection(sec.id)}
            className={cn(
              "flex-1 py-1.5 sm:py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all text-center",
              openSection === sec.id
                ? "bg-white text-emerald-800 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* 1. Description & Specifications */}
      <AccordionItem
        title="Description & Fragrance Profile"
        icon={Sparkles}
        isOpen={openSection === "description"}
        onToggle={() => toggleSection("description")}
        data-section="description"
      >
        <div className="space-y-3 pt-1">
          {/* Main Description */}
          <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-line bg-gray-50/60 p-3.5 rounded-xl border border-gray-100">
            {product.description?.toString() ||
              `Experience ${product.name || "this exquisite fragrance"}, meticulously blended with high-grade perfume oils for optimal depth, richness, and longevity.`}
          </div>

          {/* Performance & Projection Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Longevity Card */}
            <div className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-100/90 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" /> Longevity
                  </span>
                  <Badge className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 border-0 hover:bg-emerald-100">
                    {longevityInfo.badge}
                  </Badge>
                </div>
                <div className="text-sm font-bold text-gray-900 mt-1.5">
                  {longevityInfo.hours}
                  <span className="text-xs font-medium text-gray-500 ml-1.5">({longevityInfo.label})</span>
                </div>
              </div>
              <div className="mt-2.5 h-1.5 w-full rounded-full bg-emerald-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  style={{ width: `${longevityInfo.percent}%` }}
                />
              </div>
            </div>

            {/* Projection Card */}
            <div className="p-3 rounded-xl bg-blue-50/40 border border-blue-100/90 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-blue-600" /> Projection
                  </span>
                  <Badge className="text-[10px] font-semibold bg-blue-100 text-blue-800 border-0 hover:bg-blue-100">
                    {projectionInfo.label}
                  </Badge>
                </div>
                <div className="text-sm font-bold text-gray-900 mt-1.5">
                  {projectionInfo.distance}
                </div>
              </div>
              <div className="mt-2.5 h-1.5 w-full rounded-full bg-blue-100 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${projectionInfo.percent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Accords */}
          {accordsList.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
                Main Accords
              </span>
              <div className="flex flex-wrap gap-1.5">
                {accordsList.map((acc, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200/70"
                  >
                    {acc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Perfume Notes */}
          {product.perfumeNotes && typeof product.perfumeNotes === "object" && (
            <div className="rounded-xl p-3 bg-gray-50/80 border border-gray-200/80 text-xs sm:text-sm space-y-1.5">
              <span className="font-bold text-gray-900 block">Fragrance Notes:</span>
              {Object.entries(product.perfumeNotes).map(([tier, note]) => (
                <div key={tier} className="text-gray-700 flex flex-col sm:flex-row sm:gap-2">
                  <span className="font-semibold text-gray-900 capitalize min-w-[70px]">{tier}:</span>
                  <span>{Array.isArray(note) ? note.join(", ") : note}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quick Specs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-0.5">
            <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wide">Brand</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 block mt-0.5 truncate">
                {(product.brand || "Khushbuwaala")
                  .toLowerCase()
                  .replace(/(^|[\s-])\w/g, (char) => char.toUpperCase())}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wide">Origin</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 block mt-0.5 truncate">
                {product.origin || "Imported"}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wide">Gender</span>
              <span className="text-xs sm:text-sm font-semibold text-gray-900 capitalize block mt-0.5 truncate">
                {(product.gender || "Unisex").toLowerCase().replace(/^./, (char) => char.toUpperCase())}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wide mb-1">
                Best For
              </span>
              <div className="flex flex-wrap gap-1">
                {bestForList.length > 0 ? (
                  bestForList.map((item, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-white font-medium text-gray-700 border-gray-200"
                    >
                      {item}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs font-semibold text-gray-900">Versatile</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </AccordionItem>

      {/* 2. Customer Reviews Section */}
      <AccordionItem
        title="Customer Reviews"
        icon={Star}
        badge={reviews.length > 0 ? `${reviews.length}` : undefined}
        isOpen={openSection === "reviews"}
        onToggle={() => toggleSection("reviews")}
      >
        <div className="space-y-2 pt-1">
          {/* Summary & Rating Breakdown Grid */}
          <div className="p-2 sm:p-2.5 rounded-xl bg-amber-50/50 border border-amber-200/60 flex items-center justify-between gap-3">
            {/* Left: Rating Badge & Verification Summary */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <span className="text-base font-black leading-none">
                  {avgRating > 0 ? avgRating.toFixed(1) : "5.0"}
                </span>
              </div>

              <div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => {
                    const fillPercentage = Math.min(Math.max((avgRating - (s - 1)) * 100, 0), 100);

                    return (
                      <div key={s} className="relative w-3.5 h-3.5">
                        <Star className="w-3.5 h-3.5 text-gray-300 absolute inset-0" />
                        {fillPercentage > 0 && (
                          <div
                            className="overflow-hidden absolute top-0 left-0 h-full"
                            style={{ width: `${fillPercentage}%` }}
                          >
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] font-bold text-gray-900 leading-tight mt-0.5">
                  {reviews.length > 0 ? `${reviews.length} Verified Reviews` : "No reviews yet"}
                </p>
                <p className="text-[10px] text-gray-500 leading-tight">Genuine buyer feedback</p>
              </div>
            </div>

            {/* Right: Compact Rating Breakdown Progress Bars */}
            <div className="flex-1 max-w-[210px] space-y-0.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const pct = getStarPercentage(star);
                return (
                  <div key={star} className="flex items-center gap-1.5 text-[10px] leading-none">
                    <span className="w-2 font-medium text-gray-600 text-right">{star}</span>
                    <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500 shrink-0" />
                    <div className="flex-1 bg-amber-200/50 rounded-full h-1 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-right font-medium text-gray-400 text-[9px]">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Review Form */}
          <form
            onSubmit={handleSubmitReview}
            className="space-y-1.5 px-3.5 py-0.5 sm:py-2.5 rounded-xl border border-gray-200/80 bg-gray-50/40"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <Label className="text-xs sm:text-sm font-semibold text-gray-900">Your Rating *</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= (hoverRating || newReview.rating);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview((p) => ({ ...p, rating: star }))}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-115 focus:outline-none"
                      >
                        <Star
                          className={cn(
                            "w-4 h-4 sm:w-5 sm:h-5 transition-colors",
                            isFilled ? "text-amber-500 fill-amber-500" : "text-gray-300"
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
              <span className="text-xs font-boldpx-2 py-0.5 rounded">
                {(() => {
                  const currentRating = hoverRating || newReview.rating;
                  const config = RATING_CONFIG[currentRating] || RATING_CONFIG[5];

                  return (
                    <span
                      className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded border transition-colors",
                        config.className
                      )}
                    >
                      {config.label}
                    </span>
                  );
                })()}
              </span>
            </div>

            {user ? (
              <div className="flex items-center gap-2 py-1 text-xs text-gray-600 bg-white p-2.5 rounded-lg border border-gray-200/80">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <span>
                  Posting verified review as <strong className="text-gray-900">{user.name || "Customer"}</strong>
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="review-name" className="text-xs font-medium text-gray-700">
                    Your Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="review-name"
                    required
                    value={newReview.name}
                    onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                    placeholder="Full Name"
                    className="text-xs sm:text-sm h-8 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="review-email" className="text-xs font-medium text-gray-700">
                    Email <span className="text-gray-400 font-normal">(Optional)</span>
                  </Label>
                  <Input
                    id="review-email"
                    type="email"
                    value={newReview.email}
                    onChange={(e) => setNewReview({ ...newReview, email: e.target.value })}
                    placeholder="email@example.com"
                    className="text-xs sm:text-sm h-8 bg-white"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="review-feedback" className="text-xs font-medium text-gray-700">
                Your Feedback <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="review-feedback"
                required
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                placeholder="How was the scent profile, longevity, and packaging?"
                className="text-xs sm:text-sm min-h-[70px] bg-white resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">
                Attach Photo <span className="text-gray-400 font-normal">(Optional)</span>
              </Label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageSelect(e.target.files[0]);
                    }
                  }}
                />

                {reviewImage ? (
                  <div className="relative group inline-block">
                    <img
                      src={reviewImage}
                      alt="Review preview"
                      className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setReviewImage("")}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 shadow-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 text-xs gap-1.5 bg-white border-dashed border-gray-300 hover:border-gray-400"
                  >
                    <Camera className="w-3.5 h-3.5 text-gray-500" />
                    Add Photo
                  </Button>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm h-8 px-4 rounded-xl font-medium gap-2"
            >
              {submitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Submit Review
                </>
              )}
            </Button>
          </form>

          {/* Customer Reviews List */}
          <div className="space-y-1.5">
            {loadingReviews ? (
              <p className="text-center py-5 text-xs sm:text-sm text-gray-400">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <div className="p-5 text-center rounded-xl bg-gray-50 border border-dashed border-gray-200">
                <p className="text-xs sm:text-sm text-gray-500 font-medium">
                  No reviews yet. Be the first to share your thoughts on this scent!
                </p>
              </div>
            ) : (
              reviews.map((rev) => {
                const titleCandidate = rev.title?.trim();
                const userNameCandidate = rev.user?.name?.trim();

                const isTitleValid =
                  titleCandidate && titleCandidate.toLowerCase() !== "anonymous";
                const isUserValid =
                  userNameCandidate && userNameCandidate.toLowerCase() !== "anonymous";

                const displayName = isTitleValid
                  ? titleCandidate!
                  : isUserValid
                    ? userNameCandidate!
                    : "Anonymous";

                const rawImageUrl = rev.user?.imageUrl || rev.user?.image || rev.user?.avatar;
                const hasRealCustomAvatar =
                  rawImageUrl && !rawImageUrl.includes("default-avatar.png");

                const userInitial = displayName.charAt(0).toUpperCase() || "A";
                const badgeColorClass = getInitialBgColor(displayName);

                const formattedDate = rev.createdAt
                  ? new Date(rev.createdAt).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                  : "Recently";

                const isVerifiedAccount = Boolean(rev.userId || rev.user?.id);

                return (
                  <div
                    key={rev.id}
                    className="p-2.5 sm:p-3.5 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-colors shadow-2xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0">
                        {hasRealCustomAvatar ? (
                          <img
                            src={rawImageUrl}
                            alt={displayName}
                            className="w-9 h-9 rounded-full object-cover border border-emerald-100 shadow-2xs"
                          />
                        ) : (
                          <div
                            className={cn(
                              "w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center border select-none",
                              badgeColorClass
                            )}
                          >
                            {userInitial}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <h5 className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                              {displayName}
                            </h5>
                            {isVerifiedAccount && (
                              <span
                                title="Verified Account"
                                className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/80"
                              >
                                <ShieldCheck className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {formattedDate}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 mt-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={cn(
                                "w-3 h-3",
                                s <= rev.rating
                                  ? "text-amber-500 fill-amber-500"
                                  : "text-gray-200"
                              )}
                            />
                          ))}
                        </div>

                        <p className="mt-1.5 text-xs sm:text-sm text-gray-700 leading-relaxed break-words">
                          {rev.comment}
                        </p>

                        {rev.imageUrl && (
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={() => setPreviewImage(rev.imageUrl!)}
                              className="group relative block overflow-hidden rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                            >
                              <img
                                src={rev.imageUrl}
                                alt="Review attachment"
                                className="h-16 w-16 sm:h-20 sm:w-20 object-cover transition-transform duration-200 group-hover:scale-105 cursor-zoom-in"
                              />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </AccordionItem>

      {/* 3. Delivery & Return Policy */}
      <AccordionItem
        title="Delivery & Return Policy"
        icon={Truck}
        isOpen={openSection === "shipping"}
        onToggle={() => toggleSection("shipping")}
      >
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Banknote className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-900">Cash on Delivery</p>
                <p className="text-[11px] text-gray-600">Pay conveniently upon parcel arrival</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Eye className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-900">Open-Box Inspection</p>
                <p className="text-[11px] text-gray-600">Inspect parcel in front of the delivery agent</p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="border-b sm:border-b-0 sm:border-r border-gray-200/70 pb-2.5 sm:pb-0 sm:pr-3">
                <span className="font-bold text-gray-900 block">Inside Dhaka</span>
                <span className="text-emerald-700 font-bold block mt-0.5">৳60 Delivery Fee</span>
                <span className="text-[11px] text-gray-500 block mt-0.5">Estimated time: 24–48 Hours</span>
              </div>
              <div>
                <span className="font-bold text-gray-900 block">Outside Dhaka</span>
                <span className="text-emerald-700 font-bold block mt-0.5">৳120 Delivery Fee</span>
                <span className="text-[11px] text-gray-500 block mt-0.5">Estimated time: 2–4 Business Days</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-gray-100 bg-white space-y-1 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 font-bold text-gray-900">
              <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
              7-Day Hassle-Free Replacement
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              If your perfume arrives broken, leaked, or incorrect, notify us within 7 days for an immediate exchange or full refund. An unboxing video is recommended for instant resolution.
            </p>
          </div>
        </div>
      </AccordionItem>
      {/* Fullscreen Image Preview Lightbox */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 cursor-zoom-out"
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={previewImage}
              alt="Full view attachment"
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl cursor-default"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}