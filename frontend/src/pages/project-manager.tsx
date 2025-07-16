import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen, MessageSquare, Plus, Settings, ArrowLeft } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { projectsApi, projectManagerApi } from '@/lib/api';
import { useKeyboardShortcuts } from '@/lib/keyboard-shortcuts';
import { FileSearchTextarea } from '@/components/ui/file-search-textarea';
import { Send } from 'lucide-react';
import MarkdownRenderer from '@/components/ui/markdown-renderer';
import type { ProjectWithBranch } from 'shared/types';

export function ProjectManager() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectWithBranch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    navigate,
    currentPath: `/projects/${projectId}/manager`,
    hasOpenDialog: false,
    closeDialog: () => {},
    openCreateTask: () => {},
  });

  useEffect(() => {
    if (projectId) {
      fetchProject();
      initializeSession();
    }
  }, [projectId]);

  const fetchProject = useCallback(async () => {
    try {
      const result = await projectsApi.getWithBranch(projectId!);
      setProject(result);
    } catch (err) {
      setError('Failed to load project');
    }
  }, [projectId]);

  const initializeSession = useCallback(async () => {
    try {
      setLoading(true);
      // Try to get existing sessions
      const sessions = await projectManagerApi.getSessions(projectId!);
      
      let session;
      if (sessions.length > 0) {
        // Use the most recent session
        session = sessions[0];
      } else {
        // Create a new session
        session = await projectManagerApi.createSession(
          projectId!,
          'Project Manager Chat'
        );
      }

      setCurrentSession(session);

      // Load the session with messages
      const sessionData = await projectManagerApi.getSession(projectId!, session.id);
      setMessages(sessionData.messages || []);
    } catch (err) {
      console.error('Failed to initialize session:', err);
      setError('Failed to initialize chat session');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const handleOpenInIDE = useCallback(async () => {
    if (!projectId) return;

    try {
      await projectsApi.openEditor(projectId);
    } catch (error) {
      console.error('Failed to open project in IDE:', error);
      setError('Failed to open project in IDE');
    }
  }, [projectId]);

  const handleBackToTasks = useCallback(() => {
    navigate(`/projects/${projectId}/tasks`);
  }, [projectId, navigate]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isTyping || !currentSession) return;

    const messageContent = inputMessage.trim();
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await projectManagerApi.sendMessage(
        projectId!,
        currentSession.id,
        messageContent
      );

      // Add both user and assistant messages to the UI
      setMessages(prev => [...prev, response.user_message, response.assistant_message]);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
      // Restore the input message
      setInputMessage(messageContent);
    } finally {
      setIsTyping(false);
    }
  }, [inputMessage, isTyping, currentSession, projectId]);

  if (loading) {
    return <Loader message="Loading project manager..." size={32} className="py-8" />;
  }

  if (error) {
    return <div className="text-center py-8 text-destructive">{error}</div>;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToTasks}
              className="h-8 px-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tasks
            </Button>
            <div className="flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Project Manager</h1>
              <span className="text-sm text-muted-foreground">
                {project?.name || 'Project'}
              </span>
              {project?.current_branch && (
                <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md">
                  {project.current_branch}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenInIDE}
              className="h-8 w-8 p-0"
              title="Open in IDE"
            >
              <FolderOpen className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/projects/${projectId}/tasks`)}
              className="h-8 w-8 p-0"
              title="View Tasks"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${
                  message.role === 'user' ? 'bg-blue-500' : 'bg-green-500'
                }`} />
                <span className="font-medium">
                  {message.role === 'user' ? 'You' : 'Project Manager'}
                </span>
                <span>{new Date(message.created_at).toLocaleTimeString()}</span>
              </div>
              <Card className={message.role === 'user' ? 'ml-8' : 'mr-8'}>
                <CardContent className="p-4">
                  {message.role === 'assistant' ? (
                    <MarkdownRenderer content={message.content} />
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
          
          {isTyping && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="font-medium">Project Manager</span>
                <span>typing...</span>
              </div>
              <Card className="mr-8">
                <CardContent className="p-4">
                  <Loader size={16} message="Thinking..." />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Input Section */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-end">
              <FileSearchTextarea
                placeholder="Describe what you'd like to accomplish with this project... Type @ to search files."
                value={inputMessage}
                onChange={(value) => setInputMessage(value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1 min-h-[60px] resize-none"
                disabled={isTyping}
                projectId={projectId}
                rows={2}
                maxRows={8}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                size="sm"
                className="px-4 py-3"
              >
                {isTyping ? (
                  <Loader size={16} className="mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Cmd/Ctrl + Enter to send. Use @ to reference files in your project.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}