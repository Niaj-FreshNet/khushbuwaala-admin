"use client";

import { useState } from "react";
import FormInput from "@/components/ReusableUI/FormInput";
import { useFormContext, useWatch } from "react-hook-form";
import { ImagePlus, X, LucideAlertCircle, Video } from "lucide-react";
import Thumb from "@/components/admin/Thumb";

export const ProductMediaSection = () => {
    const {
        setValue,
        getValues,
        control,
        formState: { errors },
    } = useFormContext();

    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const videos: (File | string)[] = useWatch({ control, name: "videos" }) || [];

    const primaryError = errors.primaryImage as { message?: string } | undefined;
    const hasPrimaryError = Boolean(primaryError);
    const primaryErrorMsg = primaryError?.message;

    return (
        <div className="border border-gray-200/80 rounded-xl p-3 space-y-3 bg-white shadow-2xs">
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-900 flex items-center gap-1.5 border-b border-gray-100 pb-1.5">
                <ImagePlus className="w-4 h-4 text-[#FB923C]" /> 6. Product Media & Imagery
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                {/* Primary Thumbnail Image */}
                <div className="space-y-1.5">
                    <FormInput
                        name="primaryImage"
                        label="Primary Thumbnail Image"
                        type="file"
                        required
                        inputClassName="border-gray-300 text-xs"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const previewUrl = URL.createObjectURL(file);
                                setValue("primaryImage", [file], { shouldDirty: true, shouldValidate: true });
                                setImagePreviews((prev) => [previewUrl, ...prev.slice(1)]);
                            }
                        }}
                    />
                    {hasPrimaryError && (
                        <div className="text-[11px] text-red-500 flex items-center gap-1 mt-0.5">
                            <LucideAlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{primaryErrorMsg || "Primary thumbnail image is required."}</span>
                        </div>
                    )}

                    {imagePreviews[0] && (
                        <div className="relative w-12 h-12 border-2 border-[#FB923C] rounded-lg overflow-hidden shadow-2xs bg-gray-100 mt-1">
                            <Thumb src={imagePreviews[0]} alt="Primary Preview" size={48} className="w-full h-full object-cover" />
                            <button
                                type="button"
                                className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 w-3.5 h-3.5 flex items-center justify-center text-[9px] leading-none hover:bg-red-700 shadow-sm"
                                onClick={() => {
                                    setValue("primaryImage", [], { shouldDirty: true, shouldValidate: true });
                                    setImagePreviews((prev) => ["", ...prev.slice(1)]);
                                }}
                                title="Remove primary image"
                            >
                                <X className="w-2.5 h-2.5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Gallery Images (Multiple) */}
                <div className="space-y-1.5 md:col-span-2">
                    <FormInput
                        name="otherImages"
                        label="Gallery Images (Multiple)"
                        type="file"
                        inputClassName="border-gray-300 text-xs text-transparent file:text-gray-700"
                        multiple
                        onChange={(e) => {
                            const files = Array.from(e.target.files || []) as File[];
                            if (files.length > 0) {
                                const currentOther = (getValues("otherImages") as File[]) || [];
                                const updatedFiles = [...currentOther, ...files];
                                setValue("otherImages", updatedFiles, { shouldDirty: true, shouldValidate: true });

                                const newPreviews = files.map((file) => URL.createObjectURL(file));
                                setImagePreviews((prev) => {
                                    const primary = prev[0] || "";
                                    const existingGallery = prev.slice(1);
                                    return [primary, ...existingGallery, ...newPreviews];
                                });
                            }
                        }}
                    />

                    {imagePreviews.slice(1).filter(Boolean).length > 0 && (
                        <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-semibold text-gray-500">
                                {imagePreviews.slice(1).filter(Boolean).length} image(s) selected
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {imagePreviews.slice(1).map((preview, index) => (
                                    preview ? (
                                        <div key={index} className="relative w-11 h-11 rounded-lg border border-gray-300 overflow-hidden shadow-2xs bg-gray-100">
                                            <Thumb src={preview} alt="Gallery item" size={44} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 w-3.5 h-3.5 flex items-center justify-center text-[9px] leading-none hover:bg-red-700 shadow-sm"
                                                onClick={() => {
                                                    const otherImages = (getValues("otherImages") as File[]) || [];
                                                    if (Array.isArray(otherImages)) {
                                                        otherImages.splice(index, 1);
                                                        setValue("otherImages", otherImages, { shouldDirty: true, shouldValidate: true });
                                                    }
                                                    setImagePreviews((prev) => {
                                                        const primary = prev[0] || '';
                                                        const rest = prev.slice(1).filter((_, i) => i !== index);
                                                        return [primary, ...rest];
                                                    });
                                                }}
                                                title="Remove gallery image"
                                            >
                                                <X className="w-2.5 h-2.5" />
                                            </button>
                                        </div>
                                    ) : null
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ⚡ Product Videos Sub-section */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-[#FB923C]" /> Product Videos (Optional)
                </label>
                <input
                    type="file"
                    multiple
                    accept="video/mp4,video/webm,video/ogg"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const files = e.target.files ? Array.from(e.target.files) : [];
                        const currentVideos = getValues("videos") || [];
                        setValue("videos", [...currentVideos, ...files], { shouldDirty: true });
                    }}
                    className="w-full bg-white border border-gray-300 rounded-md text-[11px] text-gray-600 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-orange-50 file:text-[#FB923C] cursor-pointer truncate"
                />

                {videos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {videos.map((vid, idx: number) => {
                            const previewSrc = vid instanceof File ? URL.createObjectURL(vid) : vid;
                            return (
                                <div key={idx} className="relative aspect-video rounded-lg border border-gray-300 overflow-hidden bg-black shadow-2xs group">
                                    <video src={previewSrc} className="w-full h-full object-cover" muted />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const updated = videos.filter((_, i: number) => i !== idx);
                                                setValue("videos", updated, { shouldDirty: true });
                                            }}
                                            className="bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow-sm"
                                            title="Remove video"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};