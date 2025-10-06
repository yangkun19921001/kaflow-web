import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  // 处理纯文本中的换行符和转义字符
  const processedContent = content
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: ({ inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={oneDark as any}
                language={match[1]}
                PreTag="div"
                customStyle={{
                  borderRadius: '6px',
                  fontSize: '12px',
                  lineHeight: '1.4',
                  background: 'var(--code-bg)',
                  border: '1px solid var(--code-border)',
                  color: 'var(--code-text)',
                }}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={`inline-code ${className || ''}`} {...props}>
                {children}
              </code>
            );
          },
          p: ({ children }) => (
            <p style={{ whiteSpace: 'pre-wrap', margin: '0 0 12px 0', lineHeight: '1.6' }}>
              {children}
            </p>
          ),
          h1: ({ children }) => (
            <h1 style={{ fontSize: '24px', fontWeight: '600', margin: '16px 0 12px 0', color: 'var(--text-primary)' }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '16px 0 8px 0', color: 'var(--text-primary)' }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '12px 0 8px 0', color: 'var(--text-primary)' }}>
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul style={{ paddingLeft: '20px', margin: '12px 0' }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol style={{ paddingLeft: '20px', margin: '12px 0' }}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li style={{ margin: '4px 0', lineHeight: '1.5' }}>
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote style={{
              borderLeft: '4px solid #3b82f6',
              paddingLeft: '16px',
              margin: '16px 0',
              color: 'var(--text-tertiary)',
              fontStyle: 'italic',
              background: 'rgba(59, 130, 246, 0.05)',
              padding: '12px 16px',
              borderRadius: '0 8px 8px 0'
            }}>
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div style={{ overflowX: 'auto', margin: '16px 0' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid var(--border-primary)'
              }}>
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th style={{
              padding: '12px',
              textAlign: 'left',
              backgroundColor: 'var(--bg-secondary)',
              fontWeight: '600',
              color: 'var(--text-primary)',
              borderBottom: '1px solid var(--border-primary)'
            }}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td style={{
              padding: '12px',
              borderBottom: '1px solid var(--border-primary)',
              color: 'var(--text-secondary)'
            }}>
              {children}
            </td>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer; 