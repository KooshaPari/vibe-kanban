import { useEffect, useState } from 'react';
import TaskDetailsHeader from './TaskDetailsHeader';
import { TaskFollowUpSection } from './TaskFollowUpSection';
import { EditorSelectionDialog } from './EditorSelectionDialog';
import {
  getBackdropClasses,
  getTaskPanelClasses,
} from '@/lib/responsive-config';
import type { TaskWithAttemptStatus } from 'shared/types';
import DiffTab from '@/components/tasks/TaskDetails/DiffTab.tsx';
import LogsTab from '@/components/tasks/TaskDetails/LogsTab.tsx';
import GalleryTab from '@/components/tasks/TaskDetails/GalleryTab.tsx';
import RelatedTasksTab from '@/components/tasks/TaskDetails/RelatedTasksTab.tsx';
import DeleteFileConfirmationDialog from '@/components/tasks/DeleteFileConfirmationDialog.tsx';
import TabNavigation from '@/components/tasks/TaskDetails/TabNavigation.tsx';
import CollapsibleToolbar from '@/components/tasks/TaskDetails/CollapsibleToolbar.tsx';
import TaskDetailsProvider from '../context/TaskDetailsContextProvider.tsx';

interface TaskDetailsPanelProps {
  task: TaskWithAttemptStatus | null;
  projectHasDevScript?: boolean;
  projectId: string;
  onClose: () => void;
  onEditTask?: (task: TaskWithAttemptStatus) => void;
  onDeleteTask?: (taskId: string) => void;
  isDialogOpen?: boolean;
}

export function TaskDetailsPanel({
  task,
  projectHasDevScript,
  projectId,
  onClose,
  onEditTask,
  onDeleteTask,
  isDialogOpen = false,
}: TaskDetailsPanelProps) {
  const [showEditorDialog, setShowEditorDialog] = useState(false);

  // Tab and collapsible state
  const [activeTab, setActiveTab] = useState<
    'logs' | 'diffs' | 'gallery' | 'related'
  >('logs');
  const [_userSelectedTab, setUserSelectedTab] = useState<boolean>(false);

  // Reset to logs tab when task changes
  useEffect(() => {
    if (task?.id) {
      setActiveTab('logs');
    }
  }, [task?.id]);

  // Handle ESC key locally to prevent global navigation
  useEffect(() => {
    if (isDialogOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose, isDialogOpen]);

  return (
    <>
      {!task ? null : (
        <TaskDetailsProvider
          key={task.id}
          task={task}
          projectId={projectId}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setShowEditorDialog={setShowEditorDialog}
          projectHasDevScript={projectHasDevScript}
        >
          {/* Backdrop - only on smaller screens (overlay mode) */}
          <div className={getBackdropClasses()} onClick={onClose} />

          {/* Panel */}
          <div className={getTaskPanelClasses()}>
            <div className="flex flex-col h-full">
              <TaskDetailsHeader
                onClose={onClose}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
              />

              <CollapsibleToolbar />

              <TabNavigation
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                setUserSelectedTab={setUserSelectedTab}
              />

              {/* Tab Content */}
              <div
                className={`flex-1 flex flex-col min-h-0 ${
                  activeTab === 'gallery'
                    ? 'overflow-hidden'
                    : 'overflow-hidden'
                } ${activeTab === 'logs' ? 'p-4' : activeTab === 'gallery' ? '' : 'pt-4'}`}
              >
                {activeTab === 'diffs' ? (
                  <DiffTab />
                ) : activeTab === 'gallery' ? (
                  <GalleryTab taskId={task.id} />
                ) : activeTab === 'related' ? (
                  <RelatedTasksTab />
                ) : (
                  <LogsTab />
                )}
              </div>

              {/* Only show TaskFollowUpSection when not in gallery or related tab */}
              {activeTab !== 'gallery' && activeTab !== 'related' && (
                <TaskFollowUpSection />
              )}
              {/* Debug info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 p-2 bg-gray-100">
                  Debug: activeTab = {activeTab}, hiding chat ={' '}
                  {activeTab === 'gallery' ? 'true' : 'false'}
                </div>
              )}
            </div>
          </div>

          <EditorSelectionDialog
            isOpen={showEditorDialog}
            onClose={() => setShowEditorDialog(false)}
          />

          <DeleteFileConfirmationDialog />
        </TaskDetailsProvider>
      )}
    </>
  );
}
