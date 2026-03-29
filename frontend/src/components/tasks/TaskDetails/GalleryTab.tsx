import { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Image,
  Video,
  FileText,
  Trash2,
  Plus,
  Paperclip,
  Edit,
  Copy,
  Eye,
  EyeOff,
  Save,
  X,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import GalleryMarkdownRenderer from './GalleryMarkdownRenderer';
import { galleryApi, type TaskAttachment, type TaskComment } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import FileUploadCard, { type UploadingFile } from './FileUploadCard';

interface GalleryTabProps {
  taskId: string;
}

export default function GalleryTab({ taskId }: GalleryTabProps) {
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [, setIsUploading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [commentViewModes, setCommentViewModes] = useState<
    Record<string, 'preview' | 'raw'>
  >({});
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [newCommentMode, setNewCommentMode] = useState<'write' | 'preview'>(
    'write'
  );
  const [editingCommentMode, setEditingCommentMode] = useState<
    Record<string, 'write' | 'preview'>
  >({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt', '.md'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        ['.docx'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true,
    noClick: false,
    noDrag: false,
    onDrop: (acceptedFiles, rejectedFiles) => {
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        console.error('Rejected files:', rejectedFiles);
        rejectedFiles.forEach((rejected) => {
          console.error('Rejected file:', {
            name: rejected.file.name,
            type: rejected.file.type,
            size: rejected.file.size,
            errors: rejected.errors,
          });
        });
      }

      if (acceptedFiles.length > 0) {
        const fileList = new DataTransfer();
        acceptedFiles.forEach((file) => fileList.items.add(file));
        handleFileUpload(fileList.files);
      }
    },
  });

  useEffect(() => {
    fetchAttachments();
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const fetchAttachments = async () => {
    try {
      const data = await galleryApi.getAttachments(taskId);
      setAttachments(data);
    } catch (error) {
      console.error('Failed to fetch attachments:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const data = await galleryApi.getComments(taskId);
      setComments(data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true);

    // Create upload file entries
    const newFiles: UploadingFile[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'pending' as const,
    }));

    setUploadingFiles((prev) => [...prev, ...newFiles]);

    // Upload files with progress tracking
    for (const uploadFile of newFiles) {
      try {
        console.log('Uploading file:', {
          name: uploadFile.file.name,
          type: uploadFile.file.type,
          size: uploadFile.file.size,
        });

        // Update status to uploading
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: 'uploading' as const } : f
          )
        );

        // Simulate progress updates (in real implementation, use XMLHttpRequest or fetch with progress)
        const progressInterval = setInterval(() => {
          setUploadingFiles((prev) =>
            prev.map((f) => {
              if (f.id === uploadFile.id && f.status === 'uploading') {
                const newProgress = Math.min(f.progress + 10, 90);
                return { ...f, progress: newProgress };
              }
              return f;
            })
          );
        }, 200);

        await galleryApi.uploadAttachment(taskId, uploadFile.file);
        clearInterval(progressInterval);

        // Update status to success
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: 'success' as const, progress: 100 }
              : f
          )
        );

        await fetchAttachments();

        // Remove successful upload after a delay
        setTimeout(() => {
          setUploadingFiles((prev) =>
            prev.filter((f) => f.id !== uploadFile.id)
          );
        }, 2000);
      } catch (error) {
        console.error('Failed to upload file:', {
          fileName: uploadFile.file.name,
          fileType: uploadFile.file.type,
          fileSize: uploadFile.file.size,
          error: error,
        });

        // Determine error message based on error type
        let errorMessage = 'Upload failed';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }

        // Check for specific error patterns
        if (
          errorMessage.includes('413') ||
          errorMessage.includes('too large')
        ) {
          errorMessage = 'File size exceeds 50MB limit';
        } else if (
          errorMessage.includes('415') ||
          errorMessage.includes('unsupported')
        ) {
          errorMessage = 'File type not supported';
        } else if (
          errorMessage.includes('400') ||
          errorMessage.includes('bad request')
        ) {
          errorMessage = 'Invalid file or request';
        }

        // Update status to error
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? {
                  ...f,
                  status: 'error' as const,
                  error: errorMessage,
                }
              : f
          )
        );
      }
    }

    setIsUploading(false);
  };

  const removeUploadingFile = (id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const retryUpload = async (id: string) => {
    const fileToRetry = uploadingFiles.find((f) => f.id === id);
    if (!fileToRetry) return;

    // Reset the file status and re-upload
    setUploadingFiles((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, status: 'pending' as const, progress: 0, error: undefined }
          : f
      )
    );

    // Create a FileList-like object with single file
    const dt = new DataTransfer();
    dt.items.add(fileToRetry.file);
    await handleFileUpload(dt.files);
  };

  const deleteAttachment = async (attachmentId: string) => {
    try {
      await galleryApi.deleteAttachment(taskId, attachmentId);
      await fetchAttachments();
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    }
  };

  const insertAttachmentReference = (attachment: TaskAttachment) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const beforeCursor = newComment.substring(0, cursorPosition);
    const afterCursor = newComment.substring(cursorPosition);

    let insertText = '';
    if (attachment.file_type === 'image') {
      insertText = `![${attachment.original_name}](attachment:${attachment.id})`;
    } else {
      insertText = `[${attachment.original_name}](attachment:${attachment.id})`;
    }

    const newText = beforeCursor + insertText + afterCursor;
    setNewComment(newText);

    // Focus back to textarea and set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPosition = cursorPosition + insertText.length;
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const createComment = async () => {
    if (!newComment.trim()) return;

    try {
      await galleryApi.createComment(taskId, {
        task_id: taskId,
        author: 'user',
        content: newComment,
      });
      setNewComment('');
      setNewCommentMode('write'); // Reset to write mode after posting
      await fetchComments();
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  const startEditComment = (comment: TaskComment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  const saveEditComment = async (commentId: string) => {
    if (!editingContent.trim()) return;

    try {
      await galleryApi.updateComment(taskId, commentId, {
        content: editingContent,
      });
      setEditingCommentId(null);
      setEditingContent('');
      await fetchComments();
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const deleteComment = async (commentId: string) => {
    setIsDeleting(commentId);
    try {
      await galleryApi.deleteComment(taskId, commentId);
      await fetchComments();
    } catch (error) {
      console.error('Failed to delete comment:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const toggleCommentViewMode = (commentId: string) => {
    setCommentViewModes((prev) => ({
      ...prev,
      [commentId]: prev[commentId] === 'raw' ? 'preview' : 'raw',
    }));
  };

  const copyCommentRaw = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const getCommentViewMode = (commentId: string): 'preview' | 'raw' => {
    return commentViewModes[commentId] || 'preview';
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Prepare lightbox slides from image attachments
  const imageAttachments = attachments.filter(
    (attachment) => attachment.file_type === 'image'
  );
  const lightboxSlides = imageAttachments.map((attachment) => ({
    src: galleryApi.getAttachmentUrl(taskId, attachment.id),
    alt: attachment.original_name,
    title: attachment.original_name,
  }));

  const openLightbox = (attachmentId: string) => {
    const index = imageAttachments.findIndex(
      (attachment) => attachment.id === attachmentId
    );
    if (index !== -1) {
      setLightboxIndex(index);
      setLightboxOpen(true);
      // Reset zoom and pan when opening new image
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
    }
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          setLightboxOpen(false);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          setLightboxIndex(
            lightboxIndex > 0 ? lightboxIndex - 1 : lightboxSlides.length - 1
          );
          break;
        case 'ArrowRight':
          event.preventDefault();
          setLightboxIndex(
            lightboxIndex < lightboxSlides.length - 1 ? lightboxIndex + 1 : 0
          );
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, lightboxIndex, lightboxSlides.length]);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Media
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              {isDragActive
                ? 'Drop files here...'
                : 'Drag and drop files here, or click to select'}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports images, videos, documents (Max: 50MB each)
            </p>
          </div>

          {/* Upload Progress Cards */}
          {uploadingFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Uploading {uploadingFiles.length} file
                {uploadingFiles.length > 1 ? 's' : ''}
              </p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {uploadingFiles.map((file) => (
                  <FileUploadCard
                    key={file.id}
                    file={file}
                    onRemove={removeUploadingFile}
                    onRetry={retryUpload}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Gallery Section */}
      {attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Gallery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="relative group">
                  {attachment.file_type === 'image' ? (
                    <img
                      src={galleryApi.getAttachmentUrl(taskId, attachment.id)}
                      alt={attachment.original_name}
                      className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openLightbox(attachment.id)}
                    />
                  ) : attachment.file_type === 'video' ? (
                    <video
                      src={galleryApi.getAttachmentUrl(taskId, attachment.id)}
                      className="w-full h-32 object-cover rounded-lg border"
                      controls
                    />
                  ) : (
                    <div className="w-full h-32 flex items-center justify-center bg-muted rounded-lg border">
                      {getFileIcon(attachment.file_type)}
                      <span className="text-xs ml-2 truncate">
                        {attachment.original_name}
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none">
                    <div className="absolute inset-0 bg-black/50 rounded-lg" />
                    <div className="absolute top-2 right-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="pointer-events-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAttachment(attachment.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-1 text-xs text-muted-foreground truncate">
                    {attachment.original_name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.file_size)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle>Activity & Comments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* New Comment */}
          <div className="space-y-2">
            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b">
              <Button
                variant={newCommentMode === 'write' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setNewCommentMode('write')}
                className="h-8 px-3"
              >
                <Edit className="h-3 w-3 mr-1" />
                Write
              </Button>
              <Button
                variant={newCommentMode === 'preview' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setNewCommentMode('preview')}
                disabled={!newComment.trim()}
                className="h-8 px-3"
              >
                <Eye className="h-3 w-3 mr-1" />
                Preview
              </Button>
              {attachments.length > 0 && (
                <div className="ml-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 px-3">
                        <Paperclip className="h-4 w-4 mr-1" />
                        Attach
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      {attachments.map((attachment) => (
                        <DropdownMenuItem
                          key={attachment.id}
                          onClick={() => insertAttachmentReference(attachment)}
                          className="flex items-center gap-2"
                        >
                          {getFileIcon(attachment.file_type)}
                          <span className="truncate">
                            {attachment.original_name}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

            {/* Content Area */}
            {newCommentMode === 'write' ? (
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  placeholder="Add a comment or describe what you've attached... (Markdown supported)"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[100px] font-mono text-sm"
                />
              </div>
            ) : (
              <div className="min-h-[100px] p-3 border rounded-md bg-muted/30">
                {newComment.trim() ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <GalleryMarkdownRenderer
                      content={newComment}
                      taskId={taskId}
                      attachments={attachments}
                    />
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">
                    Nothing to preview
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="text-xs text-muted-foreground">
                Use <code>![alt](attachment:id)</code> for images or{' '}
                <code>[text](attachment:id)</code> for links
              </div>
              <Button
                onClick={createComment}
                disabled={!newComment.trim()}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Comment
              </Button>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => {
              const isEditing = editingCommentId === comment.id;
              const viewMode = getCommentViewMode(comment.id);
              const isDeleted = isDeleting === comment.id;

              return (
                <div
                  key={comment.id}
                  className={`border rounded-lg p-4 transition-opacity ${isDeleted ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {comment.author}
                      </span>
                      {isEditing && (
                        <Badge variant="secondary" className="text-xs">
                          Editing
                        </Badge>
                      )}
                      {comment.updated_at !== comment.created_at &&
                        !isEditing && (
                          <Badge variant="outline" className="text-xs">
                            Edited
                          </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>

                      {!isEditing && (
                        <div className="flex items-center gap-1">
                          {/* View Mode Toggle */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCommentViewMode(comment.id)}
                            className="h-6 w-6 p-0"
                            title={
                              viewMode === 'preview'
                                ? 'Show raw markdown'
                                : 'Show preview'
                            }
                          >
                            {viewMode === 'preview' ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>

                          {/* Copy Raw */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyCommentRaw(comment.content)}
                            className="h-6 w-6 p-0"
                            title="Copy raw markdown"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>

                          {/* Edit Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditComment(comment)}
                            className="h-6 w-6 p-0"
                            title="Edit comment"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>

                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (
                                window.confirm(
                                  'Are you sure you want to delete this comment? This action cannot be undone.'
                                )
                              ) {
                                deleteComment(comment.id);
                              }
                            }}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            title="Delete comment"
                            disabled={isDeleted}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comment Content */}
                  {isEditing ? (
                    <div className="space-y-3">
                      {/* Edit Mode Tabs */}
                      <div className="flex items-center gap-2 border-b">
                        <Button
                          variant={
                            editingCommentMode[comment.id] === 'write'
                              ? 'default'
                              : 'ghost'
                          }
                          size="sm"
                          onClick={() =>
                            setEditingCommentMode((prev) => ({
                              ...prev,
                              [comment.id]: 'write',
                            }))
                          }
                          className="h-8 px-3"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Write
                        </Button>
                        <Button
                          variant={
                            editingCommentMode[comment.id] === 'preview'
                              ? 'default'
                              : 'ghost'
                          }
                          size="sm"
                          onClick={() =>
                            setEditingCommentMode((prev) => ({
                              ...prev,
                              [comment.id]: 'preview',
                            }))
                          }
                          disabled={!editingContent.trim()}
                          className="h-8 px-3"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                      </div>

                      {/* Edit Content Area */}
                      {editingCommentMode[comment.id] === 'write' ? (
                        <Textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="min-h-[100px] font-mono text-sm"
                          placeholder="Edit your comment..."
                        />
                      ) : (
                        <div className="min-h-[100px] p-3 border rounded-md bg-muted/30">
                          {editingContent.trim() ? (
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              <GalleryMarkdownRenderer
                                content={editingContent}
                                taskId={taskId}
                                attachments={attachments}
                              />
                            </div>
                          ) : (
                            <p className="text-muted-foreground italic">
                              Nothing to preview
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          Use markdown for formatting
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={cancelEditComment}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => saveEditComment(comment.id)}
                            disabled={
                              !editingContent.trim() ||
                              editingContent === comment.content
                            }
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {viewMode === 'preview' ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <GalleryMarkdownRenderer
                            content={comment.content}
                            taskId={taskId}
                            attachments={attachments}
                          />
                        </div>
                      ) : (
                        <div className="bg-muted/50 border rounded-md p-3">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="text-xs">
                              Raw Markdown
                            </Badge>
                          </div>
                          <pre className="text-sm whitespace-pre-wrap font-mono overflow-x-auto">
                            {comment.content}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Comment Attachments */}
                  {comment.attachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {comment.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded"
                        >
                          {getFileIcon(attachment.file_type)}
                          <span>{attachment.original_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {comments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No comments yet. Add the first one above!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card Modal Gallery */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setLightboxOpen(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setLightboxOpen(false);
            }
          }}
          tabIndex={-1}
        >
          <div className="bg-background border rounded-lg shadow-2xl w-full max-w-4xl h-[600px] flex flex-col">
            {/* Header Controls */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Image className="h-5 w-5" />
                  <h3 className="font-semibold">
                    {lightboxSlides[lightboxIndex]?.title || 'Image Viewer'}
                  </h3>
                </div>
                <div className="text-sm text-muted-foreground">
                  {lightboxIndex + 1} of {lightboxSlides.length}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Zoom Out */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newZoom = Math.max(0.5, zoomLevel - 0.25);
                    setZoomLevel(newZoom);
                    if (newZoom === 1) {
                      setPanPosition({ x: 0, y: 0 });
                    }
                  }}
                  disabled={zoomLevel <= 0.5}
                  className="h-8 w-8 p-0"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
                    />
                  </svg>
                </Button>

                {/* Zoom Level Indicator */}
                <div className="px-2 py-1 text-xs bg-muted rounded text-muted-foreground">
                  {Math.round(zoomLevel * 100)}%
                </div>

                {/* Zoom In */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setZoomLevel(Math.min(5, zoomLevel + 0.25));
                  }}
                  disabled={zoomLevel >= 5}
                  className="h-8 w-8 p-0"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                    />
                  </svg>
                </Button>

                {/* Reset Zoom */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setZoomLevel(1);
                    setPanPosition({ x: 0, y: 0 });
                  }}
                  disabled={
                    zoomLevel === 1 &&
                    panPosition.x === 0 &&
                    panPosition.y === 0
                  }
                  className="h-8 w-8 p-0"
                  title="Reset zoom and position"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </Button>

                {/* Download Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = lightboxSlides[lightboxIndex]?.src || '';
                    link.download =
                      lightboxSlides[lightboxIndex]?.title || 'image';
                    link.click();
                  }}
                  className="h-8 w-8 p-0"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </Button>

                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLightboxOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </Button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
              {/* Central Image Container */}
              <div className="flex-1 relative overflow-hidden">
                <div
                  className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
                  onMouseDown={(e) => {
                    if (zoomLevel > 1) {
                      setIsDragging(true);
                      setDragStart({
                        x: e.clientX - panPosition.x,
                        y: e.clientY - panPosition.y,
                      });
                    }
                  }}
                  onMouseMove={(e) => {
                    if (isDragging && zoomLevel > 1) {
                      setPanPosition({
                        x: e.clientX - dragStart.x,
                        y: e.clientY - dragStart.y,
                      });
                    }
                  }}
                  onMouseUp={() => setIsDragging(false)}
                  onMouseLeave={() => setIsDragging(false)}
                >
                  <img
                    ref={imageRef}
                    src={lightboxSlides[lightboxIndex]?.src}
                    alt={lightboxSlides[lightboxIndex]?.alt}
                    className="w-full h-full object-contain transition-transform duration-200 ease-out select-none"
                    style={{
                      transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                      cursor:
                        zoomLevel > 1
                          ? isDragging
                            ? 'grabbing'
                            : 'grab'
                          : 'zoom-in',
                    }}
                    onClick={(e) => {
                      if (zoomLevel === 1) {
                        // Click to zoom in
                        setZoomLevel(2);
                        // Calculate zoom position based on click position
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left - rect.width / 2;
                        const clickY = e.clientY - rect.top - rect.height / 2;
                        setPanPosition({ x: -clickX, y: -clickY });
                      }
                    }}
                    onDoubleClick={() => {
                      // Double-click to reset zoom
                      setZoomLevel(1);
                      setPanPosition({ x: 0, y: 0 });
                    }}
                    draggable={false}
                  />
                </div>

                {/* Navigation Arrows */}
                {lightboxSlides.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 h-12 w-12 p-0 bg-background/80 hover:bg-background/90 border shadow-lg"
                      onClick={() => {
                        setLightboxIndex(
                          lightboxIndex > 0
                            ? lightboxIndex - 1
                            : lightboxSlides.length - 1
                        );
                        setZoomLevel(1);
                        setPanPosition({ x: 0, y: 0 });
                      }}
                    >
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 h-12 w-12 p-0 bg-background/80 hover:bg-background/90 border shadow-lg"
                      onClick={() => {
                        setLightboxIndex(
                          lightboxIndex < lightboxSlides.length - 1
                            ? lightboxIndex + 1
                            : 0
                        );
                        setZoomLevel(1);
                        setPanPosition({ x: 0, y: 0 });
                      }}
                    >
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Button>
                  </>
                )}

                {/* Help Text */}
                {zoomLevel === 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-muted-foreground text-sm bg-background/80 px-3 py-1 rounded-full border">
                    Click to zoom • Drag to pan when zoomed
                  </div>
                )}
              </div>

              {/* Side Carousel */}
              {lightboxSlides.length > 1 && (
                <div className="w-64 border-l bg-muted/30 flex flex-col">
                  <div className="p-4 border-b">
                    <h4 className="text-sm font-medium">Gallery</h4>
                    <div className="text-xs text-muted-foreground mt-1">
                      {lightboxSlides.length} images
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {lightboxSlides.map((slide, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setLightboxIndex(index);
                          setZoomLevel(1);
                          setPanPosition({ x: 0, y: 0 });
                        }}
                        className={`w-full group relative rounded-lg overflow-hidden border-2 transition-all ${
                          index === lightboxIndex
                            ? 'border-primary ring-2 ring-primary/50'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="aspect-video">
                          <img
                            src={slide.src}
                            alt={slide.alt}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {index === lightboxIndex && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-primary-foreground"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <div className="text-xs text-white truncate">
                            {slide.title}
                          </div>
                          <div className="text-xs text-white/70">
                            {index + 1} of {lightboxSlides.length}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Status Bar */}
            <div className="border-t px-4 py-3 bg-muted/30">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <span className="font-medium">
                    {lightboxSlides[lightboxIndex]?.title}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    {formatFileSize(
                      attachments.find((a) => a.file_type === 'image')
                        ?.file_size || 0
                    )}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-muted-foreground">
                  <span>← → keys to navigate</span>
                  <span>•</span>
                  <span>ESC to close</span>
                  <span>•</span>
                  <span>Click to zoom</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
