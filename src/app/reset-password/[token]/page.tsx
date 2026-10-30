// File: app/reset-password/[token]/page.tsx
'use client';

import { useRouter, useParams } from 'next/navigation';
import { resetPasswordSchema } from '@/schemas/auth.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import AuthLayout from '@/components/Layout/AuthLayout/AuthLayout';
import FormWrapper from '@/components/ReusableUI/FormWrapper';
import FormInput from '@/components/ReusableUI/FormInput';
import { useResetPasswordMutation } from '@/redux/store/api/auth/authApi';

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const router = useRouter();
  const params = useParams();

  // Extract token from dynamic route path parameters
  const token = params?.token as string;

  const handleSubmit = async (data: { password: string; confirmPassword: string }) => {
    try {
      // Pass token and new password to your API backend slice
      await resetPassword({ token, password: data.password }).unwrap();
      toast.success('Password reset successfully! Please log in.');
      router.push('/login');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to reset password.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-stone-100/60 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-stone-200/80 p-8 sm:p-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-serif">
            Reset Password
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Enter your new password below.
          </p>
        </div>

        <FormWrapper
          resolver={zodResolver(resetPasswordSchema)}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="relative">
            <FormInput
              name="password"
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-8.5 text-stone-400 hover:text-stone-600 p-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative">
            <FormInput
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-8.5 text-stone-400 hover:text-stone-600 p-1"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 active:scale-[0.99] transition-all shadow-md shadow-green-600/20 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <span>Reset Password</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </FormWrapper>

        <p className="text-center mt-6 text-sm text-stone-500">
          Back to{' '}
          <Link href="/login" className="text-green-600 font-semibold hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}