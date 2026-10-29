// File: app/reset-password/[token]/page.tsx
'use client';

import { useRouter, useParams } from 'next/navigation';
import { resetPasswordSchema } from '@/schemas/auth.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
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
  const { token } = useParams();

  const handleSubmit = async (data: { password: string; confirmPassword: string }) => {
    try {
      await resetPassword({ token: token as string, password: data.password }).unwrap();
      toast.success('Password reset successfully! Please log in.');
      router.push('/login');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to reset password.');
    }
  };

  return (
    <AuthLayout title="Reset Password">
      <p className="text-center mb-6 text-sm text-gray-600">
        Enter your new password below.
      </p>
      <FormWrapper
        resolver={zodResolver(resetPasswordSchema)}
        onSubmit={handleSubmit}
        successMessage="Password reset successfully!"
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
            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </FormWrapper>
      <p className="text-center mt-4 text-sm">
        Back to{' '}
        <Link href="/login" className="text-indigo-600 font-semibold hover:underline">
          Log In
        </Link>
      </p>
    </AuthLayout>
  );
}