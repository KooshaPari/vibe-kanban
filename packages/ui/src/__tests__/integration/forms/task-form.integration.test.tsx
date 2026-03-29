import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../utils/test-utils';

// Type definitions
interface TaskData {
  title: string;
  description: string;
  status: string;
  priority: string;
  tags: string[];
}

interface TaskFormErrors {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  tags?: string;
}

// Mock the API
jest.mock('@/lib/api', () => ({
  tasksApi: {
    createTask: jest.fn(),
    updateTask: jest.fn(),
    uploadFile: jest.fn(),
  },
}));

// Simulated task form component
const TaskForm = ({
  task,
  projectId,
  onSubmit,
  onCancel,
  mode = 'create',
}: {
  task?: TaskData;
  projectId: string;
  onSubmit: (data: TaskData) => Promise<void>;
  onCancel: () => void;
  mode?: 'create' | 'edit';
}) => {
  const [formData, setFormData] = React.useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    tags: task?.tags || [],
  });
  const [files, setFiles] = React.useState<File[]>([]);
  const [errors, setErrors] = React.useState<TaskFormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<number>(0);

  const handleChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles);

      // Validate file types and sizes
      const validFiles: File[] = [];
      const fileErrors: string[] = [];

      newFiles.forEach((file) => {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
          'text/plain',
          'application/json',
          'image/png',
          'image/jpeg',
          'application/pdf',
        ];

        if (file.size > maxSize) {
          fileErrors.push(`${file.name} is too large (max 10MB)`);
        } else if (!allowedTypes.includes(file.type)) {
          fileErrors.push(`${file.name} has an unsupported file type`);
        } else {
          validFiles.push(file);
        }
      });

      if (fileErrors.length > 0) {
        setErrors((prev) => ({ ...prev, files: fileErrors.join(', ') }));
      } else {
        setErrors((prev) => ({ ...prev, files: undefined }));
      }

      setFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: TaskFormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Task title must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Task description is required';
    }

    if (
      !['todo', 'in_progress', 'done', 'cancelled'].includes(formData.status)
    ) {
      newErrors.status = 'Invalid status';
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const uploadFiles = async (taskId: string) => {
    const { tasksApi } = await import('@/lib/api');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress((i / files.length) * 100);

      try {
        await tasksApi.uploadFile(taskId, file);
      } catch (err) {
        throw new Error(
          `Failed to upload ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    }
    setUploadProgress(100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const { tasksApi } = await import('@/lib/api');

      let result;
      if (mode === 'create') {
        result = await tasksApi.createTask(projectId, formData);

        // Upload files if any
        if (files.length > 0 && result.id) {
          await uploadFiles(result.id);
        }
      } else {
        if (!task) {
          throw new Error('task is required for update mode');
        }
        result = await tasksApi.updateTask(task.id, formData);

        // Upload additional files if any
        if (files.length > 0) {
          await uploadFiles(task.id);
        }
      }

      await onSubmit(result);
    } catch (err) {
      if (err instanceof Error && err.message.includes('duplicate')) {
        setErrors({ title: 'A task with this title already exists' });
      } else {
        setErrors({
          submit: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="task-form">
      <div>
        <label htmlFor="title">Task Title</label>
        <input
          id="title"
          data-testid="title-input"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          disabled={isSubmitting}
        />
        {errors.title && <div data-testid="title-error">{errors.title}</div>}
      </div>

      <div>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          data-testid="description-input"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          disabled={isSubmitting}
        />
        {errors.description && (
          <div data-testid="description-error">{errors.description}</div>
        )}
      </div>

      <div>
        <label htmlFor="status">Status</label>
        <select
          id="status"
          data-testid="status-select"
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value)}
          disabled={isSubmitting}
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {errors.status && <div data-testid="status-error">{errors.status}</div>}
      </div>

      <div>
        <label htmlFor="priority">Priority</label>
        <select
          id="priority"
          data-testid="priority-select"
          value={formData.priority}
          onChange={(e) => handleChange('priority', e.target.value)}
          disabled={isSubmitting}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      <div>
        <label htmlFor="file-input">Upload Files</label>
        <input
          id="file-input"
          type="file"
          data-testid="file-input"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={isSubmitting}
        />
        {errors.files && <div data-testid="files-error">{errors.files}</div>}
      </div>

      {files.length > 0 && (
        <div data-testid="selected-files">
          <h4>Selected Files:</h4>
          {files.map((file, index) => (
            <div key={index} data-testid={`file-${index}`}>
              <span data-testid={`file-name-${index}`}>{file.name}</span>
              <span data-testid={`file-size-${index}`}>
                ({Math.round(file.size / 1024)}KB)
              </span>
              <button
                type="button"
                data-testid={`remove-file-${index}`}
                onClick={() => removeFile(index)}
                disabled={isSubmitting}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {isSubmitting && files.length > 0 && (
        <div data-testid="upload-progress">
          Upload Progress: {uploadProgress.toFixed(0)}%
        </div>
      )}

      {errors.submit && <div data-testid="submit-error">{errors.submit}</div>}

      <div>
        <button
          type="submit"
          data-testid="submit-button"
          disabled={
            isSubmitting ||
            Object.keys(errors).some((key) => key !== 'submit' && errors[key])
          }
        >
          {isSubmitting
            ? files.length > 0
              ? 'Uploading...'
              : 'Saving...'
            : mode === 'create'
              ? 'Create Task'
              : 'Update Task'}
        </button>
        <button
          type="button"
          data-testid="cancel-button"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>

      <div data-testid="form-state">{isSubmitting ? 'submitting' : 'idle'}</div>
    </form>
  );
};

// Test component that uses the task form
const TaskFormTestComponent = ({
  mode = 'create',
  projectId = 'project-1',
}: {
  mode?: 'create' | 'edit';
  projectId?: string;
}) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const [result, setResult] = React.useState<TaskData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const existingTask =
    mode === 'edit'
      ? {
          id: 'task-1',
          project_id: projectId,
          title: 'Existing Task',
          description: 'Existing description',
          status: 'todo',
          priority: 'medium',
          tags: ['tag1', 'tag2'],
        }
      : undefined;

  const handleSubmit = async (data: TaskData) => {
    setResult(data);
    setIsOpen(false);
    setError(null);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setError(null);
  };

  return (
    <div>
      {isOpen && (
        <TaskForm
          task={existingTask}
          projectId={projectId}
          mode={mode}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}

      {result && (
        <div data-testid="success-result">
          <div data-testid="result-title">{result.title}</div>
          <div data-testid="result-description">{result.description}</div>
          <div data-testid="result-status">{result.status}</div>
          <div data-testid="result-priority">{result.priority}</div>
        </div>
      )}

      {error && <div data-testid="error-result">{error}</div>}

      <div data-testid="form-open">{isOpen ? 'open' : 'closed'}</div>
    </div>
  );
};

describe('Task Form Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Task Creation Form', () => {
    it('creates task with valid data', async () => {
      const user = userEvent.setup();
      const { tasksApi } = await import('@/lib/api');

      const createdTask = {
        id: 'new-task-1',
        project_id: 'project-1',
        title: 'My New Task',
        description: 'A great new task',
        status: 'todo',
        priority: 'high',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      (tasksApi.createTask as jest.Mock).mockResolvedValue(createdTask);

      render(<TaskFormTestComponent mode="create" />);

      // Fill out the form
      const titleInput = screen.getByTestId('title-input');
      const descriptionInput = screen.getByTestId('description-input');
      const prioritySelect = screen.getByTestId('priority-select');

      await user.type(titleInput, 'My New Task');
      await user.type(descriptionInput, 'A great new task');
      await user.selectOptions(prioritySelect, 'high');

      // Submit the form
      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).not.toBeDisabled();

      await user.click(submitButton);

      // Should show submitting state
      expect(screen.getByTestId('form-state')).toHaveTextContent('submitting');
      expect(submitButton).toHaveTextContent('Saving...');

      // Should call API with correct data
      await waitFor(() => {
        expect(tasksApi.createTask).toHaveBeenCalledWith('project-1', {
          title: 'My New Task',
          description: 'A great new task',
          status: 'todo',
          priority: 'high',
          tags: [],
        });
      });

      // Should show success result and close form
      await waitFor(() => {
        expect(screen.getByTestId('form-open')).toHaveTextContent('closed');
        expect(screen.getByTestId('result-title')).toHaveTextContent(
          'My New Task'
        );
        expect(screen.getByTestId('result-description')).toHaveTextContent(
          'A great new task'
        );
        expect(screen.getByTestId('result-priority')).toHaveTextContent('high');
      });
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();

      render(<TaskFormTestComponent mode="create" />);

      // Try to submit empty form
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByTestId('title-error')).toHaveTextContent(
          'Task title is required'
        );
        expect(screen.getByTestId('description-error')).toHaveTextContent(
          'Task description is required'
        );
      });

      // Form should not be submitted
      expect(screen.getByTestId('form-state')).toHaveTextContent('idle');
      expect(screen.getByTestId('form-open')).toHaveTextContent('open');
    });

    it('validates minimum title length', async () => {
      const user = userEvent.setup();

      render(<TaskFormTestComponent mode="create" />);

      const titleInput = screen.getByTestId('title-input');
      await user.type(titleInput, 'ab'); // Too short

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('title-error')).toHaveTextContent(
          'Task title must be at least 3 characters'
        );
      });
    });

    it('handles different task statuses', async () => {
      const user = userEvent.setup();
      const { tasksApi } = await import('@/lib/api');

      const createdTask = {
        id: 'new-task-1',
        title: 'In Progress Task',
        description: 'Task description',
        status: 'in_progress',
        priority: 'medium',
      };
      (tasksApi.createTask as jest.Mock).mockResolvedValue(createdTask);

      render(<TaskFormTestComponent mode="create" />);

      // Fill form with in_progress status
      await user.type(screen.getByTestId('title-input'), 'In Progress Task');
      await user.type(
        screen.getByTestId('description-input'),
        'Task description'
      );
      await user.selectOptions(
        screen.getByTestId('status-select'),
        'in_progress'
      );

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(tasksApi.createTask).toHaveBeenCalledWith(
          'project-1',
          expect.objectContaining({
            status: 'in_progress',
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('result-status')).toHaveTextContent(
          'in_progress'
        );
      });
    });
  });

  describe('File Upload Integration', () => {
    it('handles single file upload', async () => {
      const user = userEvent.setup();
      const { tasksApi } = await import('@/lib/api');

      const createdTask = {
        id: 'task-with-file',
        title: 'Task',
        description: 'Desc',
      };
      (tasksApi.createTask as jest.Mock).mockResolvedValue(createdTask);
      (tasksApi.uploadFile as jest.Mock).mockResolvedValue({ success: true });

      render(<TaskFormTestComponent mode="create" />);

      // Fill basic form
      await user.type(screen.getByTestId('title-input'), 'Task with File');
      await user.type(
        screen.getByTestId('description-input'),
        'Task description'
      );

      // Upload file
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });

      await user.upload(fileInput, file);

      // Should show selected file
      await waitFor(() => {
        expect(screen.getByTestId('selected-files')).toBeInTheDocument();
        expect(screen.getByTestId('file-name-0')).toHaveTextContent('test.txt');
        expect(screen.getByTestId('file-size-0')).toHaveTextContent('(12KB)');
      });

      // Submit form
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      // Should show uploading state
      expect(submitButton).toHaveTextContent('Uploading...');

      // Should create task and upload file
      await waitFor(() => {
        expect(tasksApi.createTask).toHaveBeenCalled();
        expect(tasksApi.uploadFile).toHaveBeenCalledWith(
          'task-with-file',
          file
        );
      });

      // Should show upload progress
      expect(screen.getByTestId('upload-progress')).toHaveTextContent(
        'Upload Progress: 100%'
      );
    });

    it('handles multiple file uploads', async () => {
      const user = userEvent.setup();
      const { tasksApi } = await import('@/lib/api');

      const createdTask = {
        id: 'task-multi-files',
        title: 'Task',
        description: 'Desc',
      };
      (tasksApi.createTask as jest.Mock).mockResolvedValue(createdTask);
      (tasksApi.uploadFile as jest.Mock).mockResolvedValue({ success: true });

      render(<TaskFormTestComponent mode="create" />);

      // Fill basic form
      await user.type(screen.getByTestId('title-input'), 'Task with Files');
      await user.type(
        screen.getByTestId('description-input'),
        'Task description'
      );

      // Upload multiple files
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const files = [
        new File(['content1'], 'file1.txt', { type: 'text/plain' }),
        new File(['content2'], 'file2.json', { type: 'application/json' }),
      ];

      await user.upload(fileInput, files);

      // Should show both files
      await waitFor(() => {
        expect(screen.getByTestId('file-name-0')).toHaveTextContent(
          'file1.txt'
        );
        expect(screen.getByTestId('file-name-1')).toHaveTextContent(
          'file2.json'
        );
      });

      // Submit form
      await user.click(screen.getByTestId('submit-button'));

      // Should upload both files
      await waitFor(() => {
        expect(tasksApi.uploadFile).toHaveBeenCalledTimes(2);
        expect(tasksApi.uploadFile).toHaveBeenCalledWith(
          'task-multi-files',
          files[0]
        );
        expect(tasksApi.uploadFile).toHaveBeenCalledWith(
          'task-multi-files',
          files[1]
        );
      });
    });

    it('validates file types and sizes', async () => {
      const user = userEvent.setup();

      render(<TaskFormTestComponent mode="create" />);

      // Try to upload unsupported file type
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const invalidFile = new File(['content'], 'script.exe', {
        type: 'application/x-executable',
      });

      await user.upload(fileInput, invalidFile);

      // Should show error
      await waitFor(() => {
        expect(screen.getByTestId('files-error')).toHaveTextContent(
          'script.exe has an unsupported file type'
        );
      });

      // Submit button should be disabled
      expect(screen.getByTestId('submit-button')).toBeDisabled();
    });

    it('allows removing selected files', async () => {
      const user = userEvent.setup();

      render(<TaskFormTestComponent mode="create" />);

      // Upload files
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const files = [
        new File(['content1'], 'file1.txt', { type: 'text/plain' }),
        new File(['content2'], 'file2.txt', { type: 'text/plain' }),
      ];

      await user.upload(fileInput, files);

      // Should show both files
      await waitFor(() => {
        expect(screen.getByTestId('file-name-0')).toHaveTextContent(
          'file1.txt'
        );
        expect(screen.getByTestId('file-name-1')).toHaveTextContent(
          'file2.txt'
        );
      });

      // Remove first file
      const removeButton = screen.getByTestId('remove-file-0');
      await user.click(removeButton);

      // Should only show second file
      expect(screen.queryByTestId('file-name-0')).not.toBeInTheDocument();
      expect(screen.getByTestId('file-name-0')).toHaveTextContent('file2.txt'); // Indices shift
    });

    it('handles file upload errors', async () => {
      const user = userEvent.setup();
      const { tasksApi } = await import('@/lib/api');

      const createdTask = {
        id: 'task-upload-fail',
        title: 'Task',
        description: 'Desc',
      };
      (tasksApi.createTask as jest.Mock).mockResolvedValue(createdTask);
      (tasksApi.uploadFile as jest.Mock).mockRejectedValue(
        new Error('Upload failed')
      );

      render(<TaskFormTestComponent mode="create" />);

      // Fill form and upload file
      await user.type(screen.getByTestId('title-input'), 'Task');
      await user.type(screen.getByTestId('description-input'), 'Description');

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      await user.upload(fileInput, file);

      // Submit form
      await user.click(screen.getByTestId('submit-button'));

      // Should show upload error
      await waitFor(() => {
        expect(screen.getByTestId('submit-error')).toHaveTextContent(
          'Failed to upload test.txt: Upload failed'
        );
      });

      expect(screen.getByTestId('form-state')).toHaveTextContent('idle');
    });
  });

  describe('Task Edit Form', () => {
    it('loads existing task data', async () => {
      render(<TaskFormTestComponent mode="edit" />);

      // Should populate form with existing data
      expect(screen.getByTestId('title-input')).toHaveValue('Existing Task');
      expect(screen.getByTestId('description-input')).toHaveValue(
        'Existing description'
      );
      expect(screen.getByTestId('status-select')).toHaveValue('todo');
      expect(screen.getByTestId('priority-select')).toHaveValue('medium');

      // Submit button should show update text
      expect(screen.getByTestId('submit-button')).toHaveTextContent(
        'Update Task'
      );
    });

    it('updates task with modified data', async () => {
      const user = userEvent.setup();
      const { tasksApi } = await import('@/lib/api');

      const updatedTask = {
        id: 'task-1',
        title: 'Updated Task Title',
        description: 'Updated description',
        status: 'in_progress',
        priority: 'high',
      };
      (tasksApi.updateTask as jest.Mock).mockResolvedValue(updatedTask);

      render(<TaskFormTestComponent mode="edit" />);

      // Modify the data
      const titleInput = screen.getByTestId('title-input');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Task Title');

      const statusSelect = screen.getByTestId('status-select');
      await user.selectOptions(statusSelect, 'in_progress');

      const prioritySelect = screen.getByTestId('priority-select');
      await user.selectOptions(prioritySelect, 'high');

      // Submit the form
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      // Should call update API
      await waitFor(() => {
        expect(tasksApi.updateTask).toHaveBeenCalledWith('task-1', {
          title: 'Updated Task Title',
          description: 'Existing description',
          status: 'in_progress',
          priority: 'high',
          tags: ['tag1', 'tag2'],
        });
      });

      // Should show updated result
      await waitFor(() => {
        expect(screen.getByTestId('result-title')).toHaveTextContent(
          'Updated Task Title'
        );
        expect(screen.getByTestId('result-status')).toHaveTextContent(
          'in_progress'
        );
        expect(screen.getByTestId('result-priority')).toHaveTextContent('high');
      });
    });
  });

  describe('Form Error Handling', () => {
    it('handles creation errors gracefully', async () => {
      const user = userEvent.setup();
      const { tasksApi } = await import('@/lib/api');

      (tasksApi.createTask as jest.Mock).mockRejectedValue(
        new Error('Task title duplicate')
      );

      render(<TaskFormTestComponent mode="create" />);

      // Fill out form
      await user.type(screen.getByTestId('title-input'), 'Duplicate Task');
      await user.type(screen.getByTestId('description-input'), 'Description');

      // Submit form
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      // Should show error in form
      await waitFor(() => {
        expect(screen.getByTestId('title-error')).toHaveTextContent(
          'A task with this title already exists'
        );
        expect(screen.getByTestId('form-state')).toHaveTextContent('idle');
        expect(screen.getByTestId('form-open')).toHaveTextContent('open');
      });
    });

    it('clears field errors when user types', async () => {
      const user = userEvent.setup();

      render(<TaskFormTestComponent mode="create" />);

      // Trigger validation error
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('title-error')).toHaveTextContent(
          'Task title is required'
        );
      });

      // Start typing in title field
      const titleInput = screen.getByTestId('title-input');
      await user.type(titleInput, 'T');

      // Error should be cleared
      expect(screen.queryByTestId('title-error')).not.toBeInTheDocument();
    });
  });

  describe('Form Cancellation', () => {
    it('cancels form without saving', async () => {
      const user = userEvent.setup();

      render(<TaskFormTestComponent mode="create" />);

      // Fill out some data
      await user.type(screen.getByTestId('title-input'), 'Some Task');
      await user.type(
        screen.getByTestId('description-input'),
        'Some description'
      );

      // Cancel the form
      const cancelButton = screen.getByTestId('cancel-button');
      await user.click(cancelButton);

      // Should close form without saving
      expect(screen.getByTestId('form-open')).toHaveTextContent('closed');
      expect(screen.queryByTestId('success-result')).not.toBeInTheDocument();
    });

    it('disables form during submission', async () => {
      const user = userEvent.setup();
      const { tasksApi } = await import('@/lib/api');

      // Mock slow API response
      (tasksApi.createTask as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ id: '1', title: 'Test' }), 100)
          )
      );

      render(<TaskFormTestComponent mode="create" />);

      // Fill and submit form
      await user.type(screen.getByTestId('title-input'), 'Test Task');
      await user.type(screen.getByTestId('description-input'), 'Description');

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      // All form fields should be disabled during submission
      expect(screen.getByTestId('title-input')).toBeDisabled();
      expect(screen.getByTestId('description-input')).toBeDisabled();
      expect(screen.getByTestId('status-select')).toBeDisabled();
      expect(screen.getByTestId('file-input')).toBeDisabled();
      expect(screen.getByTestId('cancel-button')).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByTestId('form-open')).toHaveTextContent('closed');
      });
    });
  });
});
