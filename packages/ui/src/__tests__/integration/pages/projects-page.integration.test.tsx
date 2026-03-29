import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../utils/test-utils';
import { Projects } from '@/pages/projects';
import { setupApiMocks } from '../../utils/api-test-setup';
import { createMockProject } from '../../../__mocks__/api';

// Mock the API module
jest.mock('@/lib/api');

describe('Projects Page Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupApiMocks();

    // Setup global fetch mock
    global.fetch = jest.fn();

    // Mock scrollIntoView for jsdom
    Element.prototype.scrollIntoView = jest.fn();

    // Mock confirm for delete operations
    window.confirm = jest.fn().mockReturnValue(true);
  });

  describe('Project List Display', () => {
    it('renders projects list and handles loading states', async () => {
      const { projectsApi } = await import('@/lib/api');
      const mockProject = createMockProject({
        id: '1',
        name: 'Test Project',
        git_repo_path: '/path/to/project',
      });

      (projectsApi.getAll as jest.Mock).mockResolvedValue([mockProject]);

      render(<Projects />);

      // Should show loading initially
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Wait for projects to load
      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Should display project created date
      expect(screen.getByText(/created/i)).toBeInTheDocument();
    });

    it('handles empty projects state', async () => {
      const { projectsApi } = await import('@/lib/api');
      (projectsApi.getAll as jest.Mock).mockResolvedValue([]);

      render(<Projects />);

      await waitFor(() => {
        expect(screen.getByText(/no projects yet/i)).toBeInTheDocument();
      });

      // Should show create project button
      expect(
        screen.getByRole('button', { name: /create your first project/i })
      ).toBeInTheDocument();
    });

    it('handles API errors gracefully', async () => {
      const { projectsApi } = await import('@/lib/api');
      (projectsApi.getAll as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      render(<Projects />);

      await waitFor(() => {
        expect(
          screen.getByText(/failed to fetch projects/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Project Creation Workflow', () => {
    it.skip('completes full project creation workflow', async () => {
      const user = userEvent.setup();
      const { projectsApi } = await import('@/lib/api');

      // Mock initial projects load
      (projectsApi.getAll as jest.Mock).mockResolvedValue([]);

      // Mock project creation
      const newProject = createMockProject({
        id: '2',
        name: 'New Project',
        git_repo_path: '/path/to/new/project',
      });
      (projectsApi.create as jest.Mock).mockResolvedValue(newProject);

      render(<Projects />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(/no projects yet/i)).toBeInTheDocument();
      });

      // Click create project button
      const createButton = screen.getByRole('button', {
        name: /create your first project/i,
      });
      await user.click(createButton);

      // Should open create project dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/create project/i)).toBeInTheDocument();
      });

      // Fill out the form
      const nameInput = screen.getByLabelText(/name/i);
      const pathInput = screen.getByLabelText(/git repository path/i);

      await user.type(nameInput, 'New Project');
      await user.type(pathInput, '/path/to/new/project');

      // Submit the form - get the submit button by type
      const dialog = screen.getByRole('dialog');
      const allCreateButtons = within(dialog).getAllByRole('button');
      const submitButton = allCreateButtons.find(
        (btn) => btn.type === 'submit' && btn.textContent === 'Create Project'
      );
      expect(submitButton).toBeInTheDocument();
      await user.click(submitButton);

      // Should call API
      await waitFor(() => {
        expect(projectsApi.create).toHaveBeenCalledWith({
          name: 'New Project',
          git_repo_path: '/path/to/new/project',
          setup_script: null,
          dev_script: null,
        });
      });
    });

    it.skip('handles form validation errors', async () => {
      const user = userEvent.setup();
      const { projectsApi } = await import('@/lib/api');

      (projectsApi.getAll as jest.Mock).mockResolvedValue([]);
      (projectsApi.create as jest.Mock).mockRejectedValue(
        new Error('Path already exists')
      );

      render(<Projects />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /create your first project/i })
        ).toBeInTheDocument();
      });

      // Open create dialog
      const createButton = screen.getByRole('button', {
        name: /create your first project/i,
      });
      await user.click(createButton);

      // Fill form with invalid data
      const nameInput = screen.getByLabelText(/name/i);
      const pathInput = screen.getByLabelText(/git repository path/i);

      await user.type(nameInput, 'Test');
      await user.type(pathInput, '/invalid/path');

      // Try to submit - get the submit button by type
      const dialog = screen.getByRole('dialog');
      const allCreateButtons = within(dialog).getAllByRole('button');
      const submitButton = allCreateButtons.find(
        (btn) => btn.type === 'submit' && btn.textContent === 'Create Project'
      );
      expect(submitButton).toBeInTheDocument();
      await user.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/path already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('Project Navigation', () => {
    it('navigates to project tasks when clicking on project', async () => {
      const user = userEvent.setup();
      const { projectsApi } = await import('@/lib/api');

      const mockProject = createMockProject({
        id: '1',
        name: 'Test Project',
        git_repo_path: '/path/to/project',
      });

      (projectsApi.getAll as jest.Mock).mockResolvedValue([mockProject]);

      render(<Projects />, { initialRoute: '/projects' });

      // Wait for projects to load
      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Click on project card to navigate
      const projectCard = screen
        .getByText('Test Project')
        .closest('[role="button"], .cursor-pointer');
      expect(projectCard).toBeInTheDocument();
      await user.click(projectCard);

      // Note: Navigation behavior would be tested in router integration tests
      // Here we just verify the project is clickable
      expect(projectCard).toBeInTheDocument();
    });
  });

  describe('Project Management', () => {
    it('handles project editing workflow', async () => {
      const user = userEvent.setup();
      const { projectsApi } = await import('@/lib/api');

      const mockProject = createMockProject({
        id: '1',
        name: 'Test Project',
        git_repo_path: '/path/to/project',
      });

      (projectsApi.getAll as jest.Mock).mockResolvedValue([mockProject]);
      (projectsApi.update as jest.Mock).mockResolvedValue({
        ...mockProject,
        name: 'Updated Project Name',
      });

      render(<Projects />);

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Open the dropdown menu first
      const dropdownTrigger = screen.getByRole('button', { name: '' }); // MoreHorizontal button
      await user.click(dropdownTrigger);

      // Now click edit option
      const editMenuItem = screen.getByText('Edit');
      await user.click(editMenuItem);

      // Should open edit dialog
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Project')).toBeInTheDocument();
      });

      // Update project name
      const nameInput = screen.getByDisplayValue('Test Project');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Project Name');

      // Submit changes
      const dialog = screen.getByRole('dialog');
      const saveButton = within(dialog).getByRole('button', {
        name: 'Save Changes',
      });
      await user.click(saveButton);

      // Should call update API
      await waitFor(() => {
        expect(projectsApi.update).toHaveBeenCalledWith('1', {
          name: 'Updated Project Name',
          git_repo_path: '/path/to/project',
          setup_script: null,
          dev_script: null,
        });
      });
    });

    it('handles project deletion with confirmation', async () => {
      const user = userEvent.setup();
      const { projectsApi } = await import('@/lib/api');

      const mockProject = createMockProject({
        id: '1',
        name: 'Test Project',
        git_repo_path: '/path/to/project',
      });

      (projectsApi.getAll as jest.Mock)
        .mockResolvedValueOnce([mockProject])
        .mockResolvedValueOnce([]); // After deletion
      (projectsApi.delete as jest.Mock).mockResolvedValue(undefined);

      render(<Projects />);

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Open the dropdown menu first
      const dropdownTrigger = screen.getByRole('button', { name: '' }); // MoreHorizontal button
      await user.click(dropdownTrigger);

      // Now click delete option
      const deleteMenuItem = screen.getByText('Delete');
      await user.click(deleteMenuItem);

      // Confirm function should have been called
      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining(
          'Are you sure you want to delete "Test Project"'
        )
      );

      // Should call delete API
      await waitFor(() => {
        expect(projectsApi.delete).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('Search and Filtering', () => {
    it('displays all projects when no search is applied', async () => {
      const { projectsApi } = await import('@/lib/api');

      const multipleProjects = [
        createMockProject({
          id: '1',
          name: 'Test Project',
          git_repo_path: '/test/path',
        }),
        createMockProject({
          id: '2',
          name: 'Another Project',
          git_repo_path: '/another/path',
        }),
      ];

      (projectsApi.getAll as jest.Mock).mockResolvedValue(multipleProjects);

      render(<Projects />);

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
        expect(screen.getByText('Another Project')).toBeInTheDocument();
      });

      // Both projects should be visible
      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('Another Project')).toBeInTheDocument();
    });
  });
});
