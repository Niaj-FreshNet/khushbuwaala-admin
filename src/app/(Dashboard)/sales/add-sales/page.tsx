'use client';

import { useState } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { XCircle } from 'lucide-react';
import { z } from 'zod';
import FormWrapper from '@/components/ReusableUI/FormWrapper';
import FormInput from '@/components/ReusableUI/FormInput';
import productApi, { useGetAllProductsQuery } from '@/redux/store/api/product/productApi';
import { IProductResponse, IProductVariantResponse } from '@/types/product.types';
import { useAuth } from '@/redux/store/hooks/useAuth';
import { useAddToCartMutation } from '@/redux/store/api/cart/cartApi';
import { useAddSaleMutation } from '@/redux/store/api/sales/salesApi';

// ---------------- Validation Schema ----------------
const cartItemSchema = z.object({
    productId: z.string().min(1, 'Product is required'),
    size: z.string().optional(),
    unit: z.string().optional(),
    price: z.number().min(0, 'Price must be non-negative'),
    quantity: z.number().min(1, 'At least 1 quantity required')
});

const formSchema = z.object({
    saleTime: z.string(),
    customerName: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().optional(),
    address: z.string().optional(),
    amount: z.number().min(0),
    method: z.string(),
    isPaid: z.boolean(),
    status: z.string(),
    saleBy: z.string(),
    reference: z.string().optional(),
    cartItems: z.array(cartItemSchema).min(1)
});

interface FormValues extends z.infer<typeof formSchema> { }

