'use client';

import { cn } from '@graphology/utils';
import { Upload } from 'lucide-react';
import * as React from 'react';

export interface FileUploadProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helperText?: string;
  invalid?: boolean;
  selectedFileName?: string | null;
  onFilesChange?: (files: FileList | null) => void;
}

export const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      className,
      label = 'Upload file',
      helperText,
      invalid,
      selectedFileName,
      onFilesChange,
      id,
      onChange,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    return (
      <div className={cn('space-y-2', className)}>
        <label
          htmlFor={inputId}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface px-6 py-8 text-center transition-colors duration-normal hover:bg-muted/60',
            invalid && 'border-danger',
            props.disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          <Upload className="h-5 w-5 text-muted-foreground" aria-hidden />
          <span className="text-sm font-medium">{label}</span>
          {selectedFileName ? (
            <span className="max-w-full truncate text-sm text-foreground">{selectedFileName}</span>
          ) : null}
          {helperText ? <span className="text-caption">{helperText}</span> : null}
          <input
            ref={ref}
            id={inputId}
            type="file"
            className="sr-only"
            aria-invalid={invalid ? true : undefined}
            onChange={(event) => {
              onFilesChange?.(event.currentTarget.files);
              onChange?.(event);
            }}
            {...props}
          />
        </label>
      </div>
    );
  },
);

FileUpload.displayName = 'FileUpload';
