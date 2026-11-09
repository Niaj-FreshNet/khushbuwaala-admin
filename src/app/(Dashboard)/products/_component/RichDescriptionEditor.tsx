'use client';

import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Bold, Italic, List, ListOrdered, Sparkles, Heading2, Quote, Eraser } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichDescriptionEditorProps {
    name: string;
    label?: string;
    placeholder?: string;
    rows?: number;
    maxLength?: number;
}

export function RichDescriptionEditor({
    name,
    label = 'Description & Story',
    placeholder = 'Write a rich description...',
    rows = 15,
    maxLength = 2000,
}: RichDescriptionEditorProps) {
    const { register, watch, setValue, formState: { errors } } = useFormContext();
    const value = watch(name) || '';
    const errorMsg = (errors as any)?.[name]?.message as string | undefined;

    // Command/Control toolbar inserter utility
    const insertFormatting = (wrapperBefore: string, wrapperAfter: string = '', defaultText: string = '') => {
        const textarea = document.getElementById(name) as HTMLTextAreaElement | null;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end) || defaultText;
        const replacement = `${wrapperBefore}${selectedText}${wrapperAfter}`;

        const newValue = value.substring(0, start) + replacement + value.substring(end);
        setValue(name, newValue, { shouldDirty: true, shouldValidate: true });

        // Reset focus & cursor position
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + wrapperBefore.length, start + wrapperBefore.length + selectedText.length);
        }, 0);
    };

    // Quick Preset Templates for Perfume Admin
    const insertTemplate = (type: 'pyramid' | 'features') => {
        let template = '';
        if (type === 'pyramid') {
            template = `\n\n📌 **Fragrance Profile:**\n- **Top Notes:** \n- **Heart Notes:** \n- **Base Notes:** \n\n✨ **Longevity & Sillage:** Exceptional performance with strong projection suitable for evening wear and special occasions.`;
        } else if (type === 'features') {
            template = `\n\n🌟 **Key Features:**\n- Premium formulation crafted with fine ingredients.\n- Smooth blending ensuring skin safety and high projection.\n- Elegant packaging ideal for personal use or gifting.`;
        }
        setValue(name, value + template, { shouldDirty: true, shouldValidate: true });
    };

    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && (
                <Label htmlFor={name} className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                    {label}
                </Label>
            )}

            {/* Control System / Formatting Toolbar */}
            <div className="flex flex-wrap items-center gap-1 bg-gray-100 p-1.5 rounded-t-lg border border-gray-300 border-b-0">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertFormatting('**', '**', 'Bold text')}
                    className="h-7 px-2 text-xs bg-white text-gray-700 hover:bg-gray-200 border border-gray-200 shadow-2xs"
                    title="Bold"
                >
                    <Bold className="w-3.5 h-3.5" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertFormatting('*', '*', 'Italic text')}
                    className="h-7 px-2 text-xs bg-white text-gray-700 hover:bg-gray-200 border border-gray-200 shadow-2xs"
                    title="Italic"
                >
                    <Italic className="w-3.5 h-3.5" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertFormatting('## ', '', 'Heading Title')}
                    className="h-7 px-2 text-xs bg-white text-gray-700 hover:bg-gray-200 border border-gray-200 shadow-2xs"
                    title="Heading"
                >
                    <Heading2 className="w-3.5 h-3.5" />
                </Button>
                <span className="w-px h-4 bg-gray-300 mx-1" />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertFormatting('- ', '', 'Bullet item')}
                    className="h-7 px-2 text-xs bg-white text-gray-700 hover:bg-gray-200 border border-gray-200 shadow-2xs"
                    title="Bullet List"
                >
                    <List className="w-3.5 h-3.5" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertFormatting('> ', '', 'Callout note')}
                    className="h-7 px-2 text-xs bg-white text-gray-700 hover:bg-gray-200 border border-gray-200 shadow-2xs"
                    title="Callout Box"
                >
                    <Quote className="w-3.5 h-3.5" />
                </Button>
                <span className="w-px h-4 bg-gray-300 mx-1" />

                {/* Preset Injectors */}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertTemplate('pyramid')}
                    className="h-7 px-2.5 text-[11px] bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100 font-semibold shadow-2xs ml-auto"
                >
                    <Sparkles className="w-3 h-3 mr-1 text-[#FB923C]" /> Insert Profile Template
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertTemplate('features')}
                    className="h-7 px-2.5 text-[11px] bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100 font-semibold shadow-2xs"
                >
                    + Add Features
                </Button>
            </div>

            {/* Textarea Controlled Input */}
            <Textarea
                id={name}
                {...register(name)}
                rows={rows}
                maxLength={maxLength}
                placeholder={placeholder}
                className={cn(
                    'w-full rounded-t-none rounded-b-lg border border-gray-300 focus:ring-2 focus:ring-[#FB923C] bg-white text-xs leading-relaxed resize-y',
                    errorMsg && 'border-red-500'
                )}
            />

            {/* Counter & Error helper footer */}
            <div className="flex items-center justify-between text-[11px] text-gray-500 px-1 pt-0.5">
                <span>{errorMsg ? <span className="text-red-500 font-medium">{errorMsg}</span> : 'Supports rich markdown descriptions, bullet points, and notes.'}</span>
                <span>{value.length}/{maxLength}</span>
            </div>
        </div>
    );
}