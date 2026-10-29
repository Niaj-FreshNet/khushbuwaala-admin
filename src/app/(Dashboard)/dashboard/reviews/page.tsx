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
import { Search, Trash, Star } from 'lucide-react';
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
  const { data, isLoading } = useGetAllReviewsAdminQuery({});
  const [publishReview, { isLoading: isPublishing }] = usePublishReviewMutation();
  const [deleteReview] = useDeleteReviewMutation();
  const router = useRouter();

  const allReviews: ReviewData[] = useMemo(() => data?.data?.data || [], [data]);
  const meta = data?.data?.meta;

  const filteredReviews = useMemo(
    () =>
      allReviews.filter((review) =>
        review.title.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [allReviews, searchTerm]
  );

  const handleTogglePublish = async (checked: boolean, review: ReviewData) => {
    try {
      await publishReview(review.id).unwrap();
      toast.success(`Review ${checked ? 'published' : 'unpublished'} successfully`);
    } catch (error) {
      toast.error('Failed to update publish status');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this review?');
    if (confirmed) {
      try {
        await deleteReview(id).unwrap();
        toast.success('Review deleted successfully');
      } catch (error) {
        toast.error('Failed to delete review');
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ✅ Section Title */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold text-gray-800 tracking-tight">
            Customer Reviews Management
          </h1>
          <Input
            placeholder="Search by review title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-80 border-[#FB923C] focus:ring-[#FB923C]"
          />
        </div>

        {/* ✅ Skeleton Loader */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-3 bg-white rounded-lg shadow">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-[40%]" />
                  <Skeleton className="h-4 w-[60%]" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* ✅ Reviews Table */}
            <Table className="border border-[#FB923C]/40 rounded-lg shadow-md bg-white">
              <TableHeader>
                <TableRow className="bg-[#FB923C]/10">
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredReviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                      No reviews found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReviews.map((review) => (
                    <TableRow key={review.id} className="hover:bg-gray-50 transition">
                      <TableCell>{review.user?.name || 'N/A'}</TableCell>
                      <TableCell className="font-medium text-gray-700">
                        {review.product?.name || 'Unknown'}
                      </TableCell>
                      <TableCell className="font-medium">{review.title}</TableCell>
                      <TableCell>
                        <div className="max-w-[280px] truncate text-gray-600">{review.comment}</div>
                      </TableCell>
                      <TableCell>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? 'text-[#FB923C] fill-[#FB923C]'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={review.isPublished}
                          onCheckedChange={(checked) =>
                            handleTogglePublish(checked, review)
                          }
                          disabled={isPublishing}
                          className="data-[state=checked]:bg-[#4CD964]"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(review.id)}
                        >
                          <Trash className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* ✅ Pagination Footer */}
            {meta && (
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-gray-600">
                  Showing {filteredReviews.length} of {meta.total} reviews
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={meta.page === 1}
                    onClick={() =>
                      router.push(`/dashboard/reviews?page=${meta.page - 1}`)
                    }
                    className="border-[#FB923C] text-[#FB923C]"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={meta.page >= meta.totalPage}
                    onClick={() =>
                      router.push(`/dashboard/reviews?page=${meta.page + 1}`)
                    }
                    className="border-[#FB923C] text-[#FB923C]"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewList;
