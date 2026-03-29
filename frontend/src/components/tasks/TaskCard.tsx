import { KeyboardEvent, memo, useCallback, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { KanbanCard } from '@/components/ui/shadcn-io/kanban';
import {
  CheckCircle,
  Edit,
  Loader2,
  MoreHorizontal,
  Trash2,
  XCircle,
} from 'lucide-react';
import type { TaskWithAttemptStatus } from 'shared/types';
import { is_planning_executor_type } from '@/lib/utils';

type Task = TaskWithAttemptStatus;

interface TaskCardProps {
  task: Task;
  index: number;
  status: string;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onViewDetails: (task: Task) => void;
  isFocused: boolean;
  tabIndex?: number;
}

export const TaskCard = memo(function TaskCard({
  task,
  index,
  status,
  onEdit,
  onDelete,
  onViewDetails,
  isFocused,
  tabIndex = -1,
}: TaskCardProps) {
  const localRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isFocused && localRef.current) {
      localRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      localRef.current.focus();
    }
  }, [isFocused]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        onDelete(task.id);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onViewDetails(task);
      }
    },
    [task, onDelete, onViewDetails]
  );

  const handleCardClick = useCallback(() => {
    onViewDetails(task);
  }, [task, onViewDetails]);

  // Create accessible label for the task card
  const getTaskCardLabel = () => {
    let label = `Task: ${task.title}`;
    if (task.description) {
      label += `, Description: ${task.description.length > 50 
        ? task.description.substring(0, 50) + '...' 
        : task.description}`;
    }
    if (task.has_in_progress_attempt) {
      label += ', Status: In progress';
    }
    if (task.has_merged_attempt) {
      label += ', Status: Completed';
    }
    if (task.last_attempt_failed && !task.has_merged_attempt) {
      label += ', Status: Failed';
    }
    return label;
  };

  return (
    <KanbanCard
      key={task.id}
      id={task.id}
      name={task.title}
      index={index}
      parent={status}
    >
      <div className="space-y-2 relative">
        {/* Main clickable area */}
        <div 
          className="cursor-pointer"
          onClick={handleCardClick}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={tabIndex}
          ref={localRef}
          aria-label={getTaskCardLabel()}
          aria-describedby={task.description ? `task-${task.id}-description` : undefined}
        >
          <div className="flex items-start justify-between pr-8">
            <div className="flex-1 pr-2">
              <div className="mb-1">
                <h4 className="font-medium text-sm break-words">
                  {task.latest_attempt_executor &&
                    is_planning_executor_type(task.latest_attempt_executor) && (
                      <Badge className="bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium px-1.5 py-0.5 h-4 text-[10px] mr-1">
                        PLAN
                      </Badge>
                    )}
                  {task.title}
                </h4>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {/* In Progress Spinner */}
            {task.has_in_progress_attempt && (
              <Loader2 
                className="h-3 w-3 animate-spin text-blue-500" 
                aria-hidden="true"
                data-testid="loader-icon"
              />
            )}
            {/* Merged Indicator */}
            {task.has_merged_attempt && (
              <CheckCircle 
                className="h-3 w-3 text-green-500" 
                aria-hidden="true"
                data-testid="check-circle-icon"
              />
            )}
            {/* Failed Indicator */}
            {task.last_attempt_failed && !task.has_merged_attempt && (
              <XCircle 
                className="h-3 w-3 text-red-500" 
                aria-hidden="true"
                data-testid="x-circle-icon"
              />
            )}
            </div>
          </div>
        
        {/* Actions Menu - positioned absolutely to avoid nesting */}
        <div className="absolute top-0 right-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground rounded-md h-6 w-6 p-0 hover:bg-muted"
                aria-label="More options"
              >
                <MoreHorizontal className="h-3 w-3" aria-hidden="true" />
                <span className="sr-only">More options</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(task.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {task.description && (
          <div className="px-0">
            <p 
              id={`task-${task.id}-description`}
              className="text-xs text-muted-foreground break-words"
            >
              {task.description.length > 130
                ? `${task.description.substring(0, 130)}...`
                : task.description}
            </p>
          </div>
        )}
      </div>
    </KanbanCard>
  );
});
