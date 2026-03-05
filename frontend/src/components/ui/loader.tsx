import { Loader2 } from 'lucide-react';
import React from 'react';

interface LoaderProps {
  message?: string | React.ReactElement;
  size?: number;
  className?: string;
  'data-testid'?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  message,
  size = 32,
  className = '',
  'data-testid': testId,
}) => (
  <div 
    className={`flex flex-col items-center justify-center ${className}`}
    data-testid={testId}
  >
    <Loader2
      className="animate-spin text-muted-foreground mb-2"
      style={{ width: size, height: size }}
    />
    {!!message && (
      <div className="text-center text-muted-foreground">{message}</div>
    )}
  </div>
);
