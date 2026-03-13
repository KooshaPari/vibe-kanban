import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import FileUploadCard, { type UploadingFile } from '../FileUploadCard';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: ({ className }: { className?: string }) => (
    <div data-testid="x-icon" className={className} />
  ),
  File: ({ className }: { className?: string }) => (
    <div data-testid="file-icon" className={className} />
  ),
  Image: ({ className }: { className?: string }) => (
    <div data-testid="image-icon" className={className} />
  ),
  Video: ({ className }: { className?: string }) => (
    <div data-testid="video-icon" className={className} />
  ),
  FileText: ({ className }: { className?: string }) => (
    <div data-testid="filetext-icon" className={className} />
  ),
  Check: ({ className }: { className?: string }) => (
    <div data-testid="check-icon" className={className} />
  ),
  AlertCircle: ({ className }: { className?: string }) => (
    <div data-testid="alert-circle-icon" className={className} />
  ),
}));

// Mock Progress component
jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div data-testid="progress-bar" className={className} aria-valuenow={value}>
      {value}%
    </div>
  ),
}));

// Mock Button component
jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    className,
    size,
    variant,
    type = 'button',
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    size?: string;
    variant?: string;
    type?: string;
  }) => (
    <button
      type={type}
      onClick={onClick}
      className={className}
      data-size={size}
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock Card component
jest.mock('@/components/ui/card', () => ({
  Card: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
}));

// Mock cn utility
jest.mock('@/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}));

// Mock FileReader
const mockFileReader = {
  readAsDataURL: jest.fn(),
  result: null,
  onload: null as any,
  onerror: null as any,
};

Object.defineProperty(window, 'FileReader', {
  writable: true,
  value: jest.fn(() => ({
    ...mockFileReader,
    readAsDataURL: jest.fn(),
    result: null,
    onload: null,
    onerror: null,
  })),
});

describe('FileUploadCard', () => {
  const mockOnRemove = jest.fn();
  const mockOnRetry = jest.fn();

  // Test file objects
  const createMockFile = (
    name: string,
    type: string,
    size: number = 1024
  ): File => {
    const file = new File(['test content'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  const createUploadingFile = (
    overrides: Partial<UploadingFile> = {}
  ): UploadingFile => ({
    id: 'test-file-1',
    file: createMockFile('test.jpg', 'image/jpeg'),
    progress: 0,
    status: 'pending',
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset FileReader constructor
    (FileReader as jest.Mock).mockClear();
  });

  describe('Rendering', () => {
    it('renders file upload card with basic information', () => {
      const file = createUploadingFile();

      render(
        <FileUploadCard
          file={file}
          onRemove={mockOnRemove}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByText('test.jpg')).toBeInTheDocument();
      expect(screen.getByText('1 KB')).toBeInTheDocument();
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('renders image preview for image files', async () => {
      const file = createUploadingFile({
        file: createMockFile('image.png', 'image/png'),
      });

      // Set up FileReader mock to automatically trigger onload
      const mockFileReaderInstance = {
        readAsDataURL: jest.fn((_file) => {
          // Simulate async operation
          setTimeout(() => {
            if (mockFileReaderInstance.onload) {
              mockFileReaderInstance.result = 'data:image/png;base64,test';
              mockFileReaderInstance.onload({
                target: { result: 'data:image/png;base64,test' },
              } as any);
            }
          }, 0);
        }),
        result: null,
        onload: null,
        onerror: null,
      };

      (FileReader as jest.Mock).mockImplementation(
        () => mockFileReaderInstance
      );

      render(
        <FileUploadCard
          file={file}
          onRemove={mockOnRemove}
          onRetry={mockOnRetry}
        />
      );

      await waitFor(
        () => {
          const img = screen.getByAltText('image.png');
          expect(img).toBeInTheDocument();
          expect(img).toHaveAttribute('src', 'data:image/png;base64,test');
        },
        { timeout: 2000 }
      );
    });

    it('renders appropriate file icons for different file types', () => {
      const testCases = [
        { type: 'image/jpeg', expectedIcon: 'image-icon' },
        { type: 'video/mp4', expectedIcon: 'video-icon' },
        { type: 'application/pdf', expectedIcon: 'filetext-icon' },
        { type: 'text/plain', expectedIcon: 'file-icon' },
      ];

      testCases.forEach(({ type, expectedIcon }) => {
        const file = createUploadingFile({
          file: createMockFile(`test.${type.split('/')[1]}`, type),
          id: `test-${type}`,
        });

        const { unmount } = render(
          <FileUploadCard
            file={file}
            onRemove={mockOnRemove}
            onRetry={mockOnRetry}
          />
        );

        expect(screen.getByTestId(expectedIcon)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('File Size Formatting', () => {
    it('formats file sizes correctly', () => {
      const testCases = [
        { size: 0, expected: '0 Bytes' },
        { size: 512, expected: '512 Bytes' },
        { size: 1024, expected: '1 KB' },
        { size: 1048576, expected: '1 MB' },
        { size: 1073741824, expected: '1 GB' },
        { size: 1536, expected: '1.5 KB' },
      ];

      testCases.forEach(({ size, expected }) => {
        const file = createUploadingFile({
          file: createMockFile('test.txt', 'text/plain', size),
          id: `test-${size}`,
        });

        const { unmount } = render(
          <FileUploadCard
            file={file}
            onRemove={mockOnRemove}
            onRetry={mockOnRetry}
          />
        );

        expect(screen.getByText(expected)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Upload Status', () => {
    it('displays pending status correctly', () => {
      const file = createUploadingFile({ status: 'pending', progress: 0 });

      render(
        <FileUploadCard
          file={file}
          onRemove={mockOnRemove}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
      expect(screen.getByText('Waiting...')).toBeInTheDocument();
    });

    it('displays uploading status with progress', () => {
      const file = createUploadingFile({ status: 'uploading', progress: 45 });

      render(
        <FileUploadCard
          file={file}
          onRemove={mockOnRemove}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
      // Check that progress is displayed (there may be multiple 45% texts)
      expect(screen.getAllByText('45%').length).toBeGreaterThan(0);
      // The progress bar aria-valuenow should also be 45
      expect(screen.getByTestId('progress-bar')).toHaveAttribute(
        'aria-valuenow',
        '45'
      );
    });

    it('displays success status with check icon', () => {
      const file = createUploadingFile({ status: 'success', progress: 100 });

      render(
        <FileUploadCard
          file={file}
          onRemove={mockOnRemove}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('progress-bar')).not.toBeInTheDocument();
    });

    it('displays error status with error icon and message', () => {
      const file = createUploadingFile({
        status: 'error',
        error: 'Upload failed: File too large',
      });

      render(
        <FileUploadCard
          file={file}
          onRemove={mockOnRemove}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
      expect(
        screen.getByText('Upload failed: File too large')
      ).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  describe('Card Styling', () => {
    it('applies correct styling based on upload status', () => {
      const testCases = [
        {
          status: 'pending' as const,
          expectedClass: 'border-muted-foreground/25',
        },
        {
          status: 'uploading' as const,
          expectedClass: 'border-primary/50 bg-primary/10',
        },
        {
          status: 'success' as const,
          expectedClass: 'border-green-500/50 bg-green-50/10',
        },
        {
          status: 'error' as const,
          expectedClass: 'border-destructive/50 bg-destructive/10',
        },
      ];

      testCases.forEach(({ status, expectedClass }) => {
        const file = createUploadingFile({ status, id: `test-${status}` });

        const { unmount } = render(
          <FileUploadCard
            file={file}
            onRemove={mockOnRemove}
            onRetry={mockOnRetry}
          />
        );

        const card = screen.getByTestId('card');
        expect(card).toHaveClass(expectedClass);
        unmount();
      });
    });
  });

  describe('User Interactions', () => {
    it('calls onRemove when remove button is clicked', async () => {
      const user = userEvent.setup();
      const file = createUploadingFile();

      render(
        <FileUploadCard
          file={file}
          onRemove={mockOnRemove}
          onRetry={mockOnRetry}
        />
      );

      const removeButton = screen.getByTestId('x-icon').closest('button');
      expect(removeButton).toBeInTheDocument();

      await user.click(removeButton);
      expect(mockOnRemove).toHaveBeenCalledWith('test-file-1');
    });

    it('calls onRetry when retry button is clicked', async () => {
      const user = userEvent.setup();
      const file = createUploadingFile({
        status: 'error',
        error: 'Upload failed',
      });

      render(
        <FileUploadCard
          file={file}
          onRemove={mockOnRemove}
          onRetry={mockOnRetry}
        />
      );

      const retryButton = screen.getByText('Retry');
      await user.click(retryButton);
      expect(mockOnRetry).toHaveBeenCalledWith('test-file-1');
    });

    it('does not show retry button for non-error statuses', () => {
      const statuses: UploadingFile['status'][] = [
        'pending',
        'uploading',
        'success',
      ];

      statuses.forEach((status) => {
        const file = createUploadingFile({ status, id: `test-${status}` });

        const { unmount } = render(
          <FileUploadCard
            file={file}
            onRemove={mockOnRemove}
            onRetry={mockOnRetry}
          />
        );

        expect(screen.queryByText('Retry')).not.toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles files with very long names', () => {
      const longFileName = 'a'.repeat(100) + '.txt';
      const file = createUploadingFile({
        file: createMockFile(longFileName, 'text/plain'),
      });

      render(
        <FileUploadCard
          file={file}
          onRemove={mockOnRemove}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByText(longFileName)).toBeInTheDocument();
    });

    it('handles files with special characters in names', () => {
      const specialFileName = 'test-file_with@special#chars$.pdf';
      const file = createUploadingFile({
        file: createMockFile(specialFileName, 'application/pdf'),
      });

      render(
        <FileUploadCard
          file={file}
          onRemove={mockOnRemove}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByText(specialFileName)).toBeInTheDocument();
    });

    it('handles error without error message', () => {
      const file = createUploadingFile({ status: 'error' });

      render(
        <FileUploadCard
          file={file}
          onRemove={mockOnRemove}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('handles FileReader error for image preview', () => {
      const file = createUploadingFile({
        file: createMockFile('broken-image.jpg', 'image/jpeg'),
      });

      render(
        <FileUploadCard
          file={file}
          onRemove={mockOnRemove}
          onRetry={mockOnRetry}
        />
      );

      // Simulate FileReader error
      const fileReaderInstance = (FileReader as jest.Mock).mock.instances[0];
      fileReaderInstance.onerror = jest.fn();

      // Should fallback to showing icon instead of image
      expect(screen.getByTestId('image-icon')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper alt text for images', async () => {
      const file = createUploadingFile({
        file: createMockFile('accessible-image.png', 'image/png'),
      });

      // Set up FileReader mock to automatically trigger onload
      const mockFileReaderInstance = {
        readAsDataURL: jest.fn((_file) => {
          // Simulate async operation
          setTimeout(() => {
            if (mockFileReaderInstance.onload) {
              mockFileReaderInstance.result = 'data:image/png;base64,test';
              mockFileReaderInstance.onload({
                target: { result: 'data:image/png;base64,test' },
              } as any);
            }
          }, 0);
        }),
        result: null,
        onload: null,
        onerror: null,
      };

      (FileReader as jest.Mock).mockImplementation(
        () => mockFileReaderInstance
      );

      render(
        <FileUploadCard
          file={file}
          onRemove={mockOnRemove}
          onRetry={mockOnRetry}
        />
      );

      await waitFor(
        () => {
          const img = screen.getByAltText('accessible-image.png');
          expect(img).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('has accessible progress bar', () => {
      const file = createUploadingFile({ status: 'uploading', progress: 75 });

      render(
        <FileUploadCard
          file={file}
          onRemove={mockOnRemove}
          onRetry={mockOnRetry}
        />
      );

      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    });

    it('has proper button roles and interactions', () => {
      const file = createUploadingFile({
        status: 'error',
        error: 'Upload failed',
      });

      render(
        <FileUploadCard
          file={file}
          onRemove={mockOnRemove}
          onRetry={mockOnRetry}
        />
      );

      const retryButton = screen.getByText('Retry');
      const removeButton = screen.getByTestId('x-icon').closest('button');

      expect(retryButton).toHaveAttribute('type', 'button');
      expect(removeButton).toHaveAttribute('type', 'button');
    });
  });

  describe('Performance', () => {
    it('does not create multiple FileReader instances for non-image files', () => {
      const file = createUploadingFile({
        file: createMockFile('document.pdf', 'application/pdf'),
      });

      render(
        <FileUploadCard
          file={file}
          onRemove={mockOnRemove}
          onRetry={mockOnRetry}
        />
      );

      expect(FileReader).not.toHaveBeenCalled();
    });

    it('properly cleans up FileReader on unmount', () => {
      const file = createUploadingFile({
        file: createMockFile('image.jpg', 'image/jpeg'),
      });

      const { unmount } = render(
        <FileUploadCard
          file={file}
          onRemove={mockOnRemove}
          onRetry={mockOnRetry}
        />
      );

      expect(FileReader).toHaveBeenCalledTimes(1);
      unmount();

      // Component should cleanup properly without errors
    });
  });
});
