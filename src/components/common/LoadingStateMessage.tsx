import React, { useMemo } from 'react';

interface LoadingStateProps {
  /** Array of messages to randomly display */
  messages: string[];
  /** Title to display above the message */
  title: string;
  /** Icon to display (React element) */
  icon?: React.ReactNode;
}

export const LoadingStateMessage: React.FC<LoadingStateProps> = ({
  messages,
  title,
  icon,
}) => {
  // Randomly select a loading message (memoized to avoid changing on re-renders)
  const selectedMessage = useMemo(() => {
    return messages[Math.floor(Math.random() * messages.length)];
  }, [messages]);

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
      <div className="relative">
        {icon ? (
          <div className="text-orange-500">{icon}</div>
        ) : (
          <div className="w-16 h-16 text-orange-500 animate-pulse" />
        )}
        <div className="absolute -top-2 -right-2">
          <div className="w-6 h-6 bg-orange-500 rounded-full animate-ping" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md animate-pulse">
          {selectedMessage}
        </p>
      </div>
      <div className="flex gap-2">
        <div
          className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <div
          className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <div
          className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>
    </div>
  );
};

