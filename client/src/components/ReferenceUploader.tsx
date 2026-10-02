import React, { useState, useRef } from 'react';
import { UploadCloud, X, AlertCircle } from 'lucide-react';

interface ReferenceUploaderProps {
  imagePreview: string | null;
  onImageChange: (image: string | null) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export const ReferenceUploader: React.FC<ReferenceUploaderProps> = ({
  imagePreview,
  onImageChange,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (disabled) return;
    setErrorMessage(null);

    // Validate file type
    const isAllowed = ALLOWED_TYPES.includes(file.type.toLowerCase()) || 
                      /\.(jpe?g|png|webp)$/i.test(file.name);

    if (!isAllowed) {
      setErrorMessage('Please choose a JPG, PNG, or WebP image.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`Image exceeds the ${MAX_FILE_SIZE_MB}MB size limit. Please choose a smaller image.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onImageChange(e.target.result as string);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read image file. Please try another one.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    onImageChange(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm sm:text-base font-bold text-slate-900">
            Reference Image
          </label>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
            Optional
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Give AI a visual reference for your book&apos;s subject or style.
      </p>

      {/* Upload Drop Zone / Image Preview */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !imagePreview && fileInputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center p-4 text-center min-h-[140px] ${
          disabled
            ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
            : isDragging
            ? 'border-purple-500 bg-purple-50/70 scale-[0.99] cursor-pointer'
            : imagePreview
            ? 'border-purple-300 bg-purple-50/30 cursor-default'
            : 'border-slate-300/80 bg-slate-50/60 hover:bg-purple-50/40 hover:border-purple-300 cursor-pointer'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          disabled={disabled}
          accept="image/png,image/jpeg,image/webp,image/jpg"
          onChange={handleFileInput}
          className="hidden"
        />

        {imagePreview ? (
          <div className="flex items-center gap-4 w-full">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-purple-200 shadow-xs shrink-0 bg-white">
              <img
                src={imagePreview}
                alt="Reference Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">
                Reference image uploaded
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Ready to inspire page compositions
              </p>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors cursor-pointer"
                >
                  Change photo
                </button>
              )}
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Remove image"
                aria-label="Remove reference image"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">
                Upload image
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                JPG, PNG, WebP • Optional • Max {MAX_FILE_SIZE_MB}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Inline Error message */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-xl animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
