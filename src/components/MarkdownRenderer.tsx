import { memo, useMemo, useState, createContext, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { marked } from 'marked';
import type { ComponentProps } from 'react';
import type { ExtraProps } from 'react-markdown';
import { Check, Copy, Minimize2, Maximize2, Maximize, X } from 'lucide-react';
import ShikiHighlighter from 'react-shiki';

type CodeComponentProps = ComponentProps<'code'> & ExtraProps;
type MarkdownSize = 'default' | 'small';

// Context to pass size down to components
const MarkdownSizeContext = createContext<MarkdownSize>('default');

const components: Components = {
  code: CodeBlock as Components['code'],
  pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  blockquote: ({ children, ...props }: any) => (
    <blockquote {...props} className="relative border-l-4 rounded-r-lg py-4 px-6 my-6 shadow-sm" style={{
      borderLeftColor: 'rgb(var(--primary))',
      background: 'linear-gradient(to right, rgb(var(--chat-code-block-bg)) 0%, transparent 100%)'
    }}>
      <div className="absolute top-2 left-2 text-4xl leading-none font-serif opacity-30" style={{
        color: 'rgb(var(--primary))'
      }}>"</div>
      <div className="relative z-10" style={{
        color: 'rgb(var(--chat-code-block-text))'
      }}>{children}</div>
    </blockquote>
  ),
  table: ({ children, ...props }: any) => (
    <div className="my-6 overflow-hidden rounded-lg shadow-sm border" style={{
      borderColor: 'rgb(var(--chat-code-block-border))'
    }}>
      <table {...props} className="w-full border-collapse" style={{
        backgroundColor: 'rgb(var(--chat-code-block-bg))'
      }}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: any) => (
    <thead {...props} className="border-b" style={{
      background: 'linear-gradient(to right, rgb(var(--chat-code-block-bg)) 0%, rgb(var(--chat-code-inline-bg)) 100%)',
      borderBottomColor: 'rgb(var(--chat-code-block-border))'
    }}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }: any) => (
    <th {...props} className="text-left py-3 px-4 font-semibold text-sm" style={{
      color: 'rgb(var(--chat-code-block-text))'
    }}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td {...props} className="py-3 px-4 text-sm border-t" style={{
      color: 'rgb(var(--chat-code-block-text))',
      borderTopColor: 'rgb(var(--chat-code-block-border))',
      opacity: '0.9'
    }}>
      {children}
    </td>
  ),
  hr: ({ ...props }: any) => (
    <hr {...props} className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-[rgb(var(--border))]/40 to-transparent" />
  ),
  ul: ({ children, ...props }: any) => (
    <ul {...props} className="list-disc list-inside space-y-1 my-4 pl-4" style={{
      color: 'rgb(var(--foreground))'
    }}>{children}</ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol {...props} className="list-decimal list-inside space-y-1 my-4 pl-4" style={{
      color: 'rgb(var(--foreground))'
    }}>{children}</ol>
  ),
  li: ({ children, ...props }: any) => (
    <li {...props} className="text-[rgb(var(--foreground))] leading-relaxed" style={{
      color: 'rgb(var(--foreground))'
    }}>
      {children}
    </li>
  ),
};

function CodeBlock({ children, className, ...props }: CodeComponentProps) {
  const size = useContext(MarkdownSizeContext);
  const match = /language-(\w+)/.exec(className || '');
  const [isMinimized, setIsMinimized] = useState(false);

  if (match) {
    const lang = match[1];
    return (
      <div
        className={`rounded-lg overflow-hidden shadow-sm backdrop-blur-sm border ${isMinimized ? '!my-0 !mt-0 !mb-0' : 'my-0.5'}`}
        style={{
          backgroundColor: 'rgb(var(--chat-code-block-bg))',
          borderColor: 'rgb(var(--chat-code-block-border))',
          ...(isMinimized && { margin: '0 !important', marginTop: '0 !important', marginBottom: '0 !important' })
        }}
      >
        <CodebarWithMinimize
          lang={lang}
          codeString={String(children)}
          isMinimized={isMinimized}
          setIsMinimized={setIsMinimized}
        />
        {!isMinimized && (
          <div className="scrollbar-thin scrollbar-track-transparent" style={{
            backgroundColor: 'rgb(var(--chat-code-block-content-bg))'
          }}>
            <ShikiHighlighter
              language={lang}
              theme="material-theme-darker"
              className="text-sm font-mono p-0.5 leading-relaxed block"
              showLanguage={false}
            >
              {String(children)}
            </ShikiHighlighter>
          </div>
        )}
      </div>
    );
  }

  const baseClasses = 'mx-1 font-mono shadow-sm backdrop-blur-sm border';
  const sizeClasses = size === 'small' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm';

  return (
    <code
      className={`${baseClasses} ${sizeClasses}`}
      style={{
        backgroundColor: 'rgb(var(--chat-code-inline-bg))',
        color: 'rgb(var(--chat-code-block-text))',
        borderColor: 'rgb(var(--chat-code-block-border))'
      }}
      {...props}
    >
      {children}
    </code>
  );
}

