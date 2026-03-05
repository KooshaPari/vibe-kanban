/**
 * Comprehensive unit tests for GalleryTab component
 * Testing file uploads, gallery display, comments, and error handling
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GalleryTab from '@/components/tasks/TaskDetails/GalleryTab';
import type { TaskAttachment, TaskComment } from 'shared/types';

// Mock the gallery API
jest.mock('@/lib/api', () => ({
  galleryApi: {
    getAttachments: jest.fn(),
    uploadAttachment: jest.fn(),
    deleteAttachment: jest.fn(),
    getAttachmentUrl: jest.fn(),
    getComments: jest.fn(),
    createComment: jest.fn(),
    updateComment: jest.fn(),
    deleteComment: jest.fn(),
  },
}));

// Mock react-markdown
jest.mock('react-markdown', () => {
  return function MockMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mocked-blob-url');
global.URL.revokeObjectURL = jest.fn();

// Test data factories
const createMockAttachment = (overrides: Partial<TaskAttachment> = {}): TaskAttachment => ({
  id: 'attachment-1',
  task_id: 'task-1',
  filename: 'test-image.jpg',
  original_name: 'test-image.jpg',
  file_path: '/uploads/test-image.jpg',
  file_size: 1024,
  mime_type: 'image/jpeg',
  file_type: 'image',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

const createMockComment = (overrides: Partial<TaskComment> = {}): TaskComment => ({
  id: 'comment-1',
  task_id: 'task-1',
  author: 'Test User',
  content: 'Test comment content',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  attachments: [],
  ...overrides,
});

const createMockFile = (name: string, type: string, size: number = 1024): File => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('GalleryTab Component', () => {
  const defaultProps = {
    taskId: 'task-1',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Setup default API mocks
    const { galleryApi } = await import('@/lib/api');
    (galleryApi.getAttachments as jest.Mock).mockResolvedValue([]);
    (galleryApi.getComments as jest.Mock).mockResolvedValue([]);
    (galleryApi.getAttachmentUrl as jest.Mock).mockImplementation(
      (taskId, attachmentId) => `/api/tasks/${taskId}/attachments/${attachmentId}/file`
    );
  });

  describe('Initial rendering', () => {
    it('should render gallery tab with upload area', async () => {
      render(<GalleryTab {...defaultProps} />);

      expect(screen.getByText('Gallery')).toBeInTheDocument();
      expect(screen.getByText('Drop files here or click to upload')).toBeInTheDocument();
      expect(screen.getByText('Comments')).toBeInTheDocument();
    });

    it('should load attachments on mount', async () => {
      const { galleryApi } = await import('@/lib/api');
      const mockAttachments = [
        createMockAttachment({ id: 'att-1', filename: 'image1.jpg' }),
        createMockAttachment({ id: 'att-2', filename: 'image2.png' }),
      ];

      (galleryApi.getAttachments as jest.Mock).mockResolvedValue(mockAttachments);

      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        expect(galleryApi.getAttachments).toHaveBeenCalledWith('task-1');
      });
    });

    it('should load comments on mount', async () => {
      const { galleryApi } = await import('@/lib/api');
      const mockComments = [
        createMockComment({ id: 'comment-1', content: 'First comment' }),
        createMockComment({ id: 'comment-2', content: 'Second comment' }),
      ];

      (galleryApi.getComments as jest.Mock).mockResolvedValue(mockComments);

      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        expect(galleryApi.getComments).toHaveBeenCalledWith('task-1');
      });
    });

    it('should handle API errors gracefully', async () => {
      const { galleryApi } = await import('@/lib/api');
      (galleryApi.getAttachments as jest.Mock).mockRejectedValue(new Error('API Error'));
      (galleryApi.getComments as jest.Mock).mockRejectedValue(new Error('API Error'));

      // Suppress console errors for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Gallery')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('File upload functionality', () => {
    it('should handle file selection via input', async () => {
      const user = userEvent.setup();
      const { galleryApi } = await import('@/lib/api');
      
      const uploadedAttachment = createMockAttachment({
        id: 'new-attachment',
        filename: 'uploaded.jpg',
      });

      (galleryApi.uploadAttachment as jest.Mock).mockResolvedValue(uploadedAttachment);

      render(<GalleryTab {...defaultProps} />);

      const fileInput = screen.getByLabelText(/upload files/i);
      const testFile = createMockFile('test-upload.jpg', 'image/jpeg');

      await user.upload(fileInput, testFile);

      await waitFor(() => {
        expect(galleryApi.uploadAttachment).toHaveBeenCalledWith('task-1', testFile);
      });
    });

    it('should handle multiple file selection', async () => {
      const user = userEvent.setup();
      const { galleryApi } = await import('@/lib/api');

      (galleryApi.uploadAttachment as jest.Mock).mockResolvedValue(createMockAttachment());

      render(<GalleryTab {...defaultProps} />);

      const fileInput = screen.getByLabelText(/upload files/i);
      const files = [
        createMockFile('file1.jpg', 'image/jpeg'),
        createMockFile('file2.png', 'image/png'),
        createMockFile('file3.pdf', 'application/pdf'),
      ];

      await user.upload(fileInput, files);

      await waitFor(() => {
        expect(galleryApi.uploadAttachment).toHaveBeenCalledTimes(3);
      });
    });

    it('should handle drag and drop uploads', async () => {
      const { galleryApi } = await import('@/lib/api');
      (galleryApi.uploadAttachment as jest.Mock).mockResolvedValue(createMockAttachment());

      render(<GalleryTab {...defaultProps} />);

      const dropZone = screen.getByText('Drop files here or click to upload').closest('div');
      expect(dropZone).toBeInTheDocument();
      const testFile = createMockFile('dropped.jpg', 'image/jpeg');

      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [testFile],
          items: [testFile],
        },
      });

      fireEvent(dropZone, dropEvent);

      await waitFor(() => {
        expect(galleryApi.uploadAttachment).toHaveBeenCalledWith('task-1', testFile);
      });
    });

    it('should show upload progress', async () => {
      const user = userEvent.setup();
      const { galleryApi } = await import('@/lib/api');

      // Mock slow upload
      (galleryApi.uploadAttachment as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(createMockAttachment()), 100))
      );

      render(<GalleryTab {...defaultProps} />);

      const fileInput = screen.getByLabelText(/upload files/i);
      const testFile = createMockFile('slow-upload.jpg', 'image/jpeg');

      await user.upload(fileInput, testFile);

      // Should show uploading state
      expect(screen.getByText(/uploading/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/uploading/i)).not.toBeInTheDocument();
      });
    });

    it('should handle upload errors', async () => {
      const user = userEvent.setup();
      const { galleryApi } = await import('@/lib/api');

      (galleryApi.uploadAttachment as jest.Mock).mockRejectedValue(new Error('Upload failed'));

      // Suppress console errors for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<GalleryTab {...defaultProps} />);

      const fileInput = screen.getByLabelText(/upload files/i);
      const testFile = createMockFile('error-upload.jpg', 'image/jpeg');

      await user.upload(fileInput, testFile);

      await waitFor(() => {
        expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should validate file size limits', async () => {
      const user = userEvent.setup();

      render(<GalleryTab {...defaultProps} />);

      const fileInput = screen.getByLabelText(/upload files/i);
      const largeFile = createMockFile('large-file.jpg', 'image/jpeg', 50 * 1024 * 1024); // 50MB

      await user.upload(fileInput, largeFile);

      expect(screen.getByText(/file too large/i)).toBeInTheDocument();
    });

    it('should validate file types', async () => {
      const user = userEvent.setup();

      render(<GalleryTab {...defaultProps} />);

      const fileInput = screen.getByLabelText(/upload files/i);
      const invalidFile = createMockFile('script.exe', 'application/octet-stream');

      await user.upload(fileInput, invalidFile);

      expect(screen.getByText(/file type not supported/i)).toBeInTheDocument();
    });
  });

  describe('Attachment display', () => {
    it('should display image attachments in gallery', async () => {
      const { galleryApi } = await import('@/lib/api');
      const imageAttachments = [
        createMockAttachment({
          id: 'img-1',
          filename: 'image1.jpg',
          file_type: 'image',
          mime_type: 'image/jpeg',
        }),
        createMockAttachment({
          id: 'img-2',
          filename: 'image2.png',
          file_type: 'image',
          mime_type: 'image/png',
        }),
      ];

      (galleryApi.getAttachments as jest.Mock).mockResolvedValue(imageAttachments);

      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByAltText('image1.jpg')).toBeInTheDocument();
        expect(screen.getByAltText('image2.png')).toBeInTheDocument();
      });
    });

    it('should display non-image attachments as file cards', async () => {
      const { galleryApi } = await import('@/lib/api');
      const documentAttachments = [
        createMockAttachment({
          id: 'doc-1',
          filename: 'document.pdf',
          file_type: 'document',
          mime_type: 'application/pdf',
        }),
        createMockAttachment({
          id: 'txt-1',
          filename: 'readme.txt',
          file_type: 'text',
          mime_type: 'text/plain',
        }),
      ];

      (galleryApi.getAttachments as jest.Mock).mockResolvedValue(documentAttachments);

      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('document.pdf')).toBeInTheDocument();
        expect(screen.getByText('readme.txt')).toBeInTheDocument();
      });
    });

    it('should show attachment metadata', async () => {
      const { galleryApi } = await import('@/lib/api');
      const attachment = createMockAttachment({
        filename: 'test-file.jpg',
        file_size: 2048,
        created_at: '2024-01-01T12:00:00Z',
      });

      (galleryApi.getAttachments as jest.Mock).mockResolvedValue([attachment]);

      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('test-file.jpg')).toBeInTheDocument();
        expect(screen.getByText(/2 KB/i)).toBeInTheDocument();
      });
    });

    it('should handle attachment deletion', async () => {
      const user = userEvent.setup();
      const { galleryApi } = await import('@/lib/api');
      const attachment = createMockAttachment({ id: 'delete-me', filename: 'to-delete.jpg' });

      (galleryApi.getAttachments as jest.Mock).mockResolvedValue([attachment]);
      (galleryApi.deleteAttachment as jest.Mock).mockResolvedValue(undefined);

      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('to-delete.jpg')).toBeInTheDocument();
      });

      const deleteButton = screen.getByLabelText(/delete attachment/i);
      await user.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByText(/confirm/i);
      await user.click(confirmButton);

      await waitFor(() => {
        expect(galleryApi.deleteAttachment).toHaveBeenCalledWith('task-1', 'delete-me');
      });
    });

    it('should open image viewer on click', async () => {
      const user = userEvent.setup();
      const { galleryApi } = await import('@/lib/api');
      const imageAttachment = createMockAttachment({
        filename: 'clickable.jpg',
        file_type: 'image',
      });

      (galleryApi.getAttachments as jest.Mock).mockResolvedValue([imageAttachment]);

      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByAltText('clickable.jpg')).toBeInTheDocument();
      });

      await user.click(screen.getByAltText('clickable.jpg'));

      expect(screen.getByTestId('image-viewer')).toBeInTheDocument();
    });
  });

  describe('Comments functionality', () => {
    it('should display existing comments', async () => {
      const { galleryApi } = await import('@/lib/api');
      const comments = [
        createMockComment({
          id: 'comment-1',
          author: 'John Doe',
          content: 'Great work on this task!',
          created_at: '2024-01-01T10:00:00Z',
        }),
        createMockComment({
          id: 'comment-2',
          author: 'Jane Smith',
          content: 'Could we add more details?',
          created_at: '2024-01-01T11:00:00Z',
        }),
      ];

      (galleryApi.getComments as jest.Mock).mockResolvedValue(comments);

      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Great work on this task!')).toBeInTheDocument();
        expect(screen.getByText('Could we add more details?')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should allow creating new comments', async () => {
      const user = userEvent.setup();
      const { galleryApi } = await import('@/lib/api');

      const newComment = createMockComment({
        id: 'new-comment',
        content: 'This is a new comment',
      });

      (galleryApi.createComment as jest.Mock).mockResolvedValue(newComment);

      render(<GalleryTab {...defaultProps} />);

      const commentInput = screen.getByPlaceholderText(/add a comment/i);
      await user.type(commentInput, 'This is a new comment');

      const submitButton = screen.getByText(/post comment/i);
      await user.click(submitButton);

      await waitFor(() => {
        expect(galleryApi.createComment).toHaveBeenCalledWith('task-1', {
          author: expect.any(String),
          content: 'This is a new comment',
        });
      });
    });

    it('should handle comment editing', async () => {
      const user = userEvent.setup();
      const { galleryApi } = await import('@/lib/api');

      const existingComment = createMockComment({
        id: 'editable-comment',
        content: 'Original content',
        author: 'Current User',
      });

      (galleryApi.getComments as jest.Mock).mockResolvedValue([existingComment]);
      (galleryApi.updateComment as jest.Mock).mockResolvedValue({
        ...existingComment,
        content: 'Updated content',
      });

      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Original content')).toBeInTheDocument();
      });

      const editButton = screen.getByLabelText(/edit comment/i);
      await user.click(editButton);

      const editInput = screen.getByDisplayValue('Original content');
      await user.clear(editInput);
      await user.type(editInput, 'Updated content');

      const saveButton = screen.getByText(/save/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(galleryApi.updateComment).toHaveBeenCalledWith('editable-comment', {
          content: 'Updated content',
        });
      });
    });

    it('should handle comment deletion', async () => {
      const user = userEvent.setup();
      const { galleryApi } = await import('@/lib/api');

      const deletableComment = createMockComment({
        id: 'deletable-comment',
        content: 'Delete this comment',
        author: 'Current User',
      });

      (galleryApi.getComments as jest.Mock).mockResolvedValue([deletableComment]);
      (galleryApi.deleteComment as jest.Mock).mockResolvedValue(undefined);

      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Delete this comment')).toBeInTheDocument();
      });

      const deleteButton = screen.getByLabelText(/delete comment/i);
      await user.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByText(/confirm/i);
      await user.click(confirmButton);

      await waitFor(() => {
        expect(galleryApi.deleteComment).toHaveBeenCalledWith('deletable-comment');
      });
    });

    it('should support markdown in comments', async () => {
      const { galleryApi } = await import('@/lib/api');

      const markdownComment = createMockComment({
        content: '**Bold text** and *italic text*',
      });

      (galleryApi.getComments as jest.Mock).mockResolvedValue([markdownComment]);

      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('markdown-content')).toHaveTextContent('**Bold text** and *italic text*');
      });
    });
  });

  describe('Search and filtering', () => {
    it('should filter attachments by search term', async () => {
      const user = userEvent.setup();
      const { galleryApi } = await import('@/lib/api');

      const attachments = [
        createMockAttachment({ filename: 'important-document.pdf' }),
        createMockAttachment({ filename: 'random-image.jpg' }),
        createMockAttachment({ filename: 'important-notes.txt' }),
      ];

      (galleryApi.getAttachments as jest.Mock).mockResolvedValue(attachments);

      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('important-document.pdf')).toBeInTheDocument();
        expect(screen.getByText('random-image.jpg')).toBeInTheDocument();
        expect(screen.getByText('important-notes.txt')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search files/i);
      await user.type(searchInput, 'important');

      await waitFor(() => {
        expect(screen.getByText('important-document.pdf')).toBeInTheDocument();
        expect(screen.getByText('important-notes.txt')).toBeInTheDocument();
        expect(screen.queryByText('random-image.jpg')).not.toBeInTheDocument();
      });
    });

    it('should filter attachments by file type', async () => {
      const user = userEvent.setup();
      const { galleryApi } = await import('@/lib/api');

      const attachments = [
        createMockAttachment({ filename: 'image1.jpg', file_type: 'image' }),
        createMockAttachment({ filename: 'document1.pdf', file_type: 'document' }),
        createMockAttachment({ filename: 'image2.png', file_type: 'image' }),
      ];

      (galleryApi.getAttachments as jest.Mock).mockResolvedValue(attachments);

      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('image1.jpg')).toBeInTheDocument();
        expect(screen.getByText('document1.pdf')).toBeInTheDocument();
        expect(screen.getByText('image2.png')).toBeInTheDocument();
      });

      const filterSelect = screen.getByLabelText(/filter by type/i);
      await user.selectOptions(filterSelect, 'image');

      await waitFor(() => {
        expect(screen.getByText('image1.jpg')).toBeInTheDocument();
        expect(screen.getByText('image2.png')).toBeInTheDocument();
        expect(screen.queryByText('document1.pdf')).not.toBeInTheDocument();
      });
    });
  });

  describe('Responsive behavior', () => {
    it('should adapt layout for mobile screens', () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<GalleryTab {...defaultProps} />);

      const galleryContainer = screen.getByTestId('gallery-container');
      expect(galleryContainer).toHaveClass('grid-cols-1');
    });

    it('should adapt layout for desktop screens', () => {
      // Mock window.innerWidth for desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(<GalleryTab {...defaultProps} />);

      const galleryContainer = screen.getByTestId('gallery-container');
      expect(galleryContainer).toHaveClass('md:grid-cols-3');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for interactive elements', async () => {
      const { galleryApi } = await import('@/lib/api');
      const attachment = createMockAttachment({ filename: 'test.jpg' });

      (galleryApi.getAttachments as jest.Mock).mockResolvedValue([attachment]);

      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/upload files/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/delete attachment/i)).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      const { galleryApi } = await import('@/lib/api');
      const attachment = createMockAttachment({ filename: 'keyboard-nav.jpg' });

      (galleryApi.getAttachments as jest.Mock).mockResolvedValue([attachment]);

      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByAltText('keyboard-nav.jpg')).toBeInTheDocument();
      });

      // Tab to the image
      await user.tab();
      const image = screen.getByAltText('keyboard-nav.jpg');
      expect(image).toHaveFocus();

      // Press Enter to open viewer
      await user.keyboard('{Enter}');
      expect(screen.getByTestId('image-viewer')).toBeInTheDocument();
    });

    it('should announce file upload status to screen readers', async () => {
      const user = userEvent.setup();
      const { galleryApi } = await import('@/lib/api');

      (galleryApi.uploadAttachment as jest.Mock).mockResolvedValue(createMockAttachment());

      render(<GalleryTab {...defaultProps} />);

      const fileInput = screen.getByLabelText(/upload files/i);
      const testFile = createMockFile('accessibility-test.jpg', 'image/jpeg');

      await user.upload(fileInput, testFile);

      expect(screen.getByRole('status')).toHaveTextContent(/uploading/i);

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/upload complete/i);
      });
    });
  });
});