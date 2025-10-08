import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingMessage: React.FC = () => {
  return (
    <div className="message-wrapper assistant-message">
      <div className="assistant-content">
        <div className="assistant-body">
          <div className="loading-message">
            <div className="loading-dots">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingMessage;