// Fullscreen code modal component using React Portal
function FullscreenCodeModal({
  isOpen,
  onClose,
  lang,
  codeString
}: {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  codeString: string;
}) {
  const [copied, setCopied] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy code to clipboard:', error);
    }
  };

  // Handle animation states and escape key
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to ensure DOM is ready before starting animation
      setTimeout(() => setIsAnimating(true), 10);
      document.body.style.overflow = 'hidden';
    } else if (shouldRender) {
      setIsAnimating(false);
      // Wait for animation to complete before unmounting
      setTimeout(() => setShouldRender(false), 300);
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, shouldRender]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (shouldRender) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [shouldRender, onClose]);

  if (!shouldRender) return null;

  // Render modal using React Portal to escape parent container constraints
  return createPortal(
    <div
      className={`fixed inset-0 flex items-center justify-center transition-all duration-300 ease-out ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        zIndex: 9999,
        backgroundColor: isAnimating ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0)',
        backdropFilter: isAnimating ? 'blur(8px)' : 'blur(0px)',
        transition: 'all 300ms ease-out'
      }}
      onClick={(e) => {
        // Close modal when clicking backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="fullscreen-modal-title"
      aria-describedby="fullscreen-modal-description"
    >
      <div
        className={`w-[85vw] h-[85vh] rounded-lg shadow-2xl overflow-hidden border transition-all duration-300 ease-out ${
          isAnimating
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-4'
        }`}
        style={{
          backgroundColor: 'rgb(var(--chat-code-block-bg))',
          borderColor: 'rgb(var(--chat-code-block-border))'
        }}
        onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b" style={{
          backgroundColor: 'rgb(var(--chat-code-block-bg))',
          borderBottomColor: 'rgb(var(--chat-code-block-border))'
        }}>
          <div className="flex items-center gap-3">
            <span
              id="fullscreen-modal-title"
              className="text-lg font-mono font-medium"
              style={{
                color: 'rgb(var(--chat-code-block-text))'
              }}
            >
              {lang}
            </span>
            <span
              id="fullscreen-modal-description"
              className="text-sm opacity-70"
              style={{
                color: 'rgb(var(--chat-code-block-text))'
              }}
            >
              Fullscreen View
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                copyToClipboard();
                e.currentTarget.blur(); // Remove focus after click
              }}
              className="group relative flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border transition-all duration-200 hover:shadow-sm focus:outline-none"
              style={{
                color: 'rgb(var(--chat-code-block-text))',
                backgroundColor: 'rgb(var(--chat-code-inline-bg))',
                borderColor: 'rgb(var(--chat-code-block-border))'
              }}
            >
              <span className="text-xs">{copied ? 'Copied!' : 'Copy'}</span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
              )}
            </button>
            <button
              onClick={(e) => {
                onClose();
                e.currentTarget.blur(); // Remove focus after click
              }}
              className="flex items-center justify-center w-8 h-8 rounded-md border transition-all duration-200 hover:shadow-sm focus:outline-none"
              style={{
                color: 'rgb(var(--chat-code-block-text))',
                backgroundColor: 'rgb(var(--chat-code-inline-bg))',
                borderColor: 'rgb(var(--chat-code-block-border))'
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Code content */}
        <div className="overflow-auto scrollbar-thin scrollbar-track-transparent" style={{
          backgroundColor: 'rgb(var(--chat-code-block-content-bg))',
          height: 'calc(85vh - 80px)'
        }}>
          <ShikiHighlighter
            language={lang}
            theme="material-theme-darker"
            className="text-sm font-mono p-1 leading-relaxed block"
            showLanguage={false}
          >
            {codeString}
          </ShikiHighlighter>
        </div>
      </div>
    </div>,
    document.body
  );
}

function CodebarWithMinimize({
  lang,
  codeString,
  isMinimized,
  setIsMinimized
}: {
  lang: string;
  codeString: string;
  isMinimized: boolean;
  setIsMinimized: (value: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy code to clipboard:', error);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center px-6 py-3 border-b backdrop-blur-sm" style={{
        backgroundColor: 'rgb(var(--chat-code-block-bg))',
        borderBottomColor: 'rgb(var(--chat-code-block-border))'
      }}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-medium" style={{
            color: 'rgb(var(--chat-code-block-text))'
          }}>{lang}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Minimize/Expand button with dynamic icon */}
          <button
            onClick={(e) => {
              setIsMinimized(!isMinimized);
              e.currentTarget.blur(); // Remove focus after click
            }}
            className="flex items-center justify-center w-7 h-7 rounded-md transition-all duration-200 hover:shadow-sm hover:bg-[rgb(var(--chat-code-inline-bg))] focus:outline-none"
            style={{
              color: 'rgb(var(--chat-code-block-text))'
            }}
            title={isMinimized ? "Expand" : "Minimize"}
          >
            <div className="relative w-3.5 h-3.5">
              <Minimize2
                className={`absolute inset-0 w-3.5 h-3.5 transition-all duration-300 ${
                  isMinimized
                    ? 'opacity-0 scale-75 rotate-180'
                    : 'opacity-100 scale-100 rotate-0'
                }`}
              />
              <Maximize2
                className={`absolute inset-0 w-3.5 h-3.5 transition-all duration-300 ${
                  isMinimized
                    ? 'opacity-100 scale-100 rotate-0'
                    : 'opacity-0 scale-75 rotate-180'
                }`}
              />
            </div>
          </button>

          {/* Fullscreen button */}
          <button
            onClick={(e) => {
              setIsFullscreen(true);
              e.currentTarget.blur(); // Remove focus after click
            }}
            className="flex items-center justify-center w-7 h-7 rounded-md transition-all duration-200 hover:shadow-sm hover:bg-[rgb(var(--chat-code-inline-bg))] focus:outline-none"
            style={{
              color: 'rgb(var(--chat-code-block-text))'
            }}
            title="Fullscreen"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>

          {/* Copy button */}
          <button
            onClick={(e) => {
              copyToClipboard();
              e.currentTarget.blur(); // Remove focus after click
            }}
            className="group relative flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border transition-all duration-200 hover:shadow-sm focus:outline-none"
            style={{
              color: 'rgb(var(--chat-code-block-text))',
              backgroundColor: 'rgb(var(--chat-code-inline-bg))',
              borderColor: 'rgb(var(--chat-code-block-border))'
            }}
          >
            <span className="text-xs">{copied ? 'Copied!' : 'Copy'}</span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
            )}
          </button>
        </div>
      </div>

      <FullscreenCodeModal
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        lang={lang}
        codeString={codeString}
      />
    </>
  );
}

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}
function PureMarkdownRendererBlock({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, [remarkMath]]}
      rehypePlugins={[rehypeKatex]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}

const MarkdownRendererBlock = memo(
  PureMarkdownRendererBlock,
  (prevProps, nextProps) => {
    if (prevProps.content !== nextProps.content) return false;
    return true;
  }
);

MarkdownRendererBlock.displayName = 'MarkdownRendererBlock';

const MemoizedMarkdown = memo(
  ({
    content,
    id,
    size = 'default',
  }: {
    content: string;
    id: string;
    size?: MarkdownSize;
  }) => {
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

    const proseClasses =
      size === 'small'
        ? `prose prose-sm dark:prose-invert break-words max-w-none w-full
           prose-code:before:content-none prose-code:after:content-none
           prose-pre:!my-0 prose-pre:!mt-0 prose-pre:!mb-0
           prose-headings:text-[rgb(var(--foreground))] prose-headings:font-semibold
           prose-h1:text-xl prose-h1:mb-4 prose-h1:mt-6 prose-h1:leading-tight
           prose-h2:text-lg prose-h2:mb-3 prose-h2:mt-5 prose-h2:leading-tight
           prose-h3:text-base prose-h3:mb-2 prose-h3:mt-4 prose-h3:leading-tight
           prose-p:text-[rgb(var(--foreground))] prose-p:leading-relaxed prose-p:mb-3
           prose-strong:text-[rgb(var(--foreground))] prose-strong:font-semibold
           prose-em:text-[rgb(var(--muted-foreground))] prose-em:italic
           prose-a:text-[rgb(var(--primary))] prose-a:no-underline hover:prose-a:underline prose-a:transition-all
           prose-blockquote:border-l-[rgb(var(--primary))] prose-blockquote:bg-[rgb(var(--secondary))]/30 prose-blockquote:rounded-r-md prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:my-4
           prose-ul:text-[rgb(var(--foreground))] prose-ol:text-[rgb(var(--foreground))] prose-ul:list-disc prose-ol:list-decimal
           prose-li:text-[rgb(var(--foreground))] prose-li:leading-relaxed prose-li:mb-1
           prose-li:marker:text-[rgb(var(--primary))]
           prose-table:text-[rgb(var(--foreground))] prose-thead:border-b-[rgb(var(--border))]
           prose-th:text-[rgb(var(--foreground))] prose-th:font-semibold prose-th:py-2 prose-th:px-3
           prose-td:py-2 prose-td:px-3 prose-td:border-t-[rgb(var(--border))]/20`
        : `prose prose-base dark:prose-invert break-words max-w-none w-full
           prose-code:before:content-none prose-code:after:content-none
           prose-pre:!my-0 prose-pre:!mt-0 prose-pre:!mb-0
           prose-headings:text-[rgb(var(--foreground))] prose-headings:font-semibold prose-headings:tracking-tight
           prose-h1:text-2xl prose-h1:mb-6 prose-h1:mt-8 prose-h1:leading-tight prose-h1:border-b prose-h1:border-[rgb(var(--border))]/30 prose-h1:pb-3
           prose-h2:text-xl prose-h2:mb-4 prose-h2:mt-7 prose-h2:leading-tight
           prose-h3:text-lg prose-h3:mb-3 prose-h3:mt-6 prose-h3:leading-tight
           prose-h4:text-base prose-h4:mb-2 prose-h4:mt-5 prose-h4:leading-tight prose-h4:font-medium
           prose-p:text-[rgb(var(--foreground))] prose-p:leading-relaxed prose-p:mb-4 prose-p:text-base
           prose-strong:text-[rgb(var(--foreground))] prose-strong:font-semibold
           prose-em:text-[rgb(var(--muted-foreground))] prose-em:italic
           prose-a:text-[rgb(var(--primary))] prose-a:no-underline hover:prose-a:underline prose-a:transition-all prose-a:duration-200 hover:prose-a:text-[rgb(var(--primary))]/80
           prose-blockquote:border-l-4 prose-blockquote:border-l-[rgb(var(--primary))] prose-blockquote:bg-gradient-to-r prose-blockquote:from-[rgb(var(--secondary))]/40 prose-blockquote:to-transparent prose-blockquote:rounded-r-lg prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:my-6 prose-blockquote:shadow-sm
           prose-blockquote:text-[rgb(var(--muted-foreground))] prose-blockquote:italic prose-blockquote:font-medium
           prose-ul:text-[rgb(var(--foreground))] prose-ol:text-[rgb(var(--foreground))] prose-ul:space-y-1 prose-ol:space-y-1
           prose-li:text-[rgb(var(--foreground))] prose-li:leading-relaxed prose-li:mb-1
           prose-li:marker:text-[rgb(var(--primary))]
           prose-table:text-[rgb(var(--foreground))] prose-table:border prose-table:border-[rgb(var(--border))]/30 prose-table:rounded-lg prose-table:overflow-hidden prose-table:shadow-sm
           prose-thead:bg-[rgb(var(--secondary))]/50 prose-thead:border-b prose-thead:border-b-[rgb(var(--border))]/30
           prose-th:text-[rgb(var(--foreground))] prose-th:font-semibold prose-th:py-3 prose-th:px-4 prose-th:text-left
           prose-td:py-3 prose-td:px-4 prose-td:border-t prose-td:border-t-[rgb(var(--border))]/20
           prose-hr:border-[rgb(var(--border))]/40 prose-hr:my-8`;

    return (
      <MarkdownSizeContext.Provider value={size}>
        <div className={`${proseClasses} markdown-content`}>
          {blocks.map((block, index) => (
            <MarkdownRendererBlock
              content={block}
              key={`${id}-block-${index}`}
            />
          ))}
        </div>
      </MarkdownSizeContext.Provider>
    );
  }
);

MemoizedMarkdown.displayName = 'MemoizedMarkdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isStreaming?: boolean;
}

/**
 * High-performance MarkdownRenderer with comprehensive markdown support and optimized streaming
 * - Block-based memoization for better performance
 * - React-markdown with proper syntax highlighting
 * - Smart copy functionality with visual feedback
 * - Comprehensive markdown features with theme integration
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
  isStreaming = false
}) => {
  // Generate a unique ID for this renderer instance
  const id = useMemo(() => `markdown-${Math.random().toString(36).substring(2, 11)}`, []);

  // Enhanced container styling for better responsive design and visual hierarchy
  const containerClasses = `
    ${className}
    relative
    w-full
    max-w-none
    overflow-hidden
    text-[rgb(var(--foreground))]
    selection:bg-[rgb(var(--primary))]/20
    selection:text-[rgb(var(--foreground))]
    focus-within:outline-none
    ${isStreaming ? 'animate-pulse' : ''}
  `.trim().replace(/\s+/g, ' ');

  // For streaming, we can show the content directly during rapid updates
  // and use the memoized version for stable content
  if (isStreaming) {
    return (
      <div className={containerClasses}>
        <MemoizedMarkdown content={content} id={id} />
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <MemoizedMarkdown content={content} id={id} />
    </div>
  );
};
