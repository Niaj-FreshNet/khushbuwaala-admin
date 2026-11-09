'use client';

import { ChangeEvent, useId } from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { LucideAlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';

interface FormInputProps {
  name: string;
  label: string;
  type?:
    | 'text'
    | 'number'
    | 'email'
    | 'password'
    | 'select'
    | 'file'
    | 'checkbox'
    | 'radio'
    | 'textarea'
    | 'datetime-local';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  onChange?: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  accept?: string;
  multiple?: boolean;
  value?: string | number;
  disabled?: boolean;
  helperText?: string;
  maxLength?: number;
  showCount?: boolean;
  rows?: number;
}

export default function FormInput({
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  options,
  className,
  inputClassName,
  labelClassName,
  onChange,
  accept,
  multiple = false,
  value,
  disabled = false,
  helperText,
  maxLength,
  showCount,
  rows,
}: FormInputProps) {
  const id = useId();
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setValue(name, multiple ? files : files.length > 0 ? files[0] : null, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const hasError = Boolean((errors as any)?.[name]);
  const errorMsg = (errors as any)?.[name]?.message as string | undefined;

  return (
    <FormField
      control={control}
      name={name as any}
      render={({ field }) => {
        const currentLen =
          typeof field.value === 'string' ? field.value.length : 0;

        return (
          <FormItem className={cn('flex flex-col gap-1.5', className)}>
            {label && type !== 'checkbox' && type !== 'radio' && (
              <FormLabel
                className={cn('text-xs font-semibold text-gray-700', labelClassName)}
              >
                {label} {required && <span className="text-red-500 ml-1">*</span>}
              </FormLabel>
            )}

            <FormControl>
              <div>
                {type === 'select' ? (
                  <Select
                    value={field.value ?? ''}
                    onValueChange={(v) => {
                      field.onChange(v);
                    }}
                    disabled={disabled}
                  >
                    <SelectTrigger
                      id={id}
                      className={cn(
                        'w-full border border-gray-300 focus:ring-orange-500 focus:ring-2 bg-white',
                        hasError && 'border-red-500',
                        inputClassName
                      )}
                    >
                      <SelectValue placeholder={placeholder || `Select ${label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {options?.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : type === 'textarea' ? (
                  <div className="space-y-1.5 w-full">
                    <Textarea
                      {...field}
                      id={id}
                      rows={rows ?? 6}
                      maxLength={maxLength}
                      placeholder={placeholder}
                      value={(field.value ?? '') as string}
                      disabled={disabled}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\r\n/g, '\n');
                        field.onChange(v);
                        onChange?.(e);
                      }}
                      className={cn(
                        'w-full resize-y border border-gray-300 focus:ring-2 focus:ring-orange-500 bg-white',
                        hasError && 'border-red-500',
                        inputClassName
                      )}
                    />
                    {(helperText || showCount) && (
                      <div className="flex items-center justify-between text-[11px] text-gray-500 px-0.5">
                        <span>{helperText}</span>
                        {showCount && (
                          <span>
                            {currentLen}
                            {maxLength ? `/${maxLength}` : ''}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : type === 'file' ? (
                  <Input
                    id={id}
                    type="file"
                    accept={accept || 'image/*'}
                    multiple={multiple}
                    disabled={disabled}
                    onChange={(e) => {
                      handleFileChange(e);
                      onChange?.(e);
                    }}
                    className={cn(
                      'cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-orange-500 file:text-white hover:file:bg-orange-600 bg-white text-xs',
                      hasError ? 'border-red-500' : 'border-gray-300',
                      inputClassName
                    )}
                  />
                ) : type === 'checkbox' ? (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={id}
                      checked={!!field.value}
                      disabled={disabled}
                      onCheckedChange={(checked) => field.onChange(checked)}
                    />
                    <Label htmlFor={id} className={cn('text-xs text-gray-700 font-medium', labelClassName)}>
                      {label}
                    </Label>
                  </div>
                ) : type === 'radio' ? (
                  <RadioGroup
                    value={field.value ?? ''}
                    onValueChange={(v) => field.onChange(v)}
                    className="flex gap-4"
                  >
                    {options?.map((opt) => (
                      <div key={opt.value} className="flex items-center gap-2">
                        <RadioGroupItem id={`${id}-${opt.value}`} value={opt.value} />
                        <Label htmlFor={`${id}-${opt.value}`} className="text-xs text-gray-700 font-medium">
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <Input
                    {...field}
                    id={id}
                    type={type}
                    placeholder={placeholder}
                    value={(value ?? field.value ?? '') as any}
                    disabled={disabled}
                    onChange={(e) => {
                      field.onChange(e);
                      onChange?.(e);
                    }}
                    className={cn(
                      'border border-gray-300 focus:ring-2 focus:ring-orange-500 bg-white',
                      hasError && 'border-red-500',
                      inputClassName
                    )}
                  />
                )}
              </div>
            </FormControl>

            <FormMessage className="text-[11px] text-red-500 flex items-center gap-1">
              {hasError && (
                <>
                  <LucideAlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </>
              )}
            </FormMessage>
          </FormItem>
        );
      }}
    />
  );
}