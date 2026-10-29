'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Link from 'next/link';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import Cookies from 'js-cookie';

import { loginSchema } from '@/schemas/auth.schema';
import { TUser } from '@/types/auth.types';
import AuthLayout from '@/components/Layout/AuthLayout/AuthLayout';
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

            localStorage.setItem('accessToken', accessToken);
            Cookies.set('accessToken', accessToken);

            dispatch(setUser({ user: decoded, accessToken }));

            toast.success('Welcome back!', { duration: 1000 });

            router.refresh();
            router.push(redirect || '/my-account');
        } catch (error: any) {
            toast.error(
                error?.data?.message ||
                error?.message ||
                'Login failed. Please check your credentials.'
            );
        }
    };

    return (
        <AuthLayout title="Welcome Back!">
            <div className="w-full max-w-md mx-auto">
                <FormProvider {...methods}>
                    <form
                        onSubmit={methods.handleSubmit(handleSubmit)}
                        className="space-y-4"
                        noValidate
                    >
                        {/* Email Field */}
                        <FormInput
                            name="email"
                            label="Your Email"
                            type="email"
                            placeholder="your@email.com"
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
                                    className="absolute right-3.5 top-6.5 sm:top-8.5 text-stone-400 hover:text-stone-200 transition-colors p-1"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            <div className="flex justify-end mt-1.5">
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
                            className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-stone-950 bg-green-600 hover:bg-green-700 active:scale-[0.99] transition-all shadow-md shadow-amber-500/20 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Signing in...</span>
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

                {/* Footer */}
                <p className="text-center mt-6 text-sm text-stone-400">
                    Don&apos;t have an account?{' '}
                    <Link
                        href="/sign-up"
                        className="text-gray-900 hover:text-black font-semibold hover:underline transition-colors"
                    >
                        Create Account
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}