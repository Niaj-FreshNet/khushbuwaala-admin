'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import Image from 'next/image';
import { X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useGetOrderByIdQuery } from '@/redux/store/api/order/ordersApi';
import FormInput from '@/components/ReusableUI/FormInput';
import FormWrapper from '@/components/ReusableUI/FormWrapper';

interface CartItem {
  productId: string;
  name: string;
  imageUrl: string[];
  quantity: number;
  price: number;
  size: string;
  color: string;
}

interface OrderData {
  id: string;
  orderTime: string;
  customerId: string;
  method: string;
  email: string;
  address: string;
  amount: number;
  phone: string;
  isPaid: boolean;
  cartItems: CartItem[];
  status: string;
}

interface ReviewForm {
  title: string;
  comment: string;
  rating: number;
}

const UserOrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, error } = useGetOrderByIdQuery(id);
  // const [addReview, { isLoading: isSubmittingReview }] = useAddReviewMutation();
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedProductName, setSelectedProductName] = useState<string>('');

  const orderData: OrderData = data?.data;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <p className="text-gray-600">Loading order details...</p>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Failed to load order details</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return 'bg-[#4CD964]';
      case 'PENDING':
        return 'bg-orange-500';
      case 'PROCESSING':
        return 'bg-blue-500';
      case 'CANCELLED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleReviewClick = (productId: string, productName: string) => {
    setSelectedProductId(productId);
    setSelectedProductName(productName);
    setIsReviewModalVisible(true);
  };

  const handleReviewSubmit = async (values: ReviewForm) => {
    if (!values.title || !values.comment || values.rating === 0) {
      toast.error('Please fill in all fields and provide a rating');
      return;
    }
    // try {
    //   const res = await addReview({
    //     title: values.title,
    //     comment: values.comment,
    //     rating: values.rating,
    //     productId: selectedProductId,
    //   }).unwrap();
    //   if (res.success) {
    //     toast.success(res.message);
    //     setIsReviewModalVisible(false);
    //   } else {
    //     toast.error(res.error);
    //   }
    // } catch {
    //   toast.error('Failed to submit review');
    // }
  };

  return (
    <div className="p-6 bg-gray-50 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-[#FB923C]">Order Details</h2>
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/order-list')}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="space-y-6">
        <Card className="border-[#FB923C]">
          <CardHeader>
            <CardTitle>Product List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orderData.cartItems.map((item) => (
                <div key={item.productId} className="border rounded-lg p-4">
                  <div className="flex gap-4">
                    <Image
                      src={item.imageUrl[0] || '/placeholder.svg'}
                      alt={item.name}
                      width={100}
                      height={80}
                      className="rounded object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">{item.name}</h4>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <p><span className="text-gray-600">Quantity:</span> {item.quantity}</p>
                        <p><span className="text-gray-600">Price:</span> ${item.price}</p>
                        <p><span className="text-gray-600">Size:</span> {item.size}</p>
                        <p><span className="text-gray-600">Color:</span> {item.color}</p>
                        <p className="col-span-2"><span className="text-gray-600">Subtotal:</span> ${item.price * item.quantity}</p>
                      </div>
                      <Button
                        variant="link"
                        className="text-[#FB923C] mt-2"
                        onClick={() => handleReviewClick(item.productId, item.name)}
                      >
                        Review now
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-[#FB923C]">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Order ID</Label>
                  <Input value={orderData.id.slice(-4)} readOnly className="border-[#FB923C] mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Order Time</Label>
                  <Input
                    value={new Date(orderData.orderTime).toLocaleString()}
                    readOnly
                    className="border-[#FB923C] mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Method</Label>
                  <Input value={orderData.method} readOnly className="border-[#FB923C] mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Shipping Address</Label>
                  <Input value={orderData.address} readOnly className="border-[#FB923C] mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-[#FB923C]">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Email</Label>
                  <Input value={orderData.email} readOnly className="border-[#FB923C] mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Amount</Label>
                  <Input value={`$${orderData.amount}`} readOnly className="border-[#FB923C] mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <Input
                    value={orderData.status}
                    readOnly
                    className={`border-[#FB923C] mt-1 ${getStatusColor(orderData.status)} text-white`}
                  />
                </div>
                <div className="text-right">
                  <Label className="text-sm font-medium text-gray-700">Total Amount</Label>
                  <p className="text-2xl font-semibold text-[#FB923C]">${orderData.amount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card className="border-[#FB923C]">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <Label className="text-sm font-medium text-gray-700">Payment Status</Label>
                <Badge className={orderData.isPaid ? 'bg-[#4CD964]' : 'bg-red-500'}>
                  {orderData.isPaid ? 'PAID' : 'UNPAID'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Dialog open={isReviewModalVisible} onOpenChange={setIsReviewModalVisible}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#FB923C]">Leave a Review for {selectedProductName}</DialogTitle>
          </DialogHeader>
          <FormWrapper
            defaultValues={{ title: '', comment: '', rating: 0 }}
            onSubmit={handleReviewSubmit}
            submitButtonText="Submit Review"
            submitButtonClassName="bg-[#FB923C] hover:bg-[#ff8a29]"
            resetButtonText="Cancel"
            resetButtonClassName="border-[#FB923C] text-[#FB923C]"
          >
            <FormInput
              name="title"
              label="Review Title"
              placeholder="Enter review title"
              required
              inputClassName="border-[#FB923C]"
            />
            <FormInput
              name="comment"
              label="Comment"
              type="textarea"
              placeholder="Write your comment"
              required
              inputClassName="border-[#FB923C]"
            />
            <div>
              <Label className="text-sm font-medium text-gray-700">Rating</Label>
              <Select
                onValueChange={(value) => form.setValue('rating', Number(value))}
                required
              >
                <SelectTrigger className="border-[#FB923C] mt-1">
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} Star{num > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FormWrapper>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserOrderDetails;