'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormContext, get } from "react-hook-form";
import { Label } from '@/components/ui/label';
import { Bold, Italic, List, ListOrdered, Heading2, Quote, Eraser, Edit3, Eye, Type } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichDescriptionEditorProps {
    name: string;
    label?: string;
    placeholder?: string;
    maxLength?: number;
}

export function RichDescriptionEditor({
    name,
    label = 'Description & Story',
    placeholder = 'Write a professional product description...',
    maxLength = 3000,
}: RichDescriptionEditorProps) {
    const { register, watch, setValue, formState: { errors } } = useFormContext();
    const editorRef = useRef<HTMLDivElement>(null);
    const formValue = watch(name) || '';
    const errorMsg = (get(errors, name) as { message?: string } | undefined)?.message;

    const [charCount, setCharCount] = useState(0);
    const [mode, setMode] = useState<'edit' | 'preview'>('edit');
    const [previewHtml, setPreviewHtml] = useState('');
    const isFocusedRef = useRef(false);

    useEffect(() => {
        register(name);
    }, [register, name]);

    const updateContent = () => {
        if (!editorRef.current) return;
        const html = editorRef.current.innerHTML;
        const text = editorRef.current.innerText || '';

        if (text.length <= maxLength) {
            const cleanHtml = html === '<br>' ? '' : html;
            setValue(name, cleanHtml, { shouldDirty: true, shouldValidate: true });
            setCharCount(text.length);
            return cleanHtml;
        }
        return '';
    };

    useEffect(() => {
        if (editorRef.current && !isFocusedRef.current) {
            if (editorRef.current.innerHTML !== formValue) {
                editorRef.current.innerHTML = formValue || '';
                setCharCount(editorRef.current.innerText.trim().length);
            }
        }
    }, [formValue]);

    // Robust command executer for all styles & font sizes
    const formatText = (e: React.MouseEvent | React.ChangeEvent<HTMLSelectElement>, command: string, valueArgument: string = '') => {
        e.preventDefault();
        e.stopPropagation();

        document.execCommand(command, false, valueArgument);
        if (editorRef.current) {
            editorRef.current.focus();
            updateContent();
        }
    };

    const clearEditor = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (editorRef.current) {
            editorRef.current.innerHTML = '';
            setValue(name, '', { shouldDirty: true, shouldValidate: true });
            setCharCount(0);
            setPreviewHtml('');
        }
    };

    const handleSwitchToPreview = () => {
        const currentHtml = updateContent();
        setPreviewHtml(currentHtml || editorRef.current?.innerHTML || '');
        setMode('preview');
    };

    return (
        <div className="flex flex-col gap-1.5 w-full">
            <div className="flex items-center justify-between">
                {label && (
                    <Label htmlFor={name} className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                        {label}
                    </Label>
                )}
                {/* Mode Switcher Tabs */}
                <div className="flex items-center bg-gray-200 p-0.5 rounded-md text-[11px] font-semibold">
                    <button
                        type="button"
                        onClick={() => setMode('edit')}
                        className={cn(
                            'flex items-center gap-1 px-2.5 py-1 rounded transition-all',
                            mode === 'edit' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                        )}
                    >
                        <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    <button
                        type="button"
                        onClick={handleSwitchToPreview}
                        className={cn(
                            'flex items-center gap-1 px-2.5 py-1 rounded transition-all',
                            mode === 'preview' ? 'bg-white text-[#FB923C] shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                        )}
                    >
                        <Eye className="w-3 h-3" /> Live Preview
                    </button>
                </div>
            </div>

            {/* Formatting Toolbar */}
            <div className={cn("flex flex-wrap items-center gap-1 bg-gray-100 p-1.5 rounded-t-lg border border-gray-300 border-b-0", mode === 'preview' && 'hidden')}>
                <button
                    type="button"
                    onClick={(e) => formatText(e, 'bold')}
                    className="h-7 px-2 text-xs bg-white text-gray-700 hover:bg-gray-200 border border-gray-200 rounded shadow-2xs font-bold inline-flex items-center"
                    title="Bold"
                >
                    <Bold className="w-3.5 h-3.5 mr-1" /> Bold
                </button>
                <button
                    type="button"
                    onClick={(e) => formatText(e, 'italic')}
                    className="h-7 px-2 text-xs bg-white text-gray-700 hover:bg-gray-200 border border-gray-200 rounded shadow-2xs italic inline-flex items-center"
                    title="Italic"
                >
                    <Italic className="w-3.5 h-3.5 mr-1" /> Italic
                </button>
                <button
                    type="button"
                    onClick={(e) => formatText(e, 'formatBlock', '<h2>')}
                    className="h-7 px-2 text-xs bg-white text-gray-700 hover:bg-gray-200 border border-gray-200 rounded shadow-2xs inline-flex items-center font-semibold"
                    title="Heading 2"
                >
                    <Heading2 className="w-3.5 h-3.5 mr-1" /> Heading
                </button>

                {/* Font Size Selector */}
                <div className="inline-flex items-center bg-white border border-gray-200 rounded shadow-2xs px-1 h-7">
                    <Type className="w-3.5 h-3.5 text-gray-500 mr-1" />
                    <select
                        onChange={(e) => formatText(e, 'fontSize', e.target.value)}
                        className="text-[11px] bg-transparent text-gray-700 focus:outline-none cursor-pointer"
                        defaultValue=""
                        title="Font Size"
                    >
                        <option value="" disabled>Size</option>
                        <option value="2">Small</option>
                        <option value="3">Normal</option>
                        <option value="4">Medium</option>
                        <option value="5">Large</option>
                        <option value="6">Heading Size</option>
                    </select>
                </div>

                <span className="w-px h-4 bg-gray-300 mx-0.5" />

                <button
                    type="button"
                    onClick={(e) => formatText(e, 'insertUnorderedList')}
                    className="h-7 px-2 text-xs bg-white text-gray-700 hover:bg-gray-200 border border-gray-200 rounded shadow-2xs inline-flex items-center"
                    title="Bullet List"
                >
                    <List className="w-3.5 h-3.5 mr-1" /> List
                </button>
                <button
                    type="button"
                    onClick={(e) => formatText(e, 'insertOrderedList')}
                    className="h-7 px-2 text-xs bg-white text-gray-700 hover:bg-gray-200 border border-gray-200 rounded shadow-2xs inline-flex items-center"
                    title="Numbered List"
                >
                    <ListOrdered className="w-3.5 h-3.5 mr-1" /> Numbered
                </button>
                <button
                    type="button"
                    onClick={(e) => formatText(e, 'formatBlock', '<blockquote>')}
                    className="h-7 px-2 text-xs bg-white text-gray-700 hover:bg-gray-200 border border-gray-200 rounded shadow-2xs inline-flex items-center"
                    title="Quote Block"
                >
                    <Quote className="w-3.5 h-3.5 mr-1" /> Quote
                </button>

                <button
                    type="button"
                    onClick={clearEditor}
                    className="h-7 px-2 text-xs bg-white text-red-600 hover:bg-red-50 border border-gray-200 rounded shadow-2xs ml-auto inline-flex items-center font-semibold"
                    title="Clear Content"
                >
                    <Eraser className="w-3.5 h-3.5 mr-1" /> Clear
                </button>
            </div>

            <div
                ref={editorRef}
                contentEditable
                onInput={updateContent}
                onKeyUp={updateContent}
                onFocus={() => { isFocusedRef.current = true; }}
                onBlur={() => { isFocusedRef.current = false; updateContent(); }}
                data-placeholder={placeholder}
                className={cn(
                    'w-full min-h-35 overflow-y-auto rounded-lg border border-gray-300 p-3 bg-white text-xs leading-relaxed',
                    mode === 'edit' ? 'rounded-t-none' : 'hidden',
                    errorMsg && 'border-red-500',
                    'empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400',
                    // Internal editor typography styling for lists and headings
                    '[&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:my-1.5',
                    '[&_ul]:list-disc [&_ul]:ml-4',
                    '[&_ol]:list-decimal [&_ol]:ml-4',
                    '[&_blockquote]:border-l-2 [&_blockquote]:border-[#FB923C] [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-1'
                )}
            />

            <div
                className={cn(
                    "w-full min-h-35 overflow-y-auto rounded-lg border border-gray-300 p-3 bg-white text-xs leading-relaxed prose prose-sm max-w-none [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:my-1.5 [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_blockquote]:border-l-2 [&_blockquote]:border-[#FB923C] [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-1",
                    mode === 'preview' ? 'block' : 'hidden'
                )}
                dangerouslySetInnerHTML={{ __html: previewHtml || formValue || '<span class="text-gray-400 italic">No description content provided yet.</span>' }}
            />

            {/* Footer / Counter */}
            <div className="flex items-center justify-end text-[11px] text-gray-500 px-1 pt-0.5">
                <span>{charCount}/{maxLength}</span>
            </div>
        </div>
    );
}