/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';

import { signUpSchema } from '@/schemas/auth.schema';
import { useRegisterMutation } from '@/redux/store/api/auth/authApi';
import AuthLayout from '@/components/Layout/AuthLayout/AuthLayout';
import FormInput from '@/components/ReusableUI/FormInput';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerUser, { isLoading }] = useRegisterMutation();
  const router = useRouter();

  const methods = useForm<z.infer<typeof signUpSchema> & { role: string }>({
    resolver: zodResolver(signUpSchema.extend({ role: z.string().min(1, "Please select a role") })),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'INVESTOR',
      agree: false,
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = methods;

  const onSubmit = async (data: any) => {
    const { fullName, email, password, role } = data;
    const name = fullName;

    try {
      await registerUser({ name, email, password, role }).unwrap();
      toast.success('Please verify your email.');
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
        error?.message ||
        'Sign-up failed. Please try again.'
      );
    }
  };

  const onInvalid = (formErrors: any) => {
    console.error('Validation errors:', formErrors);
    const firstError = Object.values(formErrors)[0] as any;
    if (firstError?.message) {
      toast.error(firstError.message);
    }
  };

  return (
    <AuthLayout title="Create Account">
      <div className="w-full max-w-md mx-auto">
        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(onSubmit, onInvalid)}
            className="space-y-4"
            noValidate
          >
            {/* Full Name */}
            <FormInput
              name="fullName"
              label="Full Name"
              type="text"
              placeholder="Enter your full name"
              required
            />

            {/* Email */}
            <FormInput
              name="email"
              label="Your Email"
              type="email"
              placeholder="your@email.com"
              required
            />

            {/* Role Selection Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700">Select Role</label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="w-full bg-white h-10 text-xs font-semibold">
                      <SelectValue placeholder="Select your portal role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INVESTOR">Investor</SelectItem>
                      <SelectItem value="SALESMAN">Salesman</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && (
                <p className="text-xs text-rose-500 mt-1">
                  {errors.role.message as string}
                </p>
              )}
            </div>

            {/* Password */}
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
                className="absolute right-3.5 top-6.5 sm:top-8.5 text-stone-400 hover:text-stone-700 transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <FormInput
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                className="absolute right-3.5 top-6.5 sm:top-8.5 text-stone-400 hover:text-stone-700 transition-colors p-1"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Terms and Conditions Checkbox */}
            <div className="pt-2">
              <div className="flex items-start gap-2.5">
                <Controller
                  name="agree"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="agree"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      className="h-5.5! min-h-0! py-0 shrink-0 -mt-1 sm:-mt-1 rounded-full border-stone-300 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 data-[state=checked]:text-white focus-visible:ring-1 focus-visible:ring-amber-500 cursor-pointer"
                    />
                  )}
                />

                <label
                  htmlFor="agree"
                  className="text-xs text-stone-600 leading-tight cursor-pointer select-none"
                >
                  I agree to the{' '}
                  <Link
                    href="/terms"
                    className="text-amber-600 hover:text-amber-700 font-medium hover:underline transition-colors"
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="/privacy"
                    className="text-amber-600 hover:text-amber-700 font-medium hover:underline transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {errors.agree && (
                <p className="text-xs text-rose-500 mt-1 pl-6">
                  {errors.agree.message as string}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 active:scale-[0.99] transition-all shadow-md shadow-green-600/20 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>
        </FormProvider>

        {/* Footer */}
        <p className="text-center mt-6 text-sm text-stone-500">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-blue-700 hover:text-blue-800 font-semibold hover:underline transition-colors"
          >
            Log In
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}