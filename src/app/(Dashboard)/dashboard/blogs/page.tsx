'use client';

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, Edit, Trash, X, Upload, Loader2 } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  useGetAdminBlogsQuery,
  useUpdateBlogMutation,
  useDeleteBlogMutation,
} from '@/redux/store/api/blog/blogApi';

// Prevent SSR hydration mismatch with Jodit
const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

interface BlogData {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  isPublish: boolean;
  createdAt: string;
  updatedAt: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
}

const formSchema = z.object({
  title: z
    .string()
    .min(1, 'Blog title is required')
    .max(120, 'Title must be 120 characters or less'),
  metaTitle: z
    .string()
    .min(1, 'SEO title is required')
    .max(70, 'SEO title must be 70 characters or less'),
  metaDescription: z
    .string()
    .min(1, 'Meta description is required')
    .max(160, 'Meta description must be 160 characters or less'),
  keywords: z.string().optional(),
  isPublish: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const joditConfig = {
  readonly: false,
  height: 320,
  toolbar: true,
  spellcheck: true,
  language: 'en',
  toolbarButtonSize: 'small' as const,
  toolbarAdaptive: false,
  showCharsCounter: false,
  showWordsCounter: false,
  showXPathInStatusbar: false,
  askBeforePasteHTML: false,
  askBeforePasteFromWord: false,
  buttons: [
    'bold',
    'italic',
    'underline',
    'strikethrough',
    '|',
    'ul',
    'ol',
    '|',
    'font',
    'fontsize',
    'paragraph',
    '|',
    'align',
    'link',
    'image',
    'table',
    '|',
    'undo',
    'redo',
  ],
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

  // Sync state with URL parameter if it changes
  useEffect(() => {
    setCurrentPage(pageParam);
  }, [pageParam]);

  // Query passing dynamic page
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

  // Handle data mapping cleanly based on backend response shape
  const allBlogs: BlogData[] = useMemo(() => {
    return data?.data?.data || data?.data || [];
  }, [data]);

  const meta = data?.data?.meta;

  const filteredBlogs = useMemo(() => {
    return allBlogs.filter((blog) =>
      blog.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allBlogs, searchTerm]);

  // Cleanup object URLs to avoid memory leaks
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

    setValue('title', blog.title);
    setValue('metaTitle', blog.metaTitle || blog.title);
    setValue('metaDescription', blog.metaDescription || '');
    setValue('keywords', blog.keywords || '');
    setValue('isPublish', blog.isPublish);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this blog?')) {
      return;
    }

    try {
      await deleteBlog(id).unwrap();
      toast.success('Blog deleted successfully');
    } catch {
      toast.error('Failed to delete blog');
    }
  };

  const handlePublishToggle = async (checked: boolean, blog: BlogData) => {
    try {
      const formData = new FormData();
      formData.append('isPublish', checked.toString());
      formData.append('title', blog.title);
      formData.append('content', blog.content);
      if (blog.imageUrl) formData.append('imageUrl', blog.imageUrl);
      if (blog.metaTitle) formData.append('metaTitle', blog.metaTitle);
      if (blog.metaDescription) formData.append('metaDescription', blog.metaDescription);
      if (blog.keywords) formData.append('keywords', blog.keywords);

      await updateBlog({ id: blog.id, data: formData }).unwrap();
      toast.success(checked ? 'Blog published' : 'Blog unpublished');
    } catch {
      toast.error('Failed to change publish status');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isJpgOrPng =
        file.type === 'image/jpeg' ||
        file.type === 'image/png' ||
        file.type === 'image/webp';
      const isLt25M = file.size / 1024 / 1024 < 25;

      if (!isJpgOrPng) {
        toast.error('Upload only JPG, PNG, or WEBP images.');
        return;
      }
      if (!isLt25M) {
        toast.error('Image must be smaller than 25MB.');
        return;
      }

      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUpdate = async (formDataValues: FormValues) => {
    if (!editingBlog) return;
    if (!blogContent || blogContent.trim() === '<p><br></p>') {
      toast.error('Blog content is required');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', formDataValues.title);
      formData.append('metaTitle', formDataValues.metaTitle);
      formData.append('metaDescription', formDataValues.metaDescription);
      if (formDataValues.keywords) formData.append('keywords', formDataValues.keywords);
      formData.append('content', blogContent);
      formData.append('isPublish', formDataValues.isPublish.toString());

      if (imageFile) {
        formData.append('image', imageFile);
      } else if (editingBlog.imageUrl) {
        formData.append('imageUrl', editingBlog.imageUrl);
      }

      await updateBlog({ id: editingBlog.id, data: formData }).unwrap();
      toast.success('Blog updated successfully');

      setIsEditModalOpen(false);
      setEditingBlog(null);
      setBlogContent('');
      setImageFile(null);
      setImagePreview(null);
      reset();
    } catch {
      toast.error('Failed to update blog');
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    router.push(`/dashboard/blogs?page=${newPage}`);
  };

  return (
    <div className="p-6 bg-white min-h-[calc(100vh-64px)]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 border-gray-200 focus-visible:ring-emerald-600"
            />
          </div>

          <Button
            className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 shadow-sm"
            onClick={() => router.push('/dashboard/blogs/add')}
          >
            <Plus className="w-4 h-4" /> Add New Blog
          </Button>
        </div>

        {/* Blog Table */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-gray-50/75">
              <TableRow>
                <TableHead className="w-20">Image</TableHead>
                <TableHead className="min-w-[180px]">Title</TableHead>
                <TableHead className="min-w-[260px]">Excerpt</TableHead>
                <TableHead className="w-24 text-center">Status</TableHead>
                <TableHead className="w-32">Created Date</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || isFetching ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-44 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
                      Loading articles...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredBlogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-gray-500 text-sm">
                    No articles found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredBlogs.map((blog) => {
                  const plainExcerpt =
                    blog.content?.replace(/<[^>]*>?/gm, '').trim().slice(0, 100) || '';

                  return (
                    <TableRow key={blog.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="h-12 w-14 relative rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={blog.imageUrl || '/images/placeholder.webp'}
                            alt={blog.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900 text-sm">
                        {blog.title}
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {plainExcerpt || 'No text content available'}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={blog.isPublish}
                          onCheckedChange={(checked) => handlePublishToggle(checked, blog)}
                          className="data-[state=checked]:bg-emerald-600"
                        />
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {new Date(blog.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-600 hover:text-emerald-700"
                            onClick={() => handleEdit(blog)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-600 hover:text-red-600"
                            onClick={() => handleDelete(blog.id)}
                          >
                            <Trash className="w-4 h-4" />
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

        {/* Pagination Controls */}
        {meta && meta.total > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
            <p className="text-xs text-gray-500">
              Showing <span className="font-medium">{filteredBlogs.length}</span> of{' '}
              <span className="font-medium">{meta.total}</span> blogs (Page {meta.page} of{' '}
              {meta.totalPage})
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1 || isFetching}
                onClick={() => handlePageChange(currentPage - 1)}
                className="text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= meta.totalPage || isFetching}
                onClick={() => handlePageChange(currentPage + 1)}
                className="text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900">
                Edit Article
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit(handleUpdate)} className="space-y-5 pt-2">
              {/* Title */}
              <div>
                <Label htmlFor="title" className="text-xs font-semibold text-gray-700">
                  Blog Title *
                </Label>
                <Input
                  id="title"
                  placeholder="Enter blog title"
                  {...register('title')}
                  className="mt-1"
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
                )}
              </div>

              {/* SEO Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="metaTitle" className="text-xs font-semibold text-gray-700">
                    Meta Title (SEO) *
                  </Label>
                  <Input
                    id="metaTitle"
                    placeholder="Short SEO title"
                    {...register('metaTitle')}
                    className="mt-1"
                  />
                  {errors.metaTitle && (
                    <p className="text-red-500 text-xs mt-1">{errors.metaTitle.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="keywords" className="text-xs font-semibold text-gray-700">
                    Keywords (Comma-separated)
                  </Label>
                  <Input
                    id="keywords"
                    placeholder="attar, oud, perfume oil"
                    {...register('keywords')}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="metaDescription" className="text-xs font-semibold text-gray-700">
                  Meta Description (Max 160 characters) *
                </Label>
                <Textarea
                  id="metaDescription"
                  rows={2}
                  placeholder="Summary for search engines..."
                  {...register('metaDescription')}
                  className="mt-1 resize-none"
                />
                {errors.metaDescription && (
                  <p className="text-red-500 text-xs mt-1">{errors.metaDescription.message}</p>
                )}
              </div>

              {/* Image Upload Area */}
              <div>
                <Label className="text-xs font-semibold text-gray-700">Cover Banner</Label>
                <div className="mt-1 border-2 border-dashed border-gray-200 hover:border-emerald-600 rounded-xl p-4 text-center transition-colors">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload-edit"
                  />
                  <Label htmlFor="image-upload-edit" className="cursor-pointer block">
                    <div className="flex flex-col items-center">
                      <Upload className="w-6 h-6 text-gray-400 mb-1" />
                      <p className="text-xs font-medium text-gray-700">Click to replace image</p>
                      <p className="text-[11px] text-gray-400">JPG, PNG, or WEBP (Max 25MB)</p>
                    </div>
                  </Label>
                </div>

                {imagePreview && (
                  <div className="mt-3 relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-36 h-20 object-cover rounded-lg border border-gray-200 shadow-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 bg-white hover:bg-gray-100 rounded-full h-6 w-6 shadow-sm border border-gray-200"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(editingBlog?.imageUrl || null);
                      }}
                    >
                      <X className="w-3.5 h-3.5 text-gray-600" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Editor */}
              <div>
                <Label className="text-xs font-semibold text-gray-700">Content *</Label>
                <div className="mt-1 rounded-lg border border-gray-200 overflow-hidden">
                  <JoditEditor
                    value={blogContent}
                    config={joditConfig}
                    onBlur={(newContent) => setBlogContent(newContent)}
                  />
                </div>
              </div>

              {/* Publish Toggle */}
              <div className="flex items-center gap-3 py-1">
                <Switch
                  id="isPublish"
                  checked={!!isPublishValue}
                  onCheckedChange={(checked) => setValue('isPublish', checked)}
                  className="data-[state=checked]:bg-emerald-600"
                />
                <Label htmlFor="isPublish" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Publish to storefront immediately
                </Label>
              </div>

              {/* Dialog Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingBlog(null);
                    reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white min-w-[120px]"
                >
                  {isUpdating ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
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
    </div>
  );
};

export default BlogList;