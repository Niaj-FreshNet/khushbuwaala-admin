'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Upload, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useAddBlogMutation } from '@/redux/store/api/blog/blogApi';

const formSchema = z.object({
  title: z.string().min(1, 'Blog title is required').max(70, 'Title must be 70 characters or less'),
  metaTitle: z.string().min(1, 'SEO title is required').max(70, 'SEO title must be 70 characters or less'),
  metaDescription: z.string().min(1, 'Meta description is required').max(160, 'Meta description must be 160 characters or less'),
  keywords: z.string().optional(),
  imageAltText: z.string().optional(),
  isPublish: z.boolean(),
});

interface FormValues {
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords?: string;
  imageAltText?: string;
  isPublish: boolean;
}

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

const joditConfig = {
  readonly: false,
  placeholder: 'Compose an epic...',
  height: 300,
  toolbar: true,
  spellcheck: true,
  language: 'en',
  toolbarButtonSize: 'small',
  toolbarAdaptive: false,
  showCharsCounter: false,
  showWordsCounter: false,
  showXPathInStatusbar: false,
  askBeforePasteHTML: false,
  askBeforePasteFromWord: false,
  buttons: [
    'font',
    'fontsize',
    '|',
    'bold',
    'italic',
    'underline',
    'strikethrough',
    '|',
    'superscript',
    'subscript',
    '|',
    'align',
    '|',
    'ul',
    'ol',
    '|',
    'outdent',
    'indent',
    '|',
    'link',
    'image',
    '|',
    'hr',
    'table',
    '|',
    'undo',
    'redo',
  ],
  style: {
    font: '14px Arial, sans-serif',
  },
};

const AddBlogClient = () => {
  const [addBlog, { isLoading }] = useAddBlogMutation();
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      metaTitle: '',
      metaDescription: '',
      keywords: '',
      imageAltText: '',
      isPublish: false,
    },
  });

  // ✅ Watch the "isPublish" field properly
  const isPublish = useWatch({ control, name: 'isPublish' });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      const isLt25M = file.size / 1024 / 1024 < 25;
      if (!isJpgOrPng) {
        toast.error('You can only upload JPG/PNG files!');
        return;
      }
      if (!isLt25M) {
        toast.error('Image must be smaller than 25MB!');
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

  const onSubmit = async (data: FormValues) => {
    if (!content) {
      toast.error('Blog content is required');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('metaTitle', data.metaTitle);
      formData.append('metaDescription', data.metaDescription);
      if (data.keywords) formData.append('keywords', data.keywords);
      formData.append('content', content);
      formData.append('isPublish', data.isPublish.toString());
      if (imageFile) {
        formData.append('image', imageFile);
      }
      formData.append('imageAltText', data.imageAltText || '');

      await addBlog(formData).unwrap();
      toast.success('Blog added successfully!');
      reset();
      setContent('');
      setImageFile(null);
      setImagePreview(null);
      router.push('/dashboard/blogs');
    } catch (error) {
      toast.error('Failed to add blog');
    }
  };

  return (
    <div className="p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-[#FB923C] mb-6">Add Blog</h1>
        <Card className="border-[#FB923C]">
          <CardHeader>
            <CardTitle>Create New Blog</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">Blog Title</Label>
                <Input
                  id="title"
                  placeholder="Enter blog title (max 70 chars)"
                  {...register('title')}
                  className="border-[#FB923C] focus:ring-[#FB923C]"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <Label htmlFor="metaTitle" className="text-sm font-medium">SEO Title</Label>
                <Input
                  id="metaTitle"
                  placeholder="Enter SEO title (max 70 chars)"
                  {...register('metaTitle')}
                  className="border-[#FB923C] focus:ring-[#FB923C]"
                />
                {errors.metaTitle && <p className="text-red-500 text-sm mt-1">{errors.metaTitle.message}</p>}
              </div>

              <div>
                <Label htmlFor="metaDescription" className="text-sm font-medium">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  placeholder="Enter meta description (max 160 chars)"
                  {...register('metaDescription')}
                  className="border-[#FB923C] focus:ring-[#FB923C]"
                />
                {errors.metaDescription && <p className="text-red-500 text-sm mt-1">{errors.metaDescription.message}</p>}
              </div>

              <div>
                <Label htmlFor="keywords" className="text-sm font-medium">Keywords</Label>
                <Input
                  id="keywords"
                  placeholder="Enter keywords (comma-separated)"
                  {...register('keywords')}
                  className="border-[#FB923C] focus:ring-[#FB923C]"
                />
                {errors.keywords && <p className="text-red-500 text-sm mt-1">{errors.keywords.message}</p>}
              </div>

              <div>
                <Label className="text-sm font-medium">Blog Image</Label>
                <div className="border-2 border-dashed border-[#FB923C] rounded-lg p-4 text-center">
                  <Input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <Upload className="w-6 h-6 text-[#FB923C] mb-2" />
                      <p className="text-sm text-gray-600">Drop file or browse (JPEG/PNG, max 25MB)</p>
                    </div>
                  </Label>
                </div>
                {imagePreview && (
                  <div className="mt-4 relative inline-block">
                    <img src={imagePreview} alt="Preview" className="w-32 h-20 object-cover rounded" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-0 right-0 bg-white rounded-full"
                      onClick={handleRemoveImage}
                    >
                      <X className="w-4 h-4 text-[#FB923C]" />
                    </Button>
                    <div className="mt-2">
                      <Label htmlFor="imageAltText" className="text-sm font-medium">Image Alt Text</Label>
                      <Input
                        id="imageAltText"
                        placeholder="Enter image alt text"
                        {...register('imageAltText')}
                        className="border-[#FB923C] focus:ring-[#FB923C]"
                      />
                      {errors.imageAltText && <p className="text-red-500 text-sm mt-1">{errors.imageAltText.message}</p>}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">Blog Content</Label>
                <div className="border border-[#FB923C] rounded-lg overflow-hidden">
                  <JoditEditor
                    value={content}
                    config={joditConfig}
                    onBlur={(newContent) => setContent(newContent)}
                    onChange={() => { }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Label htmlFor="isPublish" className="text-sm font-medium">Published</Label>
                <Switch
                  id="isPublish"
                  checked={isPublish}
                  onCheckedChange={(checked) => setValue('isPublish', checked)}
                  className="data-[state=checked]:bg-[#4CD964]"
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#FB923C] text-[#FB923C]"
                  onClick={() => {
                    reset();
                    setContent('');
                    setImageFile(null);
                    setImagePreview(null);
                    router.push('/dashboard/blogs');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#FB923C] hover:bg-[#ff8a29] text-white"
                >
                  {isLoading ? 'Adding...' : 'Add Blog'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddBlogClient;
