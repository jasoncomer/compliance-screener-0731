import React from 'react';

import { MessageSquare } from 'lucide-react';

import { cn } from '../../../lib/utils';

interface NotesButtonProps {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  newNotesCount?: number;
}

const NotesButton: React.FC<NotesButtonProps> = ({
  onClick,
  title,
  children,
  className,
  newNotesCount = 0
}) => (
  <div className="relative inline-block">
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "relative h-9 px-4 rounded-lg bg-orange-500 text-white font-medium text-sm hover:bg-orange-600 transition-colors flex items-center gap-2",
        className
      )}
    >
      <MessageSquare className="w-4 h-4" />
      {children}
      {newNotesCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-orange-700 text-white text-xs font-bold border-2 border-white dark:border-background rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 z-10 shadow-sm">
          {newNotesCount}
        </span>
      )}
    </button>
  </div>
);

export default NotesButton;