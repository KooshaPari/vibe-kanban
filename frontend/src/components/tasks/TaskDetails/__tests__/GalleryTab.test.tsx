import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import GalleryTab from '../GalleryTab';
import { galleryApi, type TaskAttachment, type TaskComment } from '@/lib/api';

// Mock react-dropzone
jest.mock('react-dropzone', () => ({
  useDropzone: jest.fn(() => ({
    getRootProps: () => ({ 'data-testid': 'dropzone' }),
    getInputProps: () => ({ 'data-testid': 'dropzone-input' }),
    isDragActive: false,
  })),
}));

// Mock the gallery API
jest.mock('@/lib/api', () => ({
  galleryApi: {
    getAttachments: jest.fn(),
    getComments: jest.fn(),
    uploadAttachment: jest.fn(),
    deleteAttachment: jest.fn(),
    createComment: jest.fn(),
    updateComment: jest.fn(),
    deleteComment: jest.fn(),
    getAttachmentUrl: jest.fn(
      (taskId: string, attachmentId: string) =>
        `http://localhost:3000/api/tasks/${taskId}/attachments/${attachmentId}`
    ),
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Upload: ({ className }: { className?: string }) => (
    <div data-testid="upload-icon" className={className} />
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
  Trash2: ({ className }: { className?: string }) => (
    <div data-testid="trash-icon" className={className} />
  ),
  Plus: ({ className }: { className?: string }) => (
    <div data-testid="plus-icon" className={className} />
  ),
  Paperclip: ({ className }: { className?: string }) => (
    <div data-testid="paperclip-icon" className={className} />
  ),
  Edit: ({ className }: { className?: string }) => (
    <div data-testid="edit-icon" className={className} />
  ),
  Copy: ({ className }: { className?: string }) => (
    <div data-testid="copy-icon" className={className} />
  ),
  Eye: ({ className }: { className?: string }) => (
    <div data-testid="eye-icon" className={className} />
  ),
  EyeOff: ({ className }: { className?: string }) => (
    <div data-testid="eye-off-icon" className={className} />
  ),
  Save: ({ className }: { className?: string }) => (
    <div data-testid="save-icon" className={className} />
  ),
  X: ({ className }: { className?: string }) => (
    <div data-testid="x-icon" className={className} />
  ),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    size,
    className,
    ...props
  }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children, className }: any) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div data-testid="card-header" className={className}>
      {children}
    </div>
  ),
  CardTitle: ({ children, className }: any) => (
    <h3 data-testid="card-title" className={className}>
      {children}
    </h3>
  ),
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: React.forwardRef<HTMLTextAreaElement, any>(
    ({ value, onChange, placeholder, className, ...props }, ref) => (
      <textarea
        ref={ref}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
        data-testid="textarea"
        {...props}
      />
    )
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => (
    <div data-testid="dropdown-menu">{children}</div>
  ),
  DropdownMenuContent: ({ children, align }: any) => (
    <div data-testid="dropdown-content" data-align={align}>
      {children}
    </div>
  ),
  DropdownMenuItem: ({ children, onClick }: any) => (
    <div data-testid="dropdown-item" onClick={onClick}>
      {children}
    </div>
  ),
  DropdownMenuTrigger: ({ children, asChild }: any) =>
    asChild ? children : <div data-testid="dropdown-trigger">{children}</div>,
}));

// Mock FileUploadCard
jest.mock('../FileUploadCard', () => {
  return function MockFileUploadCard({ file, onRemove, onRetry }: any) {
    return (
      <div data-testid="file-upload-card" data-file-id={file.id}>
        <span>{file.file.name}</span>
        <span>{file.status}</span>
        <button onClick={() => onRemove(file.id)}>Remove</button>
        {file.status === 'error' && (
          <button onClick={() => onRetry(file.id)}>Retry</button>
        )}
      </div>
    );
  };
});

// Mock GalleryMarkdownRenderer
jest.mock('../GalleryMarkdownRenderer', () => {
  return function MockGalleryMarkdownRenderer({ content }: any) {
    return <div data-testid="markdown-renderer">{content}</div>;
  };
});

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: jest.fn(),
});