// ---------------- Main Component ----------------
const AddSalesPage = () => {
    const { user } = useAuth();
    const { data: allProductsData } = useGetAllProductsQuery({ limit: 100 });
    const allProducts = allProductsData?.data || [];
    const [addToCart] = useAddToCartMutation();
    const [addSale] = useAddSaleMutation();
    const [getProductVariants] = productApi.useLazyGetProductVariantsQuery();

    const [isPaid, setIsPaid] = useState(true);
    const [cartItems, setCartItems] = useState<FormValues['cartItems']>([
        { productId: '', size: '', unit: '', price: 0, quantity: 1 }
    ]);
    const [variantsMap, setVariantsMap] = useState<Record<string, IProductVariantResponse[]>>({});
    const [loadingProductId, setLoadingProductId] = useState<string | null>(null);

    // ---------------- Fetch variants for a product ----------------
    const handleFetchVariants = async (productId: string) => {
        setLoadingProductId(productId);
        try {
            const result = await getProductVariants(productId).unwrap();
            setVariantsMap((prev) => ({ ...prev, [productId]: result?.data || [] }));
        } catch (err) {
            console.error('Failed to fetch variants:', err);
        } finally {
            setLoadingProductId(null);
        }
    };

    // ---------------- Submit Handler ----------------
    const handleSubmit = async (values: FormValues) => {
        const validCartItems = cartItems.filter(ci => ci.productId);
        if (!validCartItems.length) {
            toast.error("Cart is empty");
            return;
        }

        try {
            // 1️⃣ Store cart items to DB first
            const createdCartIds: string[] = [];

            for (const item of validCartItems) {
                const variants = variantsMap[item.productId] || [];
                const selectedVariant = variants.find(v => v.id === item.size);

                const res = await addToCart({
                    productId: item.productId,
                    variantId: selectedVariant?.id || null,
                    size: selectedVariant?.size || item.size || null,   // ✅ actual size from variant
                    unit: selectedVariant?.unit || item.unit || null,   // ✅ actual unit from variant
                    quantity: item.quantity,
                    price: item.price,
                }).unwrap();

                if (res?.data?.id || res?.id) {
                    createdCartIds.push(res.data?.id || res.id);
                }
            }

            if (!createdCartIds.length) {
                toast.error("Failed to create cart items");
                return;
            }

            // 2️⃣ Create Sale (Order) with those cartItemIds
            const payload = {
                cartItemIds: createdCartIds,
                amount: values.amount,
                isPaid,
                method: values.method,
                saleBy: user?.name,
                orderSource: "SHOWROOM",
                saleType: 'SINGLE',
                customerInfo: {
                    name: values.customerName,
                    phone: values.phone,
                    address: values.address || "",
                    email: values.email || "",
                    reference: values.reference || "",
                },
            };

            // console.log("🧾 Final Sale Payload:", payload);

            const res = await addSale(payload).unwrap();
            // console.log(res)

            if (res?.success) {
                toast.success("Sale created successfully!");
                setCartItems([{ productId: "", size: "", unit: "", price: 0, quantity: 1 }]);
            } else {
                toast.error("Sale creation failed");
            }
        } catch (error) {
            console.error("Sale creation error:", error);
            toast.error("Failed to create sale");
        }
    };
    // ---------------- Cart item handlers ----------------
    const handleAddCartItem = () =>
        setCartItems([...cartItems, { productId: '', size: '', unit: '', price: 0, quantity: 1 }]);
    const handleRemoveCartItem = (i: number) =>
        setCartItems((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));

    // ---------------- Render ----------------
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-semibold text-[#FB923C] mb-6">Add Sale</h1>

                <FormWrapper
                    defaultValues={{
                        saleTime: new Date().toISOString(),
                        customerName: '',
                        phone: '',
                        address: '',
                        amount: 0,
                        method: '',
                        isPaid,
                        status: '',
                        saleBy: '',
                        reference: '',
                        cartItems
                    }}
                    onSubmit={handleSubmit}
                    schema={formSchema}
                    submitButtonText="Add Sale"
                    submitButtonClassName="bg-[#FB923C] hover:bg-[#ff8a29] text-white"
                    resetButtonText="Cancel"
                    resetButtonClassName="border-[#FB923C] text-[#FB923C]"
                    resetOnSuccess
                >
                    {/* Cart & Sale Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <Card className="border-[#FB923C]">
                            <CardHeader>
                                <CardTitle>Sale Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormInput name="saleTime" label="Sale Time" type="datetime-local" required inputClassName="border-[#FB923C]" />
                                <FormInput name="status" label="Status" type="select" options={[
                                    { value: 'PENDING', label: 'Pending' },
                                    { value: 'COMPLETED', label: 'Completed' }
                                ]} inputClassName="border-[#FB923C]" />
                                <FormInput name="amount" label="Amount" type="number" inputClassName="border-[#FB923C]" />
                                <FormInput name="method" label="Payment Method" type="select" options={[
                                    { value: 'cash', label: 'Cash' },
                                    { value: 'bkashPayment', label: 'Bkash Payment' },
                                    { value: 'bkashPersonal', label: 'Bkash Personal' },
                                    { value: 'nagadPayment', label: 'Nagad Payment' },
                                    { value: 'nagadPersonal', label: 'Nagad Personal' },
                                    { value: 'rocketPayment', label: 'Rocket Payment' },
                                    { value: 'rocketPersonal', label: 'Rocket Personal' },
                                    { value: 'bankTransfer', label: 'Bank Transfer' },
                                    { value: 'cardPayment', label: 'Card Payment' },
                                    { value: 'cashOnDelivery', label: 'Cash On Delivery' },
                                    { value: 'onlinePayment', label: 'Online Payment' },
                                ]} inputClassName="border-[#FB923C]" />

                                <div className="flex items-center gap-3">
                                    <Label>Paid?</Label>
                                    <Switch checked={isPaid} onCheckedChange={setIsPaid} className={isPaid ? 'bg-[#4CD964]' : 'bg-red-500'} />
                                    <span className="text-sm text-gray-600">{isPaid ? 'Paid' : 'Due'}</span>
                                </div>

                                <FormInput name="saleBy" label="Sale By" type="text" disabled value={user?.name} inputClassName="border-[#FB923C] cursor-not-allowed" />

                                {/* Cart Items */}
                                <Label className="text-sm font-medium text-gray-700">Cart Items</Label>
                                {cartItems.map((item, index) => {
                                    const variants = variantsMap[item.productId] || [];
                                    const selectedVariant = variants.find(v => v.id === item.size);
                                    const actualPrice = selectedVariant?.price || allProducts.find(p => p.id === item.productId)?.price || 0;
                                    const subtotalPrice = actualPrice * item.quantity || actualPrice * 1;
                                    const diff = item.price - subtotalPrice;
                                    const discountPercent = subtotalPrice > 0 ? ((subtotalPrice - item.price) / subtotalPrice) * 100 : 0;

                                    return (
                                        <div key={index} className="border border-[#FB923C]/40 rounded-xl p-4 mb-4 bg-white shadow-sm">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {/* Product Select */}
                                                <div>
                                                    <Label><span className='mb-3 font-semibold'>Product</span></Label>
                                                    <Select value={item.productId} onValueChange={(value) => {
                                                        const selected = allProducts.find(p => p.id === value);
                                                        const updated = [...cartItems];
                                                        updated[index] = { productId: value, size: '', price: selected?.price || 0, quantity: 1 };
                                                        setCartItems(updated);
                                                        handleFetchVariants(value);
                                                    }}>
                                                        <SelectTrigger className="border-[#FB923C]"><SelectValue placeholder="Select Product" /></SelectTrigger>
                                                        <SelectContent className="max-h-64">{allProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Variant Select */}
                                                <div>
                                                    <Label><span className='mb-3 font-semibold'>Variant</span></Label>
                                                    <Select value={item.size} disabled={!item.productId} onValueChange={(value) => {
                                                        const variant = variants.find(v => v.id === value);
                                                        const updated = [...cartItems];
                                                        updated[index].size = value;
                                                        updated[index].price = variant?.price || 0;
                                                        setCartItems(updated);
                                                    }}>
                                                        <SelectTrigger className="border-[#FB923C]"><SelectValue placeholder="Select Size" /></SelectTrigger>
                                                        <SelectContent>
                                                            {loadingProductId === item.productId ? <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
                                                                : variants.length === 0 ? <div className="px-3 py-2 text-sm text-gray-500">No variants</div>
                                                                    : variants.map(v => <SelectItem key={v.id} value={v.id}>{v.size} {v.unit}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Quantity */}
                                                <div>
                                                    <FormInput name={`cartItems[${index}].quantity`} label="Quantity" type="number" value={item.quantity} onChange={(e) => {
                                                        const updated = [...cartItems];
                                                        updated[index].quantity = Math.max(1, Number(e.target.value) || 1);
                                                        setCartItems(updated);
                                                    }} inputClassName="border-[#FB923C] w-28" />
                                                </div>
                                            </div>

                                            {/* Price + Diff */}
                                            <div className="col-span-2 md:col-span-2">
                                                <div className="flex flex-grow items-center gap-3 mt-1">
                                                    <FormInput
                                                        label="Price"
                                                        name={`cartItems[${index}].price`}
                                                        type="number"
                                                        required
                                                        placeholder={`${subtotalPrice}`}
                                                        value={item.price}
                                                        onChange={(e) => {
                                                            const updated = [...cartItems];
                                                            updated[index].price = Number(e.target.value);
                                                            setCartItems(updated);
                                                        }}
                                                        inputClassName="border-[#FB923C] w-28"
                                                    />
                                                    <div className="text-gray-700 text-center text-sm">
                                                        Actual:{' '}
                                                        <span className="font-semibold text-gray-900">
                                                            ৳{subtotalPrice}
                                                        </span>
                                                    </div>
                                                    <div
                                                        className={`text-md text-center px-2 rounded ${diff < 0
                                                            ? 'bg-green-100 text-green-700'
                                                            : diff > 0
                                                                ? 'bg-red-100 text-red-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                            }`}
                                                    >
                                                        Discount:{' '}
                                                        <span className='font-bold'>{discountPercent.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="text-sm text-center text-gray-600">
                                                        Difference:{' '}
                                                        {diff === 0
                                                            ? '৳0'
                                                            : diff > 0
                                                                ? `+৳${diff}`
                                                                : `-৳${Math.abs(diff)}`}
                                                    </div>
                                                </div>
                                            </div>

                                            {cartItems.length > 1 && (
                                                <div className='-mb-2 mt-2'>
                                                    <Button type='button' variant="ghost" size="icon" onClick={() => handleRemoveCartItem(index)} className="text-white bg-red-500 hover:bg-red-400">
                                                        <XCircle className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                <Button type="button" variant="outline" onClick={handleAddCartItem} className="border-[#FB923C] text-[#FB923C] hover:bg-[#FB923C] hover:text-white">
                                    + Add Cart Item
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Right Column - Customer Details */}
                        <Card className="border-[#FB923C]">
                            <CardHeader><CardTitle>Customer Details</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <FormInput name="customerName" label="Customer Name" placeholder="Enter name" inputClassName="border-[#FB923C]" />
                                <FormInput name="phone" label="Phone" placeholder="Enter phone" inputClassName="border-[#FB923C]" />
                                <FormInput name="email" label="Email" placeholder="Enter email" inputClassName="border-[#FB923C]" />
                                <FormInput name="address" label="Address" type="textarea" placeholder="Enter address" inputClassName="border-[#FB923C]" />
                                <FormInput name="reference" label="Reference" placeholder="Optional" inputClassName="border-[#FB923C]" />
                            </CardContent>
                        </Card>
                    </div>
                </FormWrapper>
            </div>
        </div>
    );
};

export default AddSalesPage;