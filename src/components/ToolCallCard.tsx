import React, { useState } from 'react';
import { Card, Tag } from 'antd';
import { Wrench, CheckCircle, Clock, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { ToolCall } from '../hooks/useSSE';
import MarkdownRenderer from './MarkdownRenderer';

interface ToolCallCardProps {
  toolCall: ToolCall;
}

const ToolCallCard: React.FC<ToolCallCardProps> = ({ toolCall }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'executing':
        return {
          icon: <Loader2 size={12} className="animate-spin" />,
          color: '#3b82f6',
          text: '执行中',
          bgColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgba(59, 130, 246, 0.3)'
        };
      case 'completed':
        return {
          icon: <CheckCircle size={12} />,
          color: '#10b981',
          text: '已完成',
          bgColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: 'rgba(16, 185, 129, 0.3)'
        };
      case 'failed':
        return {
          icon: <Clock size={12} />,
          color: '#ef4444',
          text: '失败',
          bgColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.3)'
        };
      default:
        return {
          icon: <Clock size={12} />,
          color: '#6b7280',
          text: '待执行',
          bgColor: 'rgba(107, 114, 128, 0.1)',
          borderColor: 'rgba(107, 114, 128, 0.3)'
        };
    }
  };

  const statusConfig = getStatusConfig(toolCall.status);
  const hasDetails = (toolCall.args && Object.keys(toolCall.args).length > 0) || toolCall.result;

  const toggleExpanded = () => {
    if (hasDetails) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <Card 
      size="small" 
      className="tool-call-card"
      style={{ 
        backgroundColor: statusConfig.bgColor,
        borderColor: statusConfig.borderColor,
        borderWidth: '1px',
        borderStyle: 'solid',
        marginBottom: '12px'
      }}
    >
      <div 
        className="tool-call-header" 
        onClick={toggleExpanded}
        style={{ 
          cursor: hasDetails ? 'pointer' : 'default',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wrench size={16} style={{ color: statusConfig.color }} />
          <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
            {toolCall.toolName || toolCall.name}
          </span>
          {hasDetails && (
            <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          )}
        </div>
        <Tag 
          color={statusConfig.color} 
          icon={statusConfig.icon}
          style={{ margin: 0 }}
        >
          {statusConfig.text}
        </Tag>
      </div>
      
      {isExpanded && hasDetails && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-primary)' }}>
          {toolCall.args && Object.keys(toolCall.args).length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ 
                fontSize: '12px', 
                color: 'var(--text-tertiary)', 
                fontWeight: '500', 
                marginBottom: '6px' 
              }}>
                执行参数:
              </div>
              <pre style={{
                background: 'var(--code-bg)',
                border: '1px solid var(--code-border)',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '12px',
                maxHeight: '120px',
                overflowY: 'auto',
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                margin: 0,
                whiteSpace: 'pre-wrap',
                color: 'var(--code-text)'
              }}>
                {JSON.stringify(toolCall.args, null, 2)}
              </pre>
            </div>
          )}
          
          {toolCall.result && (
            <div>
              <div style={{ 
                fontSize: '12px', 
                color: 'var(--text-tertiary)', 
                fontWeight: '500', 
                marginBottom: '8px' 
              }}>
                执行结果:
              </div>
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                padding: '8px',
                background: 'var(--bg-code)',
                borderRadius: '6px',
                border: '1px solid var(--code-border)',
                color: 'var(--text-secondary)'
              }}>
                <MarkdownRenderer content={toolCall.result} />
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default ToolCallCard; 