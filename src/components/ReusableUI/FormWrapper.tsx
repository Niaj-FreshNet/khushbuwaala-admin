'use client';

import { ReactNode, useState } from 'react';
import { FormProvider, useForm, type DefaultValues, type FieldValues, type Resolver, type UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { apiErrorMessage } from "@/lib/apiError";

interface FormWrapperProps<T extends FieldValues> {
  children: ReactNode;
  /** return false to keep the form as it is (no reset); `form` lets the page mark fields with server errors */
  onSubmit: (data: T, form: UseFormReturn<T>) => unknown;
  onReset?: () => void;
  className?: string;
  submitButtonText?: string;
  submitButtonClassName?: string;
  showResetButton?: boolean;
  resetButtonText?: string;
  resetButtonClassName?: string;
  defaultValues?: DefaultValues<T>;
  resolver?: Resolver<T>;
  errorMessage?: string;
  resetOnSuccess?: boolean;
}

export default function FormWrapper<T extends FieldValues>({
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
  errorMessage = 'Failed to submit the form. Please try again.',
  resetOnSuccess = false,
}: FormWrapperProps<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const methods = useForm<T>({ defaultValues, resolver });

  const handleSubmit = async (data: T) => {
    setIsSubmitting(true);
    try {
      // the form is passed on so a page can mark fields (it used to get only the values)
      const result = await onSubmit(data, methods);
      if (result !== false) {
        if (resetOnSuccess) methods.reset();
      }
    } catch (error) {
      toast.error(apiErrorMessage(error, errorMessage));
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
              'bg-green-700 hover:bg-green-800 text-white text-xs font-bold h-8 px-5 transition-colors duration-200 shadow-2xs',
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