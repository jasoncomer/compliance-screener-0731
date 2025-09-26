import React, { memo, useState } from 'react';

import { Check, Copy } from 'lucide-react';

import { cn } from '@/lib/utils';

interface CopyButtonProps {
  text: string;
  className?: string;
  title?: string;
}

const CopyButton: React.FC<CopyButtonProps> = memo(({
  text,
  className,
  title = 'Copy'
}) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 1000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  return (
    <button
      onClick={handleCopy}
      title={title}
      className={cn(
        "cursor-pointer text-gray-400 text-lg flex items-center transition-all duration-200",
        "hover:text-orange-500 active:scale-95",
        "dark:text-gray-500 dark:hover:text-orange-400",
        className
      )}
    >
      {copySuccess ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
    </button>
  );
});

CopyButton.displayName = 'CopyButton';

export default CopyButton;