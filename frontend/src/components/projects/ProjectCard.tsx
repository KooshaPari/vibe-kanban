import {
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Edit,
  ExternalLink,
  FolderOpen,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '@/lib/api.ts';
import { Project } from 'shared/types.ts';
import { useEffect, useRef } from 'react';

type Props = {
  project: Project;
  isFocused: boolean;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
  fetchProjects?: () => void;
  setError?: (error: string) => void;
  setEditingProject?: (project: Project) => void;
  setShowForm?: (show: boolean) => void;
};

function ProjectCard({
  project,
  isFocused,
  fetchProjects,
  setError,
  setEditingProject,
  setShowForm,
}: Props) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFocused && ref.current) {
      ref.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      ref.current.focus();
    }
  }, [isFocused]);

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${name}"? This action cannot be undone.`
      )
    )
      return;

    try {
      await projectsApi.delete(id);
      fetchProjects?.();
    } catch (error) {
      console.error('Failed to delete project:', error);
      setError?.('Failed to delete project');
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject?.(project);
    setShowForm?.(true);
  };

  const handleOpenInIDE = async (projectId: string) => {
    try {
      await projectsApi.openEditor(projectId);
    } catch (error) {
      console.error('Failed to open project in IDE:', error);
      setError?.('Failed to open project in IDE');
    }
  };

  return (
    <article className="relative">
      <div
        role="button"
        tabIndex={0}
        ref={ref}
        className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary hover:bg-muted/50 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow pr-16"
        onClick={() => navigate(`/projects/${project.id}/tasks`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate(`/projects/${project.id}/tasks`);
          }
        }}
        aria-label={`Open ${project.name} project`}
        aria-describedby={`project-${project.id}-description`}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg break-words" role="heading" aria-level={3}>
              {project.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Active</Badge>
            </div>
          </div>
          <CardDescription 
            className="flex items-center" 
            id={`project-${project.id}-description`}
          >
            <Calendar className="mr-1 h-3 w-3" aria-hidden="true" />
            <time dateTime={new Date(project.created_at).toISOString()}>
              Created {new Date(project.created_at).toLocaleDateString()}
            </time>
          </CardDescription>
        </CardHeader>
      </div>
      
      {/* Actions Menu - positioned separately to avoid nesting */}
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              aria-label="More options"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/projects/${project.id}`);
              }}
            >
              <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
              View Project
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleOpenInIDE(project.id);
              }}
            >
              <FolderOpen className="mr-2 h-4 w-4" aria-hidden="true" />
              Open in IDE
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(project);
              }}
            >
              <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(project.id, project.name);
              }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  );
}

export default ProjectCard;
