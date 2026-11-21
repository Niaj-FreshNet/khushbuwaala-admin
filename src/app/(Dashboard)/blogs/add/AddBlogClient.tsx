/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import 'jodit/es5/jodit.min.css';
import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Upload, X, Sparkles, FileText, Globe, CheckCircle2, Loader2, Image as ImageIcon, Tags, HelpCircle, Plus } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useAddBlogMutation } from '@/redux/store/api/blog/blogApi';
import { cn } from '@/lib/utils';
import { uploadToCloudinary } from '@/lib/helper/uploadToCloudinary';

const formSchema = z.object({
  title: z.string().min(1, 'Blog title is required').max(70, 'Title must be 70 characters or less'),
  metaTitle: z.string().min(1, 'SEO title is required').max(70, 'SEO title must be 70 characters or less'),
  metaDescription: z.string().min(1, 'Meta description is required').max(160, 'Meta description must be 160 characters or less'),
  keywords: z.string().optional(),
  tags: z.string().optional(),
  imageAltText: z.string().optional(),
  isPublish: z.boolean(),
});

interface FormValues {
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords?: string;
  tags?: string;
  imageAltText?: string;
  isPublish: boolean;
}

interface FaqItem {
  question: string;
  answer: string;
}

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

const AddBlogClient = () => {
  const [addBlog, { isLoading }] = useAddBlogMutation();
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Quick Questions / FAQ state for expert guides
  const [faqs, setFaqs] = useState<FaqItem[]>([{ question: '', answer: '' }]);

  const editorRef = useRef<any>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      metaTitle: '',
      metaDescription: '',
      keywords: '',
      tags: 'Attar, Ruh Khus, Vetiver, Perfume Guide',
      imageAltText: '',
      isPublish: false,
    },
  });

  const titleValue = watch('title', '');
  const metaTitleValue = watch('metaTitle', '');
  const metaDescValue = watch('metaDescription', '');
  const isPublish = useWatch({ control, name: 'isPublish' });

  const joditConfig = useMemo(
    () => ({
      readonly: false,
      placeholder: 'Write your botanical breakdown, sourcing details, or fragrance guide here...',
      height: 380,
      toolbar: true,
      spellcheck: true,
      language: 'en',
      toolbarButtonSize: 'middle' as const,
      toolbarAdaptive: false,
      showCharsCounter: true,
      showWordsCounter: true,
      showXPathInStatusbar: false,
      askBeforePasteHTML: false,
      buttons: [
        'source', '|',
        'bold', 'italic', 'underline', 'strikethrough', '|',
        'fontsize', 'brush', '|',
        'ul', 'ol', '|',
        'outdent', 'indent', '|',
        'paragraph', '|',
        'image', 'link', 'table', '|',
        'align', 'undo', 'redo', 'hr', 'full-size'
      ],
      controls: {
        fontsize: {
          list: ['8', '9', '10', '11', '12', '14', '16', '18', '24', '30', '36', '48', '60', '72']
        }
      },
      style: {
        background: '#ffffff',
        color: '#111827',
        font: '13px Inter, sans-serif',
      },
    }),
    []
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Only JPG/PNG/WebP files allowed!');
        return;
      }
      if (file.size / 1024 / 1024 > 25) {
        toast.error('Image must be under 25MB!');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleAddFaq = () => {
    setFaqs([...faqs, { question: '', answer: '' }]);
  };

  const handleRemoveFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...faqs];
    updated[index][field] = value;
    setFaqs(updated);
  };

  const handleAIAssist = () => {
    if (!titleValue.trim()) {
      toast.error('Enter a Blog Title first for AI optimization.');
      return;
    }
    setIsGeneratingAI(true);
    setTimeout(() => {
      setValue('metaTitle', `${titleValue} | Khushbuwaala Expert Fragrance Guide`, { shouldValidate: true });
      setValue('metaDescription', `Explore ${titleValue}. Learn authentic ingredients, distillation notes, and expert application tips from Khushbuwaala.`, { shouldValidate: true });
      setValue('keywords', 'attar, ruh khus, vetiver, luxury perfume, ' + titleValue.toLowerCase().split(' ').slice(0, 3).join(', '), { shouldValidate: true });
      setValue('tags', 'Attar, Ruh Khus, Vetiver, Perfume Guide', { shouldValidate: true });
      setValue('imageAltText', `${titleValue} botanical extract bottle`, { shouldValidate: true });

      // Auto-generate sample Quick Questions (FAQs) matching reference style
      setFaqs([
        { question: `Is ${titleValue} suitable for daily wear?`, answer: `Yes, when applied correctly on pulse points, it develops a rich and grounding natural sillage.` },
        { question: `How should I store pure attars like this?`, answer: `Keep them away from direct sunlight in a cool place to preserve top notes and depth.` }
      ]);

      setIsGeneratingAI(false);
      toast.success('AI SEO Metadata & Quick Questions generated!');
    }, 500);
  };

  const onSubmit = async (data: FormValues) => {
    if (!content.trim() || content === '<p><br></p>') {
      toast.error('Blog content body is required');
      return;
    }

    try {
      let imageUrl = '';

      // 1. Upload image to Cloudinary first if selected
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile, 'blogs');
        toast.dismiss();
      } else {
        toast.error('Featured banner image is required!');
        return;
      }

      // 2. Prepare payload as a clean JSON object
      const payload = {
        title: data.title,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        keywords: data.keywords || '',
        tags: data.tags || '',
        content: content,
        faqs: JSON.stringify(faqs.filter(f => f.question.trim() && f.answer.trim())),
        isPublish: data.isPublish,
        imageUrl: imageUrl,
        imageAltText: data.imageAltText || '',
      };

      // 3. Send JSON payload to your backend route
      await addBlog(payload).unwrap(); // Assuming your RTK Query mutation handles JSON
      reset();
      setContent('');
      setFaqs([{ question: '', answer: '' }]);
      setImageFile(null);
      setImagePreview(null);
    } catch (error: any) {
      toast.dismiss();
      toast.error(error?.data?.message || 'Failed to add blog');
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-60px)] bg-gray-50/50 px-3 sm:px-4 py-2 flex flex-col text-xs">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white px-3.5 py-2 rounded-xl border border-gray-200/80 shadow-2xs shrink-0 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-700 border border-emerald-100">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">Create Expert Fragrance Guide</h1>
            <p className="text-[10px] text-gray-500">Publish deep botanical breakdowns, ingredient origins, and attar guides[cite: 2, 3]</p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAIAssist}
          disabled={isGeneratingAI}
          className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
        >
          {isGeneratingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-600" />}
          AI Expert Content Assistant
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-start">

          {/* LEFT COLUMN: Core Content & Rich Editor */}
          <div className="lg:col-span-7 bg-white border border-gray-200/80 rounded-xl shadow-2xs p-3 space-y-2.5">
            <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">Article Title & Body Editor</h2>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label htmlFor="title" className="text-[11px] font-semibold text-gray-700">Guide Main Title *</Label>
                <span className={cn("text-[10px] font-mono", titleValue.length > 70 ? "text-rose-600 font-bold" : "text-gray-400")}>
                  {titleValue.length}/70
                </span>
              </div>
              <Input
                id="title"
                placeholder="e.g., What Is Vetiver Oil? How Is Ruh Khus Attar Made?"
                {...register('title')}
                className="border-gray-300 text-xs h-7 bg-white"
              />
              {errors.title && <p className="text-rose-600 text-[10px] mt-0.5">{errors.title.message}</p>}
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-gray-700">Rich Body Content (Supports Subheadings, Lists & Media) *</Label>
              <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-inner">
                <JoditEditor
                  ref={editorRef}
                  value={content}
                  config={joditConfig}
                  onBlur={(newContent) => setContent(newContent)}
                  onChange={() => { }}
                />
              </div>
            </div>

            {/* Quick Questions / FAQ Section Builder (Matches reference blog layout) */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-bold text-gray-900 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600" /> Quick Questions / FAQs Section[cite: 3]
                </Label>
                <Button type="button" size="sm" variant="ghost" onClick={handleAddFaq} className="h-6 text-[11px] text-emerald-700 hover:bg-emerald-50">
                  <Plus className="w-3 h-3 mr-1" /> Add Question
                </Button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {faqs.map((faq, index) => (
                  <div key={index} className="p-2 bg-gray-50 border border-gray-200 rounded-lg space-y-1.5 relative">
                    <button type="button" onClick={() => handleRemoveFaq(index)} className="absolute top-1.5 right-1.5 text-rose-500 hover:text-rose-700">
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <Input
                      placeholder={`Question ${index + 1} (e.g., Is Ruh Khus the same as Vetiver Essential Oil?)`}
                      value={faq.question}
                      onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                      className="h-6 text-[11px] bg-white border-gray-300 pr-6"
                    />
                    <Textarea
                      placeholder="Concise expert answer..."
                      value={faq.answer}
                      onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                      className="text-[11px] bg-white border-gray-300 h-10 resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: SEO, Tags, Media & Publish Settings */}
          <div className="lg:col-span-5 space-y-2">

            {/* SEO Optimization Card */}
            <div className="bg-blue-50/10 border border-blue-100 rounded-xl shadow-2xs p-3 space-y-2">
              <div className="flex items-center gap-1.5 border-b border-blue-100/60 pb-2">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-900">SEO & Metadata</h2>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <Label htmlFor="metaTitle" className="text-[11px] font-semibold text-gray-700">SEO Title *</Label>
                  <span className={cn("text-[10px] font-mono", metaTitleValue.length > 70 ? "text-rose-600 font-bold" : "text-gray-400")}>
                    {metaTitleValue.length}/70
                  </span>
                </div>
                <Input
                  id="metaTitle"
                  placeholder="Search engine title..."
                  {...register('metaTitle')}
                  className="border-blue-200 text-xs h-7 bg-white"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <Label htmlFor="metaDescription" className="text-[11px] font-semibold text-gray-700">Meta Description *</Label>
                  <span className={cn("text-[10px] font-mono", metaDescValue.length > 160 ? "text-rose-600 font-bold" : "text-gray-400")}>
                    {metaDescValue.length}/160
                  </span>
                </div>
                <Textarea
                  id="metaDescription"
                  placeholder="Snippet under 160 chars..."
                  {...register('metaDescription')}
                  className="border-blue-200 text-xs bg-white h-12 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="keywords" className="text-[11px] font-semibold text-gray-700">Keywords</Label>
                  <Input
                    id="keywords"
                    placeholder="vetiver, ruh khus"
                    {...register('keywords')}
                    className="border-blue-200 text-xs h-7 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tags" className="text-[11px] font-semibold text-gray-700 flex items-center gap-1">
                    <Tags className="w-3 h-3 text-emerald-600" /> Tags[cite: 3]
                  </Label>
                  <Input
                    id="tags"
                    placeholder="Attar, Ruh Khus, Vetiver"
                    {...register('tags')}
                    className="border-blue-200 text-xs h-7 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Media & Status Card */}
            <div className="bg-white border border-gray-200/80 rounded-xl shadow-2xs p-3 space-y-2">
              <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">Featured Image & Publish</h2>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-gray-700">Cover Banner</Label>
                <div className="border border-dashed border-gray-300 rounded-lg p-2 text-center bg-gray-50/50 hover:bg-gray-50">
                  <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" id="image-upload" />
                  <Label htmlFor="image-upload" className="cursor-pointer flex items-center justify-center gap-2 text-gray-600">
                    <Upload className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-[11px]">Upload Image (JPEG/PNG/WebP)</span>
                  </Label>
                </div>

                {imagePreview && (
                  <div className="mt-1.5 flex items-center gap-2 p-1.5 bg-gray-50 border rounded-lg">
                    <div className="relative w-12 h-9 rounded overflow-hidden border bg-white shrink-0">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={handleRemoveImage} className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <Input placeholder="Image Alt Text" {...register('imageAltText')} className="border-gray-300 text-[11px] h-6 bg-white" />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <Label htmlFor="isPublish" className="text-[11px] font-bold text-gray-900">Publish Immediately</Label>
                  <p className="text-[9px] text-gray-500">Make live on Khushbuwaala storefront</p>
                </div>
                <Switch
                  id="isPublish"
                  checked={isPublish}
                  onCheckedChange={(checked) => setValue('isPublish', checked)}
                  className="data-[state=checked]:bg-emerald-600"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-2 bg-white px-3.5 py-2 rounded-xl border border-gray-200/80 shadow-2xs">
          <Button type="button" variant="outline" size="sm" onClick={() => router.push('/blogs')} className="text-xs h-7 border-gray-300">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs h-7 px-4 shadow-2xs transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Publishing Guide...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Save & Publish Guide
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddBlogClient;