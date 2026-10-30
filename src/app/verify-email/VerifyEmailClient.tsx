'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { otpSchema } from '@/schemas/auth.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    useUserVerificationMutation,
    useResendOtpMutation,
} from '@/redux/store/api/auth/authApi';
import { toast } from 'sonner';
import Link from 'next/link';
import { Loader2, CheckCircle2, RotateCw } from 'lucide-react';
import AuthLayout from '@/components/Layout/AuthLayout/AuthLayout';
import FormInput from '@/components/ReusableUI/FormInput';
import { useDispatch } from 'react-redux';
import { jwtDecode } from 'jwt-decode';
import { setUser } from '@/redux/store/features/auth/authSlice';
import { TUser } from '@/types/auth.types';

export default function VerifyEmailClient() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const dispatch = useDispatch();

    const [resendCooldown, setResendCooldown] = useState(0);

    const [verifyUser, { isLoading: isVerifying }] =
        useUserVerificationMutation();

    const [resendOtp, { isLoading: isResendingOtp }] =
        useResendOtpMutation();

    const email = searchParams.get('email');
    const redirect = searchParams.get('redirect');

    const methods = useForm<{ token: string }>({
        resolver: zodResolver(otpSchema),
        defaultValues: {
            token: '',
        },
    });

    useEffect(() => {
        if (!email) {
            router.push('/sign-up');
        }
    }, [email, router]);

    // Resend OTP countdown
    useEffect(() => {
        if (resendCooldown <= 0) return;

        const timer = setInterval(() => {
            setResendCooldown((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [resendCooldown]);

    const handleSubmit = async (data: { token: string }) => {
        if (!email) return;

        try {
            const res = await verifyUser({ email, ...data }).unwrap();

            const accessToken = res?.data?.accessToken || res?.accessToken;

            if (!accessToken) {
                throw new Error('Token missing');
            }

            const decoded = jwtDecode<TUser>(accessToken);

            dispatch(
                setUser({
                    user: decoded,
                    accessToken,
                })
            );

            toast.success('Email verified successfully!');
            router.push(redirect || '/');
        } catch (error: any) {
            toast.error(
                error?.data?.message || 'OTP verification failed.'
            );
        }
    };

    const handleResendOtp = async () => {
        if (!email || resendCooldown > 0 || isResendingOtp) return;

        try {
            await resendOtp({ email }).unwrap();

            // Allow another resend after 30 seconds
            setResendCooldown(30);

            toast.success('New OTP sent successfully!');
        } catch (error: any) {
            toast.error(
                error?.data?.message || 'Failed to resend OTP.'
            );
        }
    };

    return (
        <AuthLayout
            title="Verify Your Email"
            subtitle={
                email
                    ? `We've sent a 6-digit code to ${email}`
                    : 'Enter verification code'
            }
        >
            <div className="w-full max-w-md mx-auto">
                <FormProvider {...methods}>
                    <form
                        onSubmit={methods.handleSubmit(handleSubmit)}
                        className="space-y-4"
                        noValidate
                    >
                        <FormInput
                            name="token"
                            label="Verification Code (OTP)"
                            type="text"
                            placeholder="e.g. 123456"
                            required
                            inputClassName="tracking-widest text-center text-lg"
                        />

                        <button
                            type="submit"
                            disabled={isVerifying}
                            className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-stone-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-[0.99] transition-all shadow-md shadow-amber-500/20 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isVerifying ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Verifying...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Verify Email</span>
                                </>
                            )}
                        </button>
                    </form>
                </FormProvider>

                {/* Resend OTP Section */}
                <div className="text-center mt-6 pt-4 border-t border-stone-800">
                    <p className="text-xs text-stone-400 mb-2">
                        Didn&apos;t receive the code?
                    </p>

                    <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={
                            isResendingOtp || resendCooldown > 0
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isResendingOtp ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Sending code...</span>
                            </>
                        ) : resendCooldown > 0 ? (
                            <>
                                <RotateCw className="w-3.5 h-3.5" />
                                <span>
                                    Resend code in {resendCooldown}s
                                </span>
                            </>
                        ) : (
                            <>
                                <RotateCw className="w-3.5 h-3.5" />
                                <span>
                                    Resend Verification Code
                                </span>
                            </>
                        )}
                    </button>
                </div>

                <div className="text-center mt-4">
                    <Link
                        href="/sign-up"
                        className="text-xs text-stone-500 hover:text-stone-300 transition-colors"
                    >
                        Wrong email? Go back to register
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}