/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Link from 'next/link';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import Cookies from 'js-cookie';

import { loginSchema } from '@/schemas/auth.schema';
import { TUser } from '@/types/auth.types';
import FormInput from '@/components/ReusableUI/FormInput';
import { useLogInMutation } from '@/redux/store/api/auth/authApi';
import { setUser } from '@/redux/store/features/auth/authSlice';

export default function LoginForm() {
    const searchParams = useSearchParams();
    const [showPassword, setShowPassword] = useState(false);
    const [logIn, { isLoading }] = useLogInMutation();
    const router = useRouter();
    const dispatch = useDispatch();

    const redirect = searchParams.get('redirect');

    const methods = useForm<{ email: string; password: string }>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const handleSubmit = async (data: { email: string; password: string }) => {
        try {
            const res = await logIn(data).unwrap();
            const accessToken = res?.data?.accessToken;

            if (!accessToken) {
                throw new Error('Token missing');
            }

            const decoded = jwtDecode<TUser>(accessToken);

            // Check if user has administrative privileges
            const role = decoded?.role?.toUpperCase();
            const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

            if (!isAdmin) {
                toast.error('Access denied. Administrator privileges required.');
                return;
            }

            // Set cookies with proper configuration
            localStorage.setItem('accessToken', accessToken);
            Cookies.set('accessToken', accessToken, { path: '/' });

            dispatch(setUser({ user: decoded, accessToken }));

            toast.success('Welcome back, Admin!', { duration: 1000 });

            // Force redirection exclusively to dashboard since this is the admin panel portal
            const targetPath = redirect || '/dashboard';
            window.location.href = targetPath;

        } catch (error: any) {
            toast.error(
                error?.data?.message ||
                error?.message ||
                'Login failed. Please check your credentials.'
            );
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-stone-100/60 px-4 py-12">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-stone-200/80 p-8 sm:p-10">

                {/* Admin Portal Header Branding */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-50 text-green-600 mb-3 shadow-inner">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-serif">
                        Admin Portal
                    </h1>
                </div>

                <FormProvider {...methods}>
                    <form
                        onSubmit={methods.handleSubmit(handleSubmit)}
                        className="space-y-4"
                        noValidate
                    >
                        {/* Email Field */}
                        <FormInput
                            name="email"
                            label="Email"
                            type="email"
                            placeholder="admin@khushbuwaala.com"
                            required
                        />

                        {/* Password Field */}
                        <div>
                            <div className="relative">
                                <FormInput
                                    name="password"
                                    label="Password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    className="absolute right-3.5 top-8.5 text-stone-400 hover:text-stone-600 transition-colors p-1"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            <div className="flex justify-end mt-2">
                                <Link
                                    href="/forgot-password"
                                    className="text-xs font-medium text-orange-600 hover:text-orange-700 hover:underline transition-colors"
                                >
                                    Forgot your password?
                                </Link>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 active:scale-[0.99] transition-all shadow-md shadow-green-600/20 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Authenticating...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </FormProvider>

                {/* Footer Note */}
                <div className="mt-8 pt-6 border-t border-stone-100 text-center">
                    <p className="text-xs text-stone-400">
                    </p>
                </div>
            </div>
        </div>
    );
}