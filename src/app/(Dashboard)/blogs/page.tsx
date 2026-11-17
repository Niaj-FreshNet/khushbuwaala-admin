/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import 'jodit/es5/jodit.min.css';
import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, Edit, Trash, X, Upload, Loader2, Tags, HelpCircle, FileText, ExternalLink } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  useGetAdminBlogsQuery,
  useUpdateBlogMutation,
  useDeleteBlogMutation,
} from '@/redux/store/api/blog/blogApi';
import { uploadToCloudinary } from '@/lib/helper/uploadToCloudinary';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

interface BlogData {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  imageAltText?: string;
  others?: string;
  isPublish: boolean;
  createdAt: string;
  updatedAt: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  slug?: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

const formSchema = z.object({
  title: z.string().min(1, 'Blog title is required').max(120, 'Title must be 120 characters or less'),
  metaTitle: z.string().min(1, 'SEO title is required').max(70, 'SEO title must be 70 characters or less'),
  metaDescription: z.string().min(1, 'Meta description is required').max(160, 'Meta description must be 160 characters or less'),
  keywords: z.string().optional(),
  tags: z.string().optional(),
  imageAltText: z.string().optional(),
  isPublish: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const joditConfig = {
  readonly: false,
  height: 300,
  toolbar: true,
  spellcheck: true,
  language: 'en',
  toolbarButtonSize: 'small' as const,
  toolbarAdaptive: false,
  showCharsCounter: false,
  showWordsCounter: false,
  showXPathInStatusbar: false,
  buttons: ['bold', 'italic', 'underline', '|', 'ul', 'ol', '|', 'fontsize', 'paragraph', '|', 'align', 'link', 'image', 'table', '|', 'undo', 'redo'],
};

const BlogList = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageParam = Number(searchParams.get('page')) || 1;

  const [currentPage, setCurrentPage] = useState(pageParam);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogData | null>(null);
  const [blogContent, setBlogContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<FaqItem[]>([{ question: '', answer: '' }]);

  // Track toggling row state to prevent full page layout shifts
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPage(pageParam);
  }, [pageParam]);

  const { data, isLoading, isFetching } = useGetAdminBlogsQuery({
    page: currentPage,
    limit: 10,
  });

  const [updateBlog, { isLoading: isUpdating }] = useUpdateBlogMutation();
  const [deleteBlog] = useDeleteBlogMutation();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { isPublish: false },
  });

  const isPublishValue = useWatch({ control, name: 'isPublish' });

  const allBlogs: BlogData[] = useMemo(() => {
    return data?.data?.data || data?.data || [];
  }, [data]);

  const meta = data?.data?.meta;

  const filteredBlogs = useMemo(() => {
    return allBlogs.filter((blog) =>
      blog.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allBlogs, searchTerm]);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleEdit = (blog: BlogData) => {
    setEditingBlog(blog);
    setIsEditModalOpen(true);
    setBlogContent(blog.content || '');
    setImagePreview(blog.imageUrl);
    setImageFile(null);

    try {
      if (blog.others) {
        const parsedOthers = JSON.parse(blog.others);
        if (parsedOthers?.faqs && Array.isArray(parsedOthers.faqs)) {
          setFaqs(parsedOthers.faqs.length > 0 ? parsedOthers.faqs : [{ question: '', answer: '' }]);
        } else {
          setFaqs([{ question: '', answer: '' }]);
        }
      } else {
        setFaqs([{ question: '', answer: '' }]);
      }
    } catch {
      setFaqs([{ question: '', answer: '' }]);
    }

    setValue('title', blog.title);
    setValue('metaTitle', blog.metaTitle || blog.title);
    setValue('metaDescription', blog.metaDescription || '');
    setValue('keywords', blog.keywords || '');
    setValue('tags', 'Attar, Ruh Khus, Vetiver, Perfume Guide');
    setValue('imageAltText', blog.imageAltText || '');
    setValue('isPublish', blog.isPublish);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this article?')) {
      return;
    }

    try {
      await deleteBlog(id).unwrap();
      toast.success('Blog deleted successfully');
    } catch {
      toast.error('Failed to delete blog');
    }
  };

  // ⚡ Partial background update without reloading whole page
  const handlePublishToggle = async (checked: boolean, blog: BlogData) => {
    setTogglingId(blog.id);
    try {
      const payload = {
        isPublish: checked,
        title: blog.title,
        content: blog.content,
        imageUrl: blog.imageUrl,
        metaTitle: blog.metaTitle,
        metaDescription: blog.metaDescription,
        keywords: blog.keywords,
        imageAltText: blog.imageAltText || '',
        others: blog.others || null,
      };

      await updateBlog({ id: blog.id, data: payload }).unwrap();
    } catch {
      toast.error('Failed to update publication status');
    } finally {
      setTogglingId(null);
    }
  };

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

  const handleUpdate = async (formDataValues: FormValues) => {
    if (!editingBlog) return;
    if (!blogContent || blogContent.trim() === '<p><br></p>') {
      toast.error('Blog content is required');
      return;
    }

    try {
      let imageUrl = editingBlog.imageUrl;

      if (imageFile) {
        toast.loading('Uploading banner image...');
        imageUrl = await uploadToCloudinary(imageFile, 'blogs');
        toast.dismiss();
      }

      const payload = {
        title: formDataValues.title,
        metaTitle: formDataValues.metaTitle,
        metaDescription: formDataValues.metaDescription,
        keywords: formDataValues.keywords || '',
        tags: formDataValues.tags || '',
        content: blogContent,
        faqs: JSON.stringify(faqs.filter(f => f.question.trim() && f.answer.trim())),
        isPublish: formDataValues.isPublish,
        imageUrl: imageUrl,
        imageAltText: formDataValues.imageAltText || '',
      };

      await updateBlog({ id: editingBlog.id, data: payload }).unwrap();
      toast.success('Blog guide updated successfully');

      setIsEditModalOpen(false);
      setEditingBlog(null);
      setBlogContent('');
      setImageFile(null);
      setImagePreview(null);
      reset();
    } catch {
      toast.dismiss();
      toast.error('Failed to update blog guide');
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    router.push(`/blogs?page=${newPage}`);
  };

  return (
    <div className="w-full min-h-[calc(100vh-60px)] bg-gray-50/50 px-2 sm:px-4 py-2 flex flex-col text-xs">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200/85 shadow-2xs shrink-0 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-700 border border-emerald-100">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">Blog Articles Management</h1>
            <p className="text-[10px] text-gray-500">Manage expert guides, publication states, and SEO content</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 border-gray-300 text-xs h-7 bg-white focus-visible:ring-emerald-600"
            />
          </div>

          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs h-7 px-3 shadow-2xs shrink-0"
            onClick={() => router.push('/blogs/add')}
          >
            <Plus className="w-3.5 h-3.5" /> Add New Blog
          </Button>
        </div>
      </div>

      {/* Responsive Blog Table Card */}
      <div className="rounded-xl border border-gray-200/85 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto w-full">
          <Table>
            <TableHeader className="bg-gray-50/80">
              <TableRow>
                <TableHead className="w-16 sm:w-20 text-[11px] font-bold text-gray-700">Image</TableHead>
                <TableHead className="min-w-[160px] sm:min-w-[200px] text-[11px] font-bold text-gray-700">Title</TableHead>
                <TableHead className="hidden md:table-cell min-w-[220px] text-[11px] font-bold text-gray-700">Excerpt</TableHead>
                <TableHead className="w-20 text-center text-[11px] font-bold text-gray-700">Status</TableHead>
                <TableHead className="hidden sm:table-cell w-24 text-[11px] font-bold text-gray-700">Date</TableHead>
                <TableHead className="w-20 text-right text-[11px] font-bold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || isFetching ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="py-2.5">
                        <Skeleton className="h-9 w-11 rounded-md" />
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Skeleton className="h-4 w-32 sm:w-48" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-2.5">
                        <Skeleton className="h-3 w-56" />
                      </TableCell>
                      <TableCell className="text-center py-2.5">
                        <Skeleton className="h-5 w-8 mx-auto rounded-full" />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell py-2.5">
                        <Skeleton className="h-3 w-16" />
                      </TableCell>
                      <TableCell className="text-right py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <Skeleton className="h-7 w-7 rounded-md" />
                          <Skeleton className="h-7 w-7 rounded-md" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ) : filteredBlogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-gray-500 text-xs">
                    No articles found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredBlogs.map((blog) => {
                  const plainExcerpt =
                    blog.content?.replace(/<[^>]*>?/gm, '').trim().slice(0, 80) || '';

                  return (
                    <TableRow key={blog.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="py-2">
                        <div className="h-9 w-11 relative rounded-md overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={blog.imageUrl || '/images/placeholder.webp'}
                            alt={blog.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`https://khushbuwaala.com/blog/${blog.slug || blog.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-gray-900 text-xs hover:text-emerald-700 hover:underline line-clamp-1 inline-flex items-center gap-1"
                            title="Open blog in new tab"
                          >
                            {blog.title}
                            <ExternalLink className="w-3 h-3 text-gray-400 shrink-0" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-2">
                        <p className="text-[11px] text-gray-500 line-clamp-1 leading-relaxed">
                          {plainExcerpt || 'No text content available'}
                        </p>
                      </TableCell>
                      <TableCell className="text-center py-2">
                        <div className="flex items-center justify-center">
                          {togglingId === blog.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                          ) : (
                            <Switch
                              checked={blog.isPublish}
                              onCheckedChange={(checked) => handlePublishToggle(checked, blog)}
                              className="data-[state=checked]:bg-emerald-600 scale-90"
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-[11px] text-gray-500 py-2 whitespace-nowrap">
                        {new Date(blog.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-right py-2">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handleEdit(blog)}
                            title="Edit Article"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-500 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => handleDelete(blog.id)}
                            title="Delete Article"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Controls */}
      {meta && meta.total > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2 px-1">
          <p className="text-[11px] text-gray-500">
            Showing <span className="font-semibold text-gray-700">{filteredBlogs.length}</span> of{' '}
            <span className="font-semibold text-gray-700">{meta.total}</span> blogs (Page {meta.page} of{' '}
            {meta.totalPage})
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isFetching}
              onClick={() => handlePageChange(currentPage - 1)}
              className="text-xs h-7 border-gray-300"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= meta.totalPage || isFetching}
              onClick={() => handlePageChange(currentPage + 1)}
              className="text-xs h-7 border-gray-300"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto text-xs">
          <DialogHeader className="pb-2 border-b border-gray-100">
            <DialogTitle className="text-sm font-bold text-gray-900">
              Edit Article Guide
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleUpdate)} className="space-y-3 pt-2">
            <div>
              <Label htmlFor="title" className="text-[11px] font-semibold text-gray-700">
                Blog Title *
              </Label>
              <Input
                id="title"
                placeholder="Enter blog title"
                {...register('title')}
                className="mt-1 text-xs h-7 bg-white border-gray-300"
              />
              {errors.title && (
                <p className="text-rose-600 text-[10px] mt-0.5">{errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <Label htmlFor="metaTitle" className="text-[11px] font-semibold text-gray-700">
                  SEO Title *
                </Label>
                <Input
                  id="metaTitle"
                  placeholder="Search engine title..."
                  {...register('metaTitle')}
                  className="mt-1 text-xs h-7 bg-white border-gray-300"
                />
              </div>

              <div>
                <Label htmlFor="tags" className="text-[11px] font-semibold text-gray-700 flex items-center gap-1">
                  <Tags className="w-3 h-3 text-emerald-600" /> Tags[cite: 3]
                </Label>
                <Input
                  id="tags"
                  placeholder="Attar, Ruh Khus, Vetiver"
                  {...register('tags')}
                  className="mt-1 text-xs h-7 bg-white border-gray-300"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="metaDescription" className="text-[11px] font-semibold text-gray-700">
                Meta Description *
              </Label>
              <Textarea
                id="metaDescription"
                rows={2}
                placeholder="Snippet under 160 chars..."
                {...register('metaDescription')}
                className="mt-1 text-xs resize-none bg-white border-gray-300"
              />
            </div>

            {/* Cover Banner */}
            <div>
              <Label className="text-[11px] font-semibold text-gray-700">Cover Banner</Label>
              <div className="mt-1 border border-dashed border-gray-300 rounded-lg p-2.5 text-center bg-gray-50/50 hover:bg-gray-50">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload-edit"
                />
                <Label htmlFor="image-upload-edit" className="cursor-pointer block">
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <Upload className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-[11px]">Click to replace banner image</span>
                  </div>
                </Label>
              </div>

              {imagePreview && (
                <div className="mt-2 flex items-center gap-2 p-1.5 bg-gray-50 border rounded-lg">
                  <div className="relative w-12 h-9 rounded overflow-hidden border bg-white shrink-0">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(editingBlog?.imageUrl || null);
                      }}
                      className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="Image Alt Text"
                      {...register('imageAltText')}
                      className="border-gray-300 text-[11px] h-6 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Editor */}
            <div>
              <Label className="text-[11px] font-semibold text-gray-700">Body Content *</Label>
              <div className="mt-1 rounded-lg border border-gray-300 overflow-hidden bg-white">
                <JoditEditor
                  value={blogContent}
                  config={joditConfig}
                  onBlur={(newContent) => setBlogContent(newContent)}
                />
              </div>
            </div>

            {/* Quick Questions / FAQs Builder */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-bold text-gray-900 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600" /> Quick Questions / FAQs Section[cite: 3]
                </Label>
                <Button type="button" size="sm" variant="ghost" onClick={handleAddFaq} className="h-6 text-[11px] text-emerald-700 hover:bg-emerald-50">
                  <Plus className="w-3 h-3 mr-1" /> Add Question
                </Button>
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {faqs.map((faq, index) => (
                  <div key={index} className="p-2 bg-gray-50 border border-gray-200 rounded-lg space-y-1.5 relative">
                    <button type="button" onClick={() => handleRemoveFaq(index)} className="absolute top-1.5 right-1.5 text-rose-500 hover:text-rose-700">
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <Input
                      placeholder={`Question ${index + 1}`}
                      value={faq.question}
                      onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                      className="h-6 text-[11px] bg-white border-gray-300 pr-6"
                    />
                    <Textarea
                      placeholder="Concise expert answer..."
                      value={faq.answer}
                      onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                      className="text-[11px] bg-white border-gray-300 h-8 resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Publish Toggle */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <div>
                <Label htmlFor="isPublish" className="text-[11px] font-bold text-gray-900">Publish Immediately</Label>
                <p className="text-[9px] text-gray-500">Make live on storefront</p>
              </div>
              <Switch
                id="isPublish"
                checked={!!isPublishValue}
                onCheckedChange={(checked) => setValue('isPublish', checked)}
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>

            {/* Dialog Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingBlog(null);
                  reset();
                }}
                className="text-xs h-7 border-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-4 shadow-2xs"
              >
                {isUpdating ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogList;