import { useState, useEffect } from 'react';
import {
  X,
  File,
  Image,
  Video,
  FileText,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface FileUploadCardProps {
  file: UploadingFile;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

export default function FileUploadCard({
  file,
  onRemove,
  onRetry,
}: FileUploadCardProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (file.file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file.file);
    }
  }, [file.file]);

  const getFileIcon = () => {
    const type = file.file.type;
    if (type.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (type.startsWith('video/')) return <Video className="h-5 w-5" />;
    if (type.includes('pdf') || type.includes('document'))
      return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = () => {
    switch (file.status) {
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (file.status) {
      case 'success':
        return 'border-green-500/50 bg-green-50/10';
      case 'error':
        return 'border-destructive/50 bg-destructive/10';
      case 'uploading':
        return 'border-primary/50 bg-primary/10';
      default:
        return 'border-muted-foreground/25';
    }
  };

  return (
    <Card className={cn('p-3 transition-all', getStatusColor())}>
      <div className="flex gap-3">
        {/* Preview or Icon */}
        <div className="flex-shrink-0">
          {imagePreview ? (
            <div className="w-12 h-12 rounded overflow-hidden">
              <img
                src={imagePreview}
                alt={file.file.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
              {getFileIcon()}
            </div>
          )}
        </div>

        {/* File Info and Progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.file.size)}
              </p>
            </div>

            {/* Status and Actions */}
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              {file.status === 'error' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={() => onRetry(file.id)}
                >
                  Retry
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => onRemove(file.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          {(file.status === 'uploading' || file.status === 'pending') && (
            <div className="mt-2">
              <Progress value={file.progress} className="h-1.5" />
              <p className="text-xs text-muted-foreground mt-1">
                {file.status === 'pending' ? 'Waiting...' : `${file.progress}%`}
              </p>
            </div>
          )}

          {/* Error Message */}
          {file.status === 'error' && file.error && (
            <p className="text-xs text-destructive mt-1">{file.error}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
