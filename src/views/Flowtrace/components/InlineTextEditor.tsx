/**
 * InlineTextEditor - A floating text editor for canvas annotations
 * Appears at click position and allows inline editing with formatting options
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Bold, Check, Italic, Type, X } from 'lucide-react';

export interface TextAnnotation {
  text: string;
  fontSize: 'small' | 'medium' | 'large';
  bold: boolean;
  italic: boolean;
  backgroundColor?: string;
}

interface InlineTextEditorProps {
  x: number; // Screen coordinates where editor should appear
  y: number;
  initialText?: string;
  initialFontSize?: 'small' | 'medium' | 'large';
  initialBold?: boolean;
  initialItalic?: boolean;
  initialBackgroundColor?: string;
  color: string; // Text color
  onSave: (annotation: TextAnnotation) => void;
  onCancel: () => void;
}

const FONT_SIZES = {
  small: 12,
  medium: 16,
  large: 24,
};

export const InlineTextEditor: React.FC<InlineTextEditorProps> = ({
  x,
  y,
  initialText = '',
  initialFontSize = 'medium',
  initialBold = false,
  initialItalic = false,
  initialBackgroundColor,
  color,
  onSave,
  onCancel,
}) => {
  const [text, setText] = useState(initialText);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(initialFontSize);
  const [bold, setBold] = useState(initialBold);
  const [italic, setItalic] = useState(initialItalic);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState(initialBackgroundColor || 'transparent');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  // Handle click outside to cancel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleCancel();
      }
    };

    // Small delay to prevent immediate closure from the click that opened the editor
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSave = useCallback(() => {
    if (text.trim()) {
      onSave({
        text: text.trim(),
        fontSize,
        bold,
        italic,
        backgroundColor: backgroundColor === 'transparent' ? undefined : backgroundColor,
      });
    } else {
      onCancel();
    }
  }, [text, fontSize, bold, italic, backgroundColor, onSave, onCancel]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setBold(prev => !prev);
    } else if (e.key === 'i' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setItalic(prev => !prev);
    }
  }, [handleCancel, handleSave]);

  // Calculate font style
  const fontStyle = `${bold ? 'bold ' : ''}${italic ? 'italic ' : ''}${FONT_SIZES[fontSize]}px sans-serif`;

  return (
    <div
      ref={containerRef}
      className="absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-gray-300 dark:border-gray-600"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        minWidth: '300px',
        maxWidth: '500px',
      }}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-t-lg">
        {/* Font Size */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
          <button
            onClick={() => setFontSize('small')}
            className={`p-1.5 rounded transition-colors ${
              fontSize === 'small'
                ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            title="Small (12px)"
          >
            <Type className="h-3 w-3" />
          </button>
          <button
            onClick={() => setFontSize('medium')}
            className={`p-1.5 rounded transition-colors ${
              fontSize === 'medium'
                ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            title="Medium (16px)"
          >
            <Type className="h-4 w-4" />
          </button>
          <button
            onClick={() => setFontSize('large')}
            className={`p-1.5 rounded transition-colors ${
              fontSize === 'large'
                ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            title="Large (24px)"
          >
            <Type className="h-5 w-5" />
          </button>
        </div>

        {/* Text Styling */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
          <button
            onClick={() => setBold(!bold)}
            className={`p-1.5 rounded transition-colors ${
              bold
                ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            onClick={() => setItalic(!italic)}
            className={`p-1.5 rounded transition-colors ${
              italic
                ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </button>
        </div>

        {/* Background Color */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600 relative">
          <button
            onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-1"
            title="Background color"
          >
            <div
              className="w-4 h-4 rounded border border-gray-400"
              style={{ backgroundColor: backgroundColor === 'transparent' ? '#ffffff' : backgroundColor }}
            />
          </button>
          {showBackgroundPicker && (
            <div className="absolute left-0 top-full mt-1 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-300 dark:border-gray-600 z-10">
              <div className="grid grid-cols-4 gap-1 mb-2">
                <button
                  onClick={() => { setBackgroundColor('transparent'); setShowBackgroundPicker(false); }}
                  className="w-6 h-6 rounded border-2 border-gray-300 bg-white relative"
                  title="None"
                >
                  <div className="absolute inset-0 flex items-center justify-center text-red-500 text-xs">×</div>
                </button>
                {['#fff9db', '#ffecb3', '#ffe0b2', '#ffccbc', '#f8bbd0', '#e1bee7', '#d1c4e9', '#c5cae9'].map((bg) => (
                  <button
                    key={bg}
                    onClick={() => { setBackgroundColor(bg); setShowBackgroundPicker(false); }}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: bg }}
                    title={bg}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={handleSave}
            className="p-1.5 rounded bg-green-500 hover:bg-green-600 text-white transition-colors"
            title="Save (Ctrl+Enter)"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1.5 rounded bg-red-500 hover:bg-red-600 text-white transition-colors"
            title="Cancel (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Text Area */}
      <div className="p-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full min-h-[80px] p-2 border border-gray-300 dark:border-gray-600 rounded resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
          style={{
            font: fontStyle,
            color: color,
            backgroundColor: backgroundColor === 'transparent' ? undefined : backgroundColor,
          }}
          placeholder="Enter text... (Ctrl+Enter to save, Esc to cancel)"
        />
      </div>

      {/* Helper Text */}
      <div className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
        Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Ctrl+Enter</kbd> to save,{' '}
        <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd> to cancel
      </div>
    </div>
  );
};
