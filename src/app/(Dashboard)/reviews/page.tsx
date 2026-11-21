/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import { Search, Trash, Star, MessageSquareText, CheckCircle2 } from 'lucide-react';
import {
  useGetAllReviewsAdminQuery,
  usePublishReviewMutation,
  useDeleteReviewMutation,
} from '@/redux/store/api/review/reviewApi';
import { toast } from 'sonner';

interface ReviewData {
  id: string;
  title: string;
  comment: string;
  rating: number;
  isPublished: boolean;
  createdAt: string;
  user: {
    name: string;
  };
  product: {
    name: string;
  };
}

const ReviewList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading } = useGetAllReviewsAdminQuery();
  const [publishReview, { isLoading: isPublishing }] = usePublishReviewMutation();
  const [deleteReview] = useDeleteReviewMutation();
  const router = useRouter();

  const allReviews: ReviewData[] = useMemo(() => (data as any)?.data?.data || [], [data]);
  const meta = (data as any)?.data?.meta;

  const filteredReviews = useMemo(
    () =>
      allReviews.filter(
        (review) =>
          review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [allReviews, searchTerm]
  );

  const handleTogglePublish = async (checked: boolean, review: ReviewData) => {
    try {
      await publishReview(review.id).unwrap();
      toast.success(`Review ${checked ? 'published' : 'unpublished'} successfully`);
    } catch {
      toast.error('Failed to update publish status');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this review?');
    if (confirmed) {
      try {
        await deleteReview(id).unwrap();
        toast.success('Review deleted successfully');
      } catch {
        toast.error('Failed to delete review');
      }
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-60px)] bg-gray-50/50 px-3 sm:px-4 py-2.5 flex flex-col text-xs">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white px-3.5 py-2.5 rounded-xl border border-gray-200/85 shadow-2xs shrink-0 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-50 rounded-lg text-amber-700 border border-amber-100">
            <MessageSquareText className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">Customer Reviews Management</h1>
            <p className="text-[10px] text-gray-500">Moderate feedback, ratings, and storefront visibility</p>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            placeholder="Search by title, product, or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 border-gray-300 text-xs h-7 bg-white focus-visible:ring-emerald-600"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-3 bg-white rounded-xl border border-gray-200 shadow-2xs">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-[30%]" />
                  <Skeleton className="h-3 w-[50%]" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200/85 bg-white overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/80">
                  <TableRow>
                    <TableHead className="w-28 text-[11px] font-bold text-gray-700">User</TableHead>
                    <TableHead className="min-w-[140px] text-[11px] font-bold text-gray-700">Product</TableHead>
                    <TableHead className="min-w-[140px] text-[11px] font-bold text-gray-700">Title</TableHead>
                    <TableHead className="min-w-[220px] text-[11px] font-bold text-gray-700">Comment</TableHead>
                    <TableHead className="w-24 text-[11px] font-bold text-gray-700">Rating</TableHead>
                    <TableHead className="w-24 text-[11px] font-bold text-gray-700">Date</TableHead>
                    <TableHead className="w-24 text-center text-[11px] font-bold text-gray-700">Published</TableHead>
                    <TableHead className="w-16 text-right text-[11px] font-bold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredReviews.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-gray-500 text-xs">
                        No customer reviews found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReviews.map((review) => (
                      <TableRow key={review.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell className="font-medium text-gray-900 text-xs py-2.5">
                          {review.user?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-gray-700 text-xs font-medium py-2.5 truncate max-w-[160px]">
                          {review.product?.name || 'Unknown Product'}
                        </TableCell>
                        <TableCell className="text-gray-900 font-semibold text-xs py-2.5">
                          {review.title}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <p className="text-xs text-gray-500 line-clamp-2 max-w-[260px] leading-relaxed">
                            {review.comment}
                          </p>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < review.rating
                                    ? 'text-amber-500 fill-amber-500'
                                    : 'text-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500 py-2.5 whitespace-nowrap">
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="text-center py-2.5">
                          <Switch
                            checked={review.isPublished}
                            onCheckedChange={(checked) =>
                              handleTogglePublish(checked, review)
                            }
                            disabled={isPublishing}
                            className="data-[state=checked]:bg-emerald-600 scale-90"
                          />
                        </TableCell>
                        <TableCell className="text-right py-2.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-500 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => handleDelete(review.id)}
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Pagination Footer */}
        {meta && meta.total > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-1 pt-1">
            <p className="text-[11px] text-gray-500">
              Showing <span className="font-semibold text-gray-700">{filteredReviews.length}</span> of{' '}
              <span className="font-semibold text-gray-700">{meta.total}</span> reviews (Page {meta.page} of{' '}
              {meta.totalPage})
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page <= 1}
                onClick={() => router.push(`/reviews?page=${meta.page - 1}`)}
                className="text-xs h-7 border-gray-300"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page >= meta.totalPage}
                onClick={() => router.push(`/reviews?page=${meta.page + 1}`)}
                className="text-xs h-7 border-gray-300"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewList;