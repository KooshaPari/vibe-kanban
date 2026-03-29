import ReactMarkdown, { Components } from 'react-markdown';
import { memo, useMemo } from 'react';
import { TaskAttachment, galleryApi } from '@/lib/api';
import { Image, Video, FileText } from 'lucide-react';

interface GalleryMarkdownRendererProps {
  content: string;
  className?: string;
  taskId: string;
  attachments?: TaskAttachment[];
}

function GalleryMarkdownRenderer({
  content,
  className = '',
  taskId,
  attachments = [],
}: GalleryMarkdownRendererProps) {
  const components: Components = useMemo(
    () => ({
      code: ({ children, ...props }) => (
        <code
          {...props}
          className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono"
        >
          {children}
        </code>
      ),
      strong: ({ children, ...props }) => (
        <strong {...props} className="font-bold">
          {children}
        </strong>
      ),
      em: ({ children, ...props }) => (
        <em {...props} className="italic">
          {children}
        </em>
      ),
      p: ({ children, ...props }) => (
        <p {...props} className="mb-4 last:mb-0 leading-loose">
          {children}
        </p>
      ),
      h1: ({ children, ...props }) => (
        <h1
          {...props}
          className="text-lg font-bold mb-4 mt-6 first:mt-0 leading-relaxed"
        >
          {children}
        </h1>
      ),
      h2: ({ children, ...props }) => (
        <h2
          {...props}
          className="text-base font-bold mb-3 mt-5 first:mt-0 leading-relaxed"
        >
          {children}
        </h2>
      ),
      h3: ({ children, ...props }) => (
        <h3
          {...props}
          className="text-sm font-bold mb-3 mt-4 first:mt-0 leading-relaxed"
        >
          {children}
        </h3>
      ),
      ul: ({ children, ...props }) => (
        <ul {...props} className="list-disc ml-4 mb-2 space-y-1">
          {children}
        </ul>
      ),
      ol: ({ children, ...props }) => (
        <ol {...props} className="list-decimal ml-4 mb-2 space-y-1">
          {children}
        </ol>
      ),
      li: ({ children, ...props }) => (
        <li {...props} className="mb-1 leading-relaxed">
          {children}
        </li>
      ),
      img: ({ src, alt, ...props }) => {
        // Check if this is an attachment reference
        const attachmentMatch = src?.match(/^attachment:(.+)$/);
        if (attachmentMatch) {
          const attachmentId = attachmentMatch[1];
          const attachment = attachments.find((a) => a.id === attachmentId);

          if (attachment) {
            const url = galleryApi.getAttachmentUrl(taskId, attachmentId);

            if (attachment.file_type === 'image') {
              return (
                <img
                  {...props}
                  src={url}
                  alt={alt || attachment.original_name}
                  className="max-w-full h-auto rounded-lg border my-2"
                />
              );
            } else if (attachment.file_type === 'video') {
              return (
                <video
                  src={url}
                  controls
                  className="max-w-full h-auto rounded-lg border my-2"
                >
                  {alt || attachment.original_name}
                </video>
              );
            } else {
              return (
                <div className="flex items-center gap-2 p-2 border rounded-lg my-2 bg-muted/30">
                  <FileText className="h-4 w-4" />
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:underline"
                  >
                    {alt || attachment.original_name}
                  </a>
                </div>
              );
            }
          }

          return (
            <div className="text-sm text-muted-foreground p-2 border rounded-lg my-2 bg-muted/30">
              Attachment not found: {attachmentId}
            </div>
          );
        }

        // Regular image
        return (
          <img
            {...props}
            src={src}
            alt={alt}
            className="max-w-full h-auto rounded-lg border my-2"
          />
        );
      },
      a: ({ href, children, ...props }) => {
        // Check if this is an attachment link
        const attachmentMatch = href?.match(/^attachment:(.+)$/);
        if (attachmentMatch) {
          const attachmentId = attachmentMatch[1];
          const attachment = attachments.find((a) => a.id === attachmentId);

          if (attachment) {
            const url = galleryApi.getAttachmentUrl(taskId, attachmentId);
            const IconComponent =
              attachment.file_type === 'image'
                ? Image
                : attachment.file_type === 'video'
                  ? Video
                  : FileText;

            return (
              <a
                {...props}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <IconComponent className="h-3 w-3" />
                {children || attachment.original_name}
              </a>
            );
          }

          return (
            <span className="text-muted-foreground">
              [Attachment not found: {attachmentId}]
            </span>
          );
        }

        // Regular link
        return (
          <a
            {...props}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {children}
          </a>
        );
      },
    }),
    [taskId, attachments]
  );

  return (
    <div className={className}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}

export default memo(GalleryMarkdownRenderer);

// Export the original renderer for re-export
export { default as MarkdownRenderer } from '@/components/ui/markdown-renderer';
