import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../utils/test-utils';

// Type definitions
interface ProjectData {
  name: string;
  description: string;
  path: string;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}

interface FormErrors {
  name?: string;
  description?: string;
  path?: string;
}

interface ValidationState {
  path?: ValidationResult;
}

// Mock the API
jest.mock('@/lib/api', () => ({
  projectsApi: {
    createProject: jest.fn(),
    updateProject: jest.fn(),
    validateProject: jest.fn(),
  },
  configApi: {
    getConfig: jest.fn(),
    saveConfig: jest.fn(),
  },
  githubAuthApi: {
    checkGithubToken: jest.fn().mockResolvedValue(true),
    start: jest.fn(),
    poll: jest.fn(),
  },
}));

// Simulated project form component
const ProjectForm = ({
  project,
  onSubmit,
  onCancel,
  mode = 'create',
}: {
  project?: ProjectData;
  onSubmit: (data: ProjectData) => Promise<void>;
  onCancel: () => void;
  mode?: 'create' | 'edit';
}) => {
  const [formData, setFormData] = React.useState({
    name: project?.name || '',
    description: project?.description || '',
    path: project?.path || '',
  });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [validationState, setValidationState] = React.useState<ValidationState>(
    {}
  );

  const validateField = async (field: string, value: string) => {
    const { projectsApi } = await import('@/lib/api');

    if (field === 'path' && value) {
      try {
        const result = await projectsApi.validateProject({ path: value });
        setValidationState((prev) => ({ ...prev, path: result }));
        if (!result.valid) {
          setErrors((prev) => ({ ...prev, path: result.error }));
        } else {
          setErrors((prev) => ({ ...prev, path: undefined }));
        }
      } catch (err) {
        setErrors((prev) => ({ ...prev, path: 'Validation failed' }));
      }
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    // Validate path field on change
    if (field === 'path') {
      validateField(field, value);
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Project name must be at least 3 characters';
    }

    if (!formData.path.trim()) {
      newErrors.path = 'Project path is required';
    }

    if (validationState.path && !validationState.path.valid) {
      newErrors.path = validationState.path.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      if (err instanceof Error && err.message.includes('already exists')) {
        setErrors({ name: 'A project with this name already exists' });
      } else {
        setErrors({
          submit: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="project-form">
      <div>
        <label htmlFor="name">Project Name</label>
        <input
          id="name"
          data-testid="name-input"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          disabled={isSubmitting}
        />
        {errors.name && <div data-testid="name-error">{errors.name}</div>}
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
        <label htmlFor="path">Project Path</label>
        <input
          id="path"
          data-testid="path-input"
          value={formData.path}
          onChange={(e) => handleChange('path', e.target.value)}
          disabled={isSubmitting}
        />
        {errors.path && <div data-testid="path-error">{errors.path}</div>}
        {validationState.path?.valid && (
          <div data-testid="path-valid">✓ Path is valid</div>
        )}
      </div>

      {errors.submit && <div data-testid="submit-error">{errors.submit}</div>}

      <div>
        <button
          type="submit"
          data-testid="submit-button"
          disabled={isSubmitting || Object.keys(errors).length > 0}
        >
          {isSubmitting
            ? 'Saving...'
            : mode === 'create'
              ? 'Create Project'
              : 'Update Project'}
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

// Test component that uses the form
const ProjectFormTestComponent = ({
  mode = 'create',
}: {
  mode?: 'create' | 'edit';
}) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const [result, setResult] = React.useState<ProjectData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const existingProject =
    mode === 'edit'
      ? {
          id: '1',
          name: 'Existing Project',
          description: 'Existing description',
          path: '/existing/path',
        }
      : undefined;

  const handleSubmit = async (data: ProjectData) => {
    const { projectsApi } = await import('@/lib/api');

    let result;
    if (mode === 'create') {
      result = await projectsApi.createProject(data);
    } else {
      if (!existingProject) {
        throw new Error('existingProject is required for update mode');
      }
      result = await projectsApi.updateProject(existingProject.id, data);
    }

    setResult(result);
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
        <ProjectForm
          project={existingProject}
          mode={mode}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}

      {result && (
        <div data-testid="success-result">
          <div data-testid="result-name">{result.name}</div>
          <div data-testid="result-description">{result.description}</div>
          <div data-testid="result-path">{result.path}</div>
        </div>
      )}

      {error && <div data-testid="error-result">{error}</div>}

      <div data-testid="form-open">{isOpen ? 'open' : 'closed'}</div>
    </div>
  );
};

describe('Project Form Integration Tests', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    // Setup config API mocks
    const { configApi } = await import('@/lib/api');
    (configApi.getConfig as jest.Mock).mockResolvedValue({
      disclaimer_acknowledged: true,
      onboarding_acknowledged: true,
      telemetry_acknowledged: true,
      github_login_acknowledged: true,
      analytics_enabled: false,
      theme: 'light',
      executor: {
        type: 'local',
        local: { is_valid: true, validation_error: null },
        anthropic: { is_valid: false, validation_error: null },
        openai: { is_valid: false, validation_error: null },
      },
      editor: {
        editor_type: 'vs_code',
        custom_command: null,
      },
    });
    (configApi.saveConfig as jest.Mock).mockResolvedValue(undefined);

    // Setup projects API mocks
    const { projectsApi } = await import('@/lib/api');
    (projectsApi.validateProject as jest.Mock).mockResolvedValue({
      valid: true,
    });
    (projectsApi.createProject as jest.Mock).mockResolvedValue({
      id: 'project-1',
      name: 'Test Project',
      description: 'A test project',
      path: '/test/path',
    });
    (projectsApi.updateProject as jest.Mock).mockResolvedValue({
      id: 'project-1',
      name: 'Updated Project',
      description: 'An updated project',
      path: '/updated/path',
    });
  });

  describe('Project Creation Form', () => {
    it('creates project with valid data', async () => {
      const user = userEvent.setup();
      const { projectsApi } = await import('@/lib/api');

      // Mock successful validation
      (projectsApi.validateProject as jest.Mock).mockResolvedValue({
        valid: true,
      });

      // Mock successful creation
      const createdProject = {
        id: 'new-1',
        name: 'My New Project',
        description: 'A great new project',
        path: '/home/user/my-project',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      (projectsApi.createProject as jest.Mock).mockResolvedValue(
        createdProject
      );

      render(<ProjectFormTestComponent mode="create" />);

      // Fill out the form
      const nameInput = screen.getByTestId('name-input');
      const descriptionInput = screen.getByTestId('description-input');
      const pathInput = screen.getByTestId('path-input');

      await user.type(nameInput, 'My New Project');
      await user.type(descriptionInput, 'A great new project');
      await user.type(pathInput, '/home/user/my-project');

      // Wait for path validation
      await waitFor(() => {
        expect(screen.getByTestId('path-valid')).toHaveTextContent(
          '✓ Path is valid'
        );
      });

      // Wait for all validations to complete and no errors
      await waitFor(() => {
        expect(screen.queryByTestId('name-error')).not.toBeInTheDocument();
        expect(
          screen.queryByTestId('description-error')
        ).not.toBeInTheDocument();
        expect(screen.queryByTestId('path-error')).not.toBeInTheDocument();
      });

      // Submit the form - wait for button to be enabled
      const submitButton = screen.getByTestId('submit-button');
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      await user.click(submitButton);

      // Should show submitting state
      expect(screen.getByTestId('form-state')).toHaveTextContent('submitting');
      expect(submitButton).toHaveTextContent('Saving...');

      // Should call API with correct data
      await waitFor(() => {
        expect(projectsApi.createProject).toHaveBeenCalledWith({
          name: 'My New Project',
          description: 'A great new project',
          path: '/home/user/my-project',
        });
      });

      // Should show success result and close form
      await waitFor(() => {
        expect(screen.getByTestId('form-open')).toHaveTextContent('closed');
        expect(screen.getByTestId('result-name')).toHaveTextContent(
          'My New Project'
        );
        expect(screen.getByTestId('result-description')).toHaveTextContent(
          'A great new project'
        );
        expect(screen.getByTestId('result-path')).toHaveTextContent(
          '/home/user/my-project'
        );
      });
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();

      render(<ProjectFormTestComponent mode="create" />);

      // Try to submit empty form
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByTestId('name-error')).toHaveTextContent(
          'Project name is required'
        );
        expect(screen.getByTestId('path-error')).toHaveTextContent(
          'Project path is required'
        );
      });

      // Form should not be submitted
      expect(screen.getByTestId('form-state')).toHaveTextContent('idle');
      expect(screen.getByTestId('form-open')).toHaveTextContent('open');
    });

    it('validates minimum name length', async () => {
      const user = userEvent.setup();

      render(<ProjectFormTestComponent mode="create" />);

      const nameInput = screen.getByTestId('name-input');
      await user.type(nameInput, 'ab'); // Too short

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('name-error')).toHaveTextContent(
          'Project name must be at least 3 characters'
        );
      });
    });

    it('validates path in real-time', async () => {
      const user = userEvent.setup();
      const { projectsApi } = await import('@/lib/api');

      // Mock path validation failure
      (projectsApi.validateProject as jest.Mock).mockResolvedValue({
        valid: false,
        error: 'Path does not exist',
      });

      render(<ProjectFormTestComponent mode="create" />);

      const pathInput = screen.getByTestId('path-input');
      await user.type(pathInput, '/invalid/path');

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByTestId('path-error')).toHaveTextContent(
          'Path does not exist'
        );
      });

      // Submit button should be disabled
      expect(screen.getByTestId('submit-button')).toBeDisabled();
    });

    it('clears field errors when user types', async () => {
      const user = userEvent.setup();

      render(<ProjectFormTestComponent mode="create" />);

      // Trigger validation error
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('name-error')).toHaveTextContent(
          'Project name is required'
        );
      });

      // Start typing in name field
      const nameInput = screen.getByTestId('name-input');
      await user.type(nameInput, 'M');

      // Error should be cleared
      expect(screen.queryByTestId('name-error')).not.toBeInTheDocument();
    });

    it('handles creation errors gracefully', async () => {
      const user = userEvent.setup();
      const { projectsApi } = await import('@/lib/api');

      (projectsApi.validateProject as jest.Mock).mockResolvedValue({
        valid: true,
      });
      (projectsApi.createProject as jest.Mock).mockRejectedValue(
        new Error('Project name already exists')
      );

      render(<ProjectFormTestComponent mode="create" />);

      // Fill out form
      await user.type(screen.getByTestId('name-input'), 'Duplicate Name');
      await user.type(screen.getByTestId('path-input'), '/valid/path');

      // Wait for path validation to complete
      await waitFor(() => {
        expect(screen.getByTestId('path-valid')).toHaveTextContent(
          '✓ Path is valid'
        );
      });

      // Submit form
      const submitButton = screen.getByTestId('submit-button');
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
      await user.click(submitButton);

      // Should show error in form
      await waitFor(() => {
        expect(screen.getByTestId('name-error')).toHaveTextContent(
          'A project with this name already exists'
        );
        expect(screen.getByTestId('form-state')).toHaveTextContent('idle');
        expect(screen.getByTestId('form-open')).toHaveTextContent('open');
      });
    });

    it('handles network errors during validation', async () => {
      const user = userEvent.setup();
      const { projectsApi } = await import('@/lib/api');

      (projectsApi.validateProject as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      render(<ProjectFormTestComponent mode="create" />);

      const pathInput = screen.getByTestId('path-input');
      await user.type(pathInput, '/some/path');

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByTestId('path-error')).toHaveTextContent(
          'Validation failed'
        );
      });
    });
  });

  describe('Project Edit Form', () => {
    it('loads existing project data', async () => {
      render(<ProjectFormTestComponent mode="edit" />);

      // Should populate form with existing data
      expect(screen.getByTestId('name-input')).toHaveValue('Existing Project');
      expect(screen.getByTestId('description-input')).toHaveValue(
        'Existing description'
      );
      expect(screen.getByTestId('path-input')).toHaveValue('/existing/path');

      // Submit button should show update text
      expect(screen.getByTestId('submit-button')).toHaveTextContent(
        'Update Project'
      );
    });

    it('updates project with modified data', async () => {
      const user = userEvent.setup();
      const { projectsApi } = await import('@/lib/api');

      (projectsApi.validateProject as jest.Mock).mockResolvedValue({
        valid: true,
      });

      const updatedProject = {
        id: '1',
        name: 'Updated Project Name',
        description: 'Updated description',
        path: '/existing/path',
        updated_at: '2024-01-02T00:00:00Z',
      };
      (projectsApi.updateProject as jest.Mock).mockResolvedValue(
        updatedProject
      );

      render(<ProjectFormTestComponent mode="edit" />);

      // Modify the name
      const nameInput = screen.getByTestId('name-input');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Project Name');

      // Modify the description
      const descriptionInput = screen.getByTestId('description-input');
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Updated description');

      // Submit the form
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      // Should call update API
      await waitFor(() => {
        expect(projectsApi.updateProject).toHaveBeenCalledWith('1', {
          name: 'Updated Project Name',
          description: 'Updated description',
          path: '/existing/path',
        });
      });

      // Should show updated result
      await waitFor(() => {
        expect(screen.getByTestId('result-name')).toHaveTextContent(
          'Updated Project Name'
        );
        expect(screen.getByTestId('result-description')).toHaveTextContent(
          'Updated description'
        );
      });
    });

    it('handles update conflicts', async () => {
      const user = userEvent.setup();
      const { projectsApi } = await import('@/lib/api');

      (projectsApi.validateProject as jest.Mock).mockResolvedValue({
        valid: true,
      });
      (projectsApi.updateProject as jest.Mock).mockRejectedValue(
        new Error('Project was modified by another user')
      );

      render(<ProjectFormTestComponent mode="edit" />);

      // Make a change and submit
      const nameInput = screen.getByTestId('name-input');
      await user.clear(nameInput);
      await user.type(nameInput, 'Conflicting Name');

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      // Should show conflict error
      await waitFor(() => {
        expect(screen.getByTestId('submit-error')).toHaveTextContent(
          'Project was modified by another user'
        );
      });
    });
  });

  describe('Form Cancellation', () => {
    it('cancels form without saving', async () => {
      const user = userEvent.setup();

      render(<ProjectFormTestComponent mode="create" />);

      // Fill out some data
      await user.type(screen.getByTestId('name-input'), 'Some Project');
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

    it('disables cancel button during submission', async () => {
      const user = userEvent.setup();
      const { projectsApi } = await import('@/lib/api');

      // Mock slow API response
      (projectsApi.validateProject as jest.Mock).mockResolvedValue({
        valid: true,
      });
      (projectsApi.createProject as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ id: '1', name: 'Test' }), 100)
          )
      );

      render(<ProjectFormTestComponent mode="create" />);

      // Fill and submit form
      await user.type(screen.getByTestId('name-input'), 'Test Project');
      await user.type(screen.getByTestId('path-input'), '/test/path');

      // Wait for path validation to complete
      await waitFor(() => {
        expect(screen.getByTestId('path-valid')).toHaveTextContent(
          '✓ Path is valid'
        );
      });

      const submitButton = screen.getByTestId('submit-button');
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
      await user.click(submitButton);

      // Cancel button should be disabled during submission
      const cancelButton = screen.getByTestId('cancel-button');
      expect(cancelButton).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByTestId('form-open')).toHaveTextContent('closed');
      });
    });
  });

  describe('Form Accessibility', () => {
    it('associates labels with inputs correctly', () => {
      render(<ProjectFormTestComponent mode="create" />);

      const nameInput = screen.getByTestId('name-input');
      const descriptionInput = screen.getByTestId('description-input');
      const pathInput = screen.getByTestId('path-input');

      expect(nameInput).toHaveAccessibleName('Project Name');
      expect(descriptionInput).toHaveAccessibleName('Description');
      expect(pathInput).toHaveAccessibleName('Project Path');
    });

    it('provides error messages for screen readers', async () => {
      const user = userEvent.setup();

      render(<ProjectFormTestComponent mode="create" />);

      // Trigger validation errors
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        const nameError = screen.getByTestId('name-error');
        const pathError = screen.getByTestId('path-error');

        expect(nameError).toBeInTheDocument();
        expect(pathError).toBeInTheDocument();
      });
    });

    it('maintains focus management during interactions', async () => {
      const user = userEvent.setup();

      render(<ProjectFormTestComponent mode="create" />);

      const nameInput = screen.getByTestId('name-input');
      await user.click(nameInput);

      expect(nameInput).toHaveFocus();

      // Tab to next field
      await user.tab();
      expect(screen.getByTestId('description-input')).toHaveFocus();
    });
  });
});
