import React, { useState, useRef, KeyboardEvent } from 'react';
import { Button } from 'antd';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isStreaming: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isStreaming, 
  placeholder = "请输入你的问题" 
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    
    onSendMessage(input);
    setInput('');
    
    // 重置输入框高度
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px';
    }
    
    // 聚焦到输入框
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    
    // 自动调整高度
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // 最大高度约5行
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  };

  return (
    <div className="modern-chat-input">
      <div className="input-container">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isStreaming}
          className="chat-textarea"
          rows={1}
        />
        <div className="input-actions">
          <Button
            type="text"
            icon={<Send size={16} />}
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="send-btn"
            size="small"
          />
        </div>
      </div>
    </div>
  );
};

export default ChatInput; 