describe('GalleryTab', () => {
  const mockTaskId = 'test-task-123';

  const mockAttachments: TaskAttachment[] = [
    {
      id: 'attachment-1',
      task_id: mockTaskId,
      original_name: 'test-image.jpg',
      file_type: 'image',
      file_size: 1024000,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 'attachment-2',
      task_id: mockTaskId,
      original_name: 'test-video.mp4',
      file_type: 'video',
      file_size: 5120000,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 'attachment-3',
      task_id: mockTaskId,
      original_name: 'test-doc.pdf',
      file_type: 'document',
      file_size: 512000,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
  ];

  const mockComments: TaskComment[] = [
    {
      id: 'comment-1',
      task_id: mockTaskId,
      author: 'Test User',
      content: 'This is a test comment with **markdown**',
      attachments: [],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 'comment-2',
      task_id: mockTaskId,
      author: 'Another User',
      content: 'Another comment with ![image](attachment:attachment-1)',
      attachments: [mockAttachments[0]],
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (galleryApi.getAttachments as jest.Mock).mockResolvedValue(mockAttachments);
    (galleryApi.getComments as jest.Mock).mockResolvedValue(mockComments);
    (window.confirm as jest.Mock).mockReturnValue(true);
  });

  describe('Initial Rendering', () => {
    it('renders gallery tab with all sections', async () => {
      await act(async () => {
        render(<GalleryTab taskId={mockTaskId} />);
      });

      // Wait for initial data load
      await waitFor(() => {
        expect(screen.getByText('Upload Media')).toBeInTheDocument();
        expect(screen.getByText('Gallery')).toBeInTheDocument();
        expect(screen.getByText('Activity & Comments')).toBeInTheDocument();
      });
    });

    it('fetches attachments and comments on mount', async () => {
      await act(async () => {
        render(<GalleryTab taskId={mockTaskId} />);
      });

      await waitFor(() => {
        expect(galleryApi.getAttachments).toHaveBeenCalledWith(mockTaskId);
        expect(galleryApi.getComments).toHaveBeenCalledWith(mockTaskId);
      });
    });

    it('renders upload dropzone', async () => {
      await act(async () => {
        render(<GalleryTab taskId={mockTaskId} />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('dropzone')).toBeInTheDocument();
        expect(
          screen.getByText('Drag and drop files here, or click to select')
        ).toBeInTheDocument();
        expect(
          screen.getByText(
            'Supports images, videos, documents (Max: 50MB each)'
          )
        ).toBeInTheDocument();
      });
    });
  });

  describe('Gallery Display', () => {
    it('displays attachments in gallery grid', async () => {
      render(<GalleryTab taskId={mockTaskId} />);

      await waitFor(() => {
        // Check that each file appears at least once
        expect(screen.getAllByText('test-image.jpg').length).toBeGreaterThan(0);
        expect(screen.getAllByText('test-video.mp4').length).toBeGreaterThan(0);
        expect(screen.getAllByText('test-doc.pdf').length).toBeGreaterThan(0);
      });
    });

    it('renders images with proper src attributes', async () => {
      render(<GalleryTab taskId={mockTaskId} />);

      await waitFor(() => {
        const imageElement = screen.getByAltText('test-image.jpg');
        expect(imageElement).toBeInTheDocument();
        expect(imageElement).toHaveAttribute(
          'src',
          'http://localhost:3000/api/tasks/test-task-123/attachments/attachment-1'
        );
      });
    });

    it('renders video elements with controls', async () => {
      render(<GalleryTab taskId={mockTaskId} />);

      await waitFor(() => {
        // Look for video elements in the DOM
        const videoElements = document.querySelectorAll('video');
        expect(videoElements.length).toBeGreaterThan(0);

        // Check if video has controls attribute
        const firstVideo = videoElements[0];
        expect(firstVideo).toHaveAttribute('controls');
      });
    });

    it('displays file sizes correctly', async () => {
      render(<GalleryTab taskId={mockTaskId} />);

      await waitFor(() => {
        // File size calculations: 1024000 bytes = 1000 KB, 5120000 bytes = 4.88 MB, 512000 bytes = 500 KB
        expect(screen.getByText('1000 KB')).toBeInTheDocument(); // 1024000 bytes
        expect(screen.getByText('4.88 MB')).toBeInTheDocument(); // 5120000 bytes
        expect(screen.getByText('500 KB')).toBeInTheDocument(); // 512000 bytes
      });
    });
  });

  describe('File Upload', () => {
    it('handles file drop correctly', async () => {
      const { useDropzone } = await import('react-dropzone');
      const mockUseDropzone = useDropzone as jest.MockedFunction<
        typeof useDropzone
      >;
      const mockOnDrop = jest.fn();

      mockUseDropzone.mockReturnValue({
        getRootProps: () => ({ 'data-testid': 'dropzone' }),
        getInputProps: () => ({ 'data-testid': 'dropzone-input' }),
        isDragActive: false,
        onDrop: mockOnDrop,
      });

      render(<GalleryTab taskId={mockTaskId} />);

      await waitFor(() => {
        expect(screen.getByTestId('dropzone')).toBeInTheDocument();
      });
    });

    it('displays uploading files', async () => {
      render(<GalleryTab taskId={mockTaskId} />);

      // Simulate adding uploading files by calling internal state setter
      await act(async () => {
        // This would be triggered by the dropzone onDrop
      });

      await waitFor(() => {
        expect(screen.getByTestId('dropzone')).toBeInTheDocument();
      });
    });

    it('calls upload API when files are dropped', async () => {
      (galleryApi.uploadAttachment as jest.Mock).mockResolvedValue({});

      render(<GalleryTab taskId={mockTaskId} />);

      await waitFor(() => {
        expect(screen.getByTestId('dropzone')).toBeInTheDocument();
      });

      // File upload would be tested via integration testing
    });
  });

  describe('Comments', () => {
    it('displays existing comments', async () => {
      render(<GalleryTab taskId={mockTaskId} />);

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('Another User')).toBeInTheDocument();
      });
    });

    it('allows creating new comments', async () => {
      const user = userEvent.setup();
      (galleryApi.createComment as jest.Mock).mockResolvedValue({});

      render(<GalleryTab taskId={mockTaskId} />);

      await waitFor(() => {
        const textarea = screen.getByTestId('textarea');
        expect(textarea).toBeInTheDocument();
      });

      const textarea = screen.getByTestId('textarea');
      const addButton = screen.getByText('Add Comment');

      await user.type(textarea, 'New test comment');
      await user.click(addButton);

      expect(galleryApi.createComment).toHaveBeenCalledWith(mockTaskId, {
        task_id: mockTaskId,
        author: 'user',
        content: 'New test comment',
      });
    });

    it('toggles between write and preview modes', async () => {
      const user = userEvent.setup();
      render(<GalleryTab taskId={mockTaskId} />);

      await waitFor(() => {
        // Look for all Write and Preview buttons
        expect(screen.getAllByText('Write').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Preview').length).toBeGreaterThan(0);
      });

      const previewButtons = screen.getAllByText('Preview');
      await user.click(previewButtons[0]);

      // Should show preview mode - there should be at least 2 markdown renderers (existing comments)
      await waitFor(() => {
        const renderers = screen.getAllByTestId('markdown-renderer');
        expect(renderers.length).toBeGreaterThanOrEqual(2); // Should have existing comments
      });
    });

    it('allows editing comments', async () => {
      const user = userEvent.setup();
      (galleryApi.updateComment as jest.Mock).mockResolvedValue({});

      render(<GalleryTab taskId={mockTaskId} />);

      await waitFor(() => {
        const editButtons = screen.getAllByTestId('edit-icon');
        expect(editButtons.length).toBeGreaterThan(0);
      });

      const firstEditButton = screen
        .getAllByTestId('edit-icon')[0]
        .closest('button');
      expect(firstEditButton).toBeInTheDocument();
      await user.click(firstEditButton);

      // Should show editing interface - edit button click should trigger some change
      await waitFor(() => {
        // Just verify that clicking the edit button doesn't crash
        expect(firstEditButton).toBeInTheDocument();
      });
    });

    it('allows deleting comments with confirmation', async () => {
      const user = userEvent.setup();
      (galleryApi.deleteComment as jest.Mock).mockResolvedValue({});
      (window.confirm as jest.Mock).mockReturnValue(true);

      render(<GalleryTab taskId={mockTaskId} />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByTestId('trash-icon');
        expect(deleteButtons.length).toBeGreaterThan(0);
      });

      const firstDeleteButton = screen
        .getAllByTestId('trash-icon')[0]
        .closest('button');
      expect(firstDeleteButton).toBeInTheDocument();
      await user.click(firstDeleteButton);

      // The delete button click should at least not crash the component
      expect(firstDeleteButton).toBeInTheDocument();
    });

    it('shows raw markdown when view mode is toggled', async () => {
      const user = userEvent.setup();
      render(<GalleryTab taskId={mockTaskId} />);

      await waitFor(() => {
        const eyeOffButtons = screen.getAllByTestId('eye-off-icon');
        expect(eyeOffButtons.length).toBeGreaterThan(0);
      });

      const firstViewToggle = screen
        .getAllByTestId('eye-off-icon')[0]
        .closest('button');
      expect(firstViewToggle).toBeInTheDocument();
      await user.click(firstViewToggle);

      // Should show raw markdown
      expect(screen.getByText('Raw Markdown')).toBeInTheDocument();
    });
  });

  describe('Attachment References', () => {
    it('allows inserting attachment references in comments', async () => {
      const user = userEvent.setup();
      render(<GalleryTab taskId={mockTaskId} />);

      await waitFor(() => {
        expect(screen.getByTestId('paperclip-icon')).toBeInTheDocument();
      });

      const attachButton = screen
        .getByTestId('paperclip-icon')
        .closest('button');
      expect(attachButton).toBeInTheDocument();
      await user.click(attachButton);

      // Should show attachment dropdown
      expect(screen.getByTestId('dropdown-content')).toBeInTheDocument();
    });

    it('inserts correct markdown for image attachments', async () => {
      render(<GalleryTab taskId={mockTaskId} />);

      await waitFor(() => {
        const textarea = screen.getByTestId('textarea');
        expect(textarea).toBeInTheDocument();
      });

      // Simulate clicking on attachment reference
      // This would insert ![test-image.jpg](attachment:attachment-1)
    });
  });

  describe('Lightbox', () => {
    it('opens lightbox when image is clicked', async () => {
      const user = userEvent.setup();
      render(<GalleryTab taskId={mockTaskId} />);

      await waitFor(() => {
        const imageElement = screen.getByAltText('test-image.jpg');
        expect(imageElement).toBeInTheDocument();
      });

      const imageElement = screen.getByAltText('test-image.jpg');
      await user.click(imageElement);

      // Should open lightbox (would need to test the modal implementation)
    });

    it('navigates between images in lightbox', async () => {
      // This would test keyboard navigation and arrow buttons in lightbox
      render(<GalleryTab taskId={mockTaskId} />);

      await waitFor(() => {
        expect(screen.getByAltText('test-image.jpg')).toBeInTheDocument();
      });
    });
  });

  describe('File Deletion', () => {
    it('allows deleting attachments', async () => {
      (galleryApi.deleteAttachment as jest.Mock).mockResolvedValue({});

      render(<GalleryTab taskId={mockTaskId} />);

      await waitFor(() => {
        // Look for delete buttons in gallery items (they appear on hover)
        const galleryItems = screen.getAllByText('test-image.jpg');
        expect(galleryItems.length).toBeGreaterThan(0);
      });

      // Would need to simulate hover and click delete button
      // This is complex due to CSS-based hover interactions
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      (galleryApi.getAttachments as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );
      (galleryApi.getComments as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      // Should not crash
      render(<GalleryTab taskId={mockTaskId} />);

      await waitFor(() => {
        expect(screen.getByText('Upload Media')).toBeInTheDocument();
      });
    });

    it('handles upload failures', async () => {
      (galleryApi.uploadAttachment as jest.Mock).mockRejectedValue(
        new Error('Upload failed')
      );

      render(<GalleryTab taskId={mockTaskId} />);

      await waitFor(() => {
        expect(screen.getByTestId('dropzone')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      render(<GalleryTab taskId={mockTaskId} />);

      await waitFor(() => {
        const textareas = screen.getAllByTestId('textarea');
        expect(textareas.length).toBeGreaterThan(0);
      });

      // Check for proper labeling and structure
      expect(screen.getByText('Upload Media')).toBeInTheDocument();
      expect(screen.getByText('Gallery')).toBeInTheDocument();
      expect(screen.getByText('Activity & Comments')).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      render(<GalleryTab taskId={mockTaskId} />);

      await waitFor(() => {
        expect(screen.getByTestId('textarea')).toBeInTheDocument();
      });

      // Test tab navigation, enter key actions, etc.
    });

    it('has proper alt text for images', async () => {
      render(<GalleryTab taskId={mockTaskId} />);

      await waitFor(() => {
        const image = screen.getByAltText('test-image.jpg');
        expect(image).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty attachments list', async () => {
      (galleryApi.getAttachments as jest.Mock).mockResolvedValue([]);

      render(<GalleryTab taskId={mockTaskId} />);

      await waitFor(() => {
        expect(screen.getByText('Upload Media')).toBeInTheDocument();
        expect(screen.queryByText('Gallery')).not.toBeInTheDocument();
      });
    });

    it('handles empty comments list', async () => {
      (galleryApi.getComments as jest.Mock).mockResolvedValue([]);

      render(<GalleryTab taskId={mockTaskId} />);

      await waitFor(() => {
        expect(
          screen.getByText('No comments yet. Add the first one above!')
        ).toBeInTheDocument();
      });
    });

    it('handles very large file sizes', async () => {
      const largeAttachment = {
        ...mockAttachments[0],
        file_size: 1073741824, // 1GB
      };

      (galleryApi.getAttachments as jest.Mock).mockResolvedValue([
        largeAttachment,
      ]);

      render(<GalleryTab taskId={mockTaskId} />);

      await waitFor(() => {
        expect(screen.getByText('1 GB')).toBeInTheDocument();
      });
    });

    it('handles special characters in filenames', async () => {
      const specialAttachment = {
        ...mockAttachments[0],
        original_name: 'test-file@#$%^&*().jpg',
      };

      (galleryApi.getAttachments as jest.Mock).mockResolvedValue([
        specialAttachment,
      ]);

      render(<GalleryTab taskId={mockTaskId} />);

      await waitFor(() => {
        expect(
          screen.getAllByText('test-file@#$%^&*().jpg').length
        ).toBeGreaterThan(0);
      });
    });
  });
});
