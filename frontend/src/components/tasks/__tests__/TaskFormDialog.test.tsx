import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@/__tests__/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { TaskFormDialog } from '../TaskFormDialog';
import type { TaskTemplate } from 'shared/types';

// Mock the config provider
jest.mock('@/components/config-provider', () => ({
  useConfig: () => ({
    config: {
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
      editor: { editor_type: 'vs_code', custom_command: null },
    },
    updateConfig: jest.fn(),
    updateAndSaveConfig: jest.fn(),
    saveConfig: jest.fn().mockResolvedValue(true),
    loading: false,
    githubTokenInvalid: false,
  }),
}));

// Mock the templates API specifically for this test
jest.mock('@/lib/api', () => ({
  ...jest.requireActual('@/lib/api'),
  templatesApi: {
    listByProject: jest.fn(),
    listGlobal: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// Get the mocked templatesApi to set up expectations
import { templatesApi } from '@/lib/api';
const mockTemplatesApi = templatesApi as jest.Mocked<typeof templatesApi>;

const mockTask = {
  id: '1',
  project_id: 'project-1',
  title: 'Test Task',
  description: 'Test description',
  status: 'todo' as const,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

const mockTemplate: TaskTemplate = {
  id: 'template-1',
  project_id: 'project-1',
  title: 'Template Task',
  description: 'Template description',
  template_name: 'Test Template',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

describe('TaskFormDialog', () => {
  const mockOnOpenChange = jest.fn();
  const mockOnCreateTask = jest.fn();
  const mockOnCreateAndStartTask = jest.fn();
  const mockOnUpdateTask = jest.fn();

  const defaultProps = {
    isOpen: true,
    onOpenChange: mockOnOpenChange,
    projectId: 'project-1',
    onCreateTask: mockOnCreateTask,
    onCreateAndStartTask: mockOnCreateAndStartTask,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTemplatesApi.listByProject.mockResolvedValue([mockTemplate]);
    mockTemplatesApi.listGlobal.mockResolvedValue([]);
  });

  describe('Create Mode', () => {

    it('renders create form correctly', () => {
      render(<TaskFormDialog {...defaultProps} />);

      expect(screen.getByText('Create New Task')).toBeInTheDocument();
      expect(screen.getByLabelText('Title')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Create Task' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Create & Start' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Cancel' })
      ).toBeInTheDocument();
    });

    it('initializes with disabled buttons when title is empty', async () => {
      render(<TaskFormDialog {...defaultProps} />);

      const createButton = screen.getByRole('button', { name: 'Create Task' });
      const createAndStartButton = screen.getByRole('button', {
        name: 'Create & Start',
      });

      expect(createButton).toBeDisabled();
      expect(createAndStartButton).toBeDisabled();
    });

    it('creates task when form is submitted', async () => {
      const user = userEvent.setup();
      render(<TaskFormDialog {...defaultProps} />);

      const titleInput = screen.getByLabelText('Title');
      const descriptionInput = screen.getByLabelText('Description');

      await user.type(titleInput, 'New Task');
      await user.type(descriptionInput, 'Task description');

      const createButton = screen.getByRole('button', { name: 'Create Task' });
      await user.click(createButton);

      await waitFor(() => {
        expect(mockOnCreateTask).toHaveBeenCalledWith(
          'New Task',
          'Task description'
        );
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('creates and starts task when Create & Start is clicked', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<TaskFormDialog {...defaultProps} />);
      });

      // Wait for template loading to complete before interacting
      await waitFor(() => {
        expect(mockTemplatesApi.listByProject).toHaveBeenCalled();
      });

      const titleInput = screen.getByLabelText('Title');
      await user.type(titleInput, 'New Task');

      const createAndStartButton = screen.getByRole('button', {
        name: 'Create & Start',
      });
      await user.click(createAndStartButton);

      await waitFor(() => {
        expect(mockOnCreateAndStartTask).toHaveBeenCalledWith(
          'New Task',
          '',
          expect.objectContaining({
            type: 'local',
            local: expect.objectContaining({
              is_valid: true,
            }),
          })
        );
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('loads and displays templates', async () => {
      await act(async () => {
        render(<TaskFormDialog {...defaultProps} />);
      });

      await waitFor(() => {
        expect(mockTemplatesApi.listByProject).toHaveBeenCalledWith(
          'project-1'
        );
        expect(mockTemplatesApi.listGlobal).toHaveBeenCalled();
      });

      // Click to expand template section
      await act(async () => {
        const templateToggle = screen.getByText('Use a template');
        fireEvent.click(templateToggle);
      });

      expect(screen.getByText('Test Template')).toBeInTheDocument();
    });

    it('applies template when selected', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<TaskFormDialog {...defaultProps} />);
      });

      await waitFor(() => {
        expect(mockTemplatesApi.listByProject).toHaveBeenCalled();
      });

      // Expand template section
      await act(async () => {
        const templateToggle = screen.getByText('Use a template');
        fireEvent.click(templateToggle);
      });

      // Select template
      const templateSelect = screen.getByDisplayValue(
        'Choose a template to prefill this form'
      );
      await user.click(templateSelect);

      const templateOption = await screen.findByText('Test Template');
      await user.click(templateOption);

      // Check that form is pre-filled
      expect(screen.getByDisplayValue('Template Task')).toBeInTheDocument();
      expect(
        screen.getByDisplayValue('Template description')
      ).toBeInTheDocument();
    });

    it('clears form when "No template" is selected', async () => {
      const user = userEvent.setup();
      await act(async () => {
        render(<TaskFormDialog {...defaultProps} />);
      });

      // Wait for templates to load
      await waitFor(() => {
        expect(mockTemplatesApi.listByProject).toHaveBeenCalled();
      });

      // First fill in some data
      const titleInput = screen.getByLabelText('Title');
      await user.type(titleInput, 'Some title');

      // Expand template section
      await act(async () => {
        const templateToggle = screen.getByText('Use a template');
        fireEvent.click(templateToggle);
      });

      // Select "No template"
      const templateSelect = screen.getByDisplayValue(
        'Choose a template to prefill this form'
      );
      await user.click(templateSelect);

      const noTemplateOption = await screen.findByText('No template');
      await user.click(noTemplateOption);

      // Check that form is cleared
      expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });

    it('handles template loading error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockTemplatesApi.listByProject.mockRejectedValue(new Error('API Error'));

      await act(async () => {
        render(<TaskFormDialog {...defaultProps} />);
      });

      await waitFor(() => {
        expect(mockTemplatesApi.listByProject).toHaveBeenCalled();
      });

      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe('Edit Mode', () => {
    const editProps = {
      isOpen: true,
      onOpenChange: mockOnOpenChange,
      task: mockTask,
      onUpdateTask: mockOnUpdateTask,
    };

    it('renders edit form correctly', () => {
      render(<TaskFormDialog {...editProps} />);

      expect(screen.getByText('Edit Task')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Update Task' })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Create & Start' })
      ).not.toBeInTheDocument();
    });

    it('does not show template section in edit mode', () => {
      render(<TaskFormDialog {...editProps} />);

      expect(screen.queryByText('Use a template')).not.toBeInTheDocument();
    });

    it('updates task when form is submitted', async () => {
      const user = userEvent.setup();
      render(<TaskFormDialog {...editProps} />);

      const titleInput = screen.getByLabelText('Title');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Task');

      const updateButton = screen.getByRole('button', { name: 'Update Task' });
      await user.click(updateButton);

      await waitFor(() => {
        expect(mockOnUpdateTask).toHaveBeenCalledWith(
          'Updated Task',
          'Test description',
          'todo'
        );
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('updates task status', async () => {
      const user = userEvent.setup();
      render(<TaskFormDialog {...editProps} />);

      const statusSelect = screen.getByDisplayValue('To Do');
      await user.click(statusSelect);

      const inProgressOption = await screen.findByText('In Progress');
      await user.click(inProgressOption);

      const updateButton = screen.getByRole('button', { name: 'Update Task' });
      await user.click(updateButton);

      await waitFor(() => {
        expect(mockOnUpdateTask).toHaveBeenCalledWith(
          'Test Task',
          'Test description',
          'inprogress'
        );
      });
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('closes dialog on Escape key', async () => {
      render(
        <TaskFormDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          projectId="project-1"
          onCreateTask={mockOnCreateTask}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('creates and starts task on Ctrl+Enter in create mode', async () => {
      const user = userEvent.setup();
      render(
        <TaskFormDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          projectId="project-1"
          onCreateTask={mockOnCreateTask}
          onCreateAndStartTask={mockOnCreateAndStartTask}
        />
      );

      const titleInput = screen.getByLabelText('Title');
      await user.type(titleInput, 'New Task');

      fireEvent.keyDown(document, { key: 'Enter', ctrlKey: true });

      await waitFor(() => {
        expect(mockOnCreateAndStartTask).toHaveBeenCalledWith(
          'New Task',
          '',
          expect.objectContaining({
            type: 'local',
            local: expect.objectContaining({
              is_valid: true,
            }),
          })
        );
      });
    });

    it('updates task on Ctrl+Enter in edit mode', async () => {
      render(
        <TaskFormDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          task={mockTask}
          onUpdateTask={mockOnUpdateTask}
        />
      );

      fireEvent.keyDown(document, { key: 'Enter', ctrlKey: true });

      await waitFor(() => {
        expect(mockOnUpdateTask).toHaveBeenCalledWith(
          'Test Task',
          'Test description',
          'todo'
        );
      });
    });
  });

  describe('Form Reset and Cancel', () => {
    it('resets form on cancel in create mode', async () => {
      const user = userEvent.setup();
      render(
        <TaskFormDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          projectId="project-1"
          onCreateTask={mockOnCreateTask}
        />
      );

      const titleInput = screen.getByLabelText('Title');
      await user.type(titleInput, 'Some title');

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('resets form to original values on cancel in edit mode', async () => {
      const user = userEvent.setup();
      render(
        <TaskFormDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          task={mockTask}
          onUpdateTask={mockOnUpdateTask}
        />
      );

      const titleInput = screen.getByLabelText('Title');
      await user.clear(titleInput);
      await user.type(titleInput, 'Modified title');

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('resets form when reopening after close', () => {
      const { rerender } = render(
        <TaskFormDialog
          isOpen={false}
          onOpenChange={mockOnOpenChange}
          projectId="project-1"
          onCreateTask={mockOnCreateTask}
        />
      );

      // Reopen dialog
      rerender(
        <TaskFormDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          projectId="project-1"
          onCreateTask={mockOnCreateTask}
        />
      );

      expect(screen.getByDisplayValue('')).toBeInTheDocument(); // Empty title
    });
  });

  describe('Form Validation', () => {
    it('validates required title field', async () => {
      const user = userEvent.setup();
      render(<TaskFormDialog {...defaultProps} />);

      const createButton = screen.getByRole('button', { name: 'Create Task' });
      const createAndStartButton = screen.getByRole('button', {
        name: 'Create & Start',
      });

      expect(createButton).toBeDisabled();
      expect(createAndStartButton).toBeDisabled();

      const titleInput = screen.getByLabelText('Title');
      await user.type(titleInput, 'New Task');

      expect(createButton).toBeEnabled();
      expect(createAndStartButton).toBeEnabled();
    });

    it('prevents submission with empty title', async () => {
      const user = userEvent.setup();
      render(<TaskFormDialog {...defaultProps} />);

      const titleInput = screen.getByLabelText('Title');
      await user.type(titleInput, '   '); // Just whitespace

      const createButton = screen.getByRole('button', { name: 'Create Task' });
      expect(createButton).toBeDisabled();
    });

    it('validates title in edit mode', async () => {
      const user = userEvent.setup();
      render(
        <TaskFormDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          task={mockTask}
          onUpdateTask={mockOnUpdateTask}
        />
      );

      const titleInput = screen.getByLabelText('Title');
      await user.clear(titleInput);

      const updateButton = screen.getByRole('button', { name: 'Update Task' });
      expect(updateButton).toBeDisabled();
    });
  });

  describe('Loading States', () => {
    it('disables form elements during submission', async () => {
      const user = userEvent.setup();
      mockOnCreateTask.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <TaskFormDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          projectId="project-1"
          onCreateTask={mockOnCreateTask}
        />
      );

      const titleInput = screen.getByLabelText('Title');
      await user.type(titleInput, 'New Task');

      const createButton = screen.getByRole('button', { name: 'Create Task' });
      await user.click(createButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Creating...' })
        ).toBeInTheDocument();
        expect(titleInput).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
      });
    });

    it('shows correct loading text for Create & Start', async () => {
      const user = userEvent.setup();
      mockOnCreateAndStartTask.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <TaskFormDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          projectId="project-1"
          onCreateAndStartTask={mockOnCreateAndStartTask}
        />
      );

      const titleInput = screen.getByLabelText('Title');
      await user.type(titleInput, 'New Task');

      const createAndStartButton = screen.getByRole('button', {
        name: 'Create & Start',
      });
      await user.click(createAndStartButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Creating & Starting...' })
        ).toBeInTheDocument();
      });
    });

    it('shows correct loading text for update', async () => {
      const user = userEvent.setup();
      mockOnUpdateTask.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <TaskFormDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          task={mockTask}
          onUpdateTask={mockOnUpdateTask}
        />
      );

      const updateButton = screen.getByRole('button', { name: 'Update Task' });
      await user.click(updateButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Updating...' })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Initial Template Props', () => {
    it('pre-fills form with initial template data', () => {
      render(
        <TaskFormDialog
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          projectId="project-1"
          initialTemplate={mockTemplate}
          onCreateTask={mockOnCreateTask}
        />
      );

      expect(screen.getByDisplayValue('Template Task')).toBeInTheDocument();
      expect(
        screen.getByDisplayValue('Template description')
      ).toBeInTheDocument();
    });
  });
});
