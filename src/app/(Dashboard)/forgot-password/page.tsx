'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { forgotPasswordSchema } from '@/schemas/auth.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import Link from 'next/link';
import { Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import AuthLayout from '@/components/Layout/AuthLayout/AuthLayout';
import FormInput from '@/components/ReusableUI/FormInput';
import { useForgotPasswordMutation } from '@/redux/store/api/auth/authApi';

export default function ForgotPassword() {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const methods = useForm<{ email: string }>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleSubmit = async (data: { email: string }) => {
    try {
      await forgotPassword(data).unwrap();
      toast.success('Password reset link sent to your email!');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to send reset link.');
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your registered email and we'll send you recovery instructions."
    >
      <div className="w-full max-w-md mx-auto">
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(handleSubmit)}
            className="space-y-4"
            noValidate
          >
            <FormInput
              name="email"
              label="Registered Email"
              type="email"
              placeholder="your@email.com"
              required
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-stone-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-[0.99] transition-all shadow-md shadow-amber-500/20 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Link...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </FormProvider>

        <div className="text-center mt-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Log In</span>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}