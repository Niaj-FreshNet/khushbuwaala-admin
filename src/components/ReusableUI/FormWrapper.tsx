'use client';

import { ReactNode, useState } from 'react';
import { FormProvider, useForm, SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface FormWrapperProps {
  children: ReactNode;
  onSubmit: SubmitHandler<any>;
  onReset?: () => void;
  className?: string;
  submitButtonText?: string;
  submitButtonClassName?: string;
  showResetButton?: boolean;
  resetButtonText?: string;
  resetButtonClassName?: string;
  defaultValues?: Record<string, any>;
  resolver?: any;
  successMessage?: string;
  errorMessage?: string;
  resetOnSuccess?: boolean;
}

export default function FormWrapper({
  children,
  onSubmit,
  onReset,
  defaultValues,
  resolver,
  className,
  submitButtonText = 'Submit',
  submitButtonClassName,
  showResetButton = true,
  resetButtonText = 'Reset',
  resetButtonClassName,
  successMessage = 'Form submitted successfully!',
  errorMessage = 'Failed to submit the form. Please try again.',
  resetOnSuccess = false,
}: FormWrapperProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const methods = useForm({ defaultValues, resolver });

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const result = await onSubmit(data);
      if (result !== false) {
        if (resetOnSuccess) methods.reset();
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        errorMessage;
      toast.error(message);
      console.error('Form submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    methods.reset();
    onReset?.();
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(handleSubmit)}
        className={cn('w-full h-fit space-y-4 pb-2', className)}
        noValidate
        encType="multipart/form-data"
      >
        {children}

        {/* Action bar embedded tightly right after form elements to eradicate trailing empty space */}
        <div className="flex items-center justify-end gap-2.5 pt-3 mt-2 border-t border-gray-100">
          {showResetButton && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isSubmitting}
              className={cn(
                'border-gray-300 text-gray-700 hover:bg-gray-100 text-xs h-8 px-4 font-semibold shadow-2xs',
                resetButtonClassName
              )}
            >
              {resetButtonText}
            </Button>
          )}

          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className={cn(
              'bg-[#FB923C] hover:bg-[#ff8a29] text-white text-xs font-bold h-8 px-5 transition-colors duration-200 shadow-2xs',
              isSubmitting && 'opacity-70 cursor-not-allowed',
              submitButtonClassName
            )}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Processing...
              </span>
            ) : (
              submitButtonText
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}