import React, { useState } from 'react';
import { FileText, Bold, Italic, List, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { ReportModuleData } from '../CaseReportBuilderModal';

interface TextModuleProps {
  module: ReportModuleData;
}

export const TextModule: React.FC<TextModuleProps> = ({ module }) => {
  const [title, setTitle] = useState(module.content?.title || '');
  const [content, setContent] = useState(module.content?.text || '');
  const [alignment, setAlignment] = useState(module.content?.alignment || 'left');

  const updateModule = () => {
    module.content = {
      ...module.content,
      title,
      text: content,
      alignment
    };
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    module.content = { ...module.content, title: value };
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    module.content = { ...module.content, text: value };
  };

  const handleAlignmentChange = (align: string) => {
    setAlignment(align);
    module.content = { ...module.content, alignment: align };
  };

  const getAlignmentClass = (align: string) => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5 text-blue-500" />
        <h4 className="font-semibold">Text Module</h4>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="text-title">Title (optional)</Label>
          <Input
            id="text-title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Enter title..."
          />
        </div>

        <div>
          <Label htmlFor="text-content">Content</Label>
          <Textarea
            id="text-content"
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Enter your text content..."
            rows={6}
          />
        </div>

        <div>
          <Label>Text Alignment</Label>
          <div className="flex gap-2 mt-2">
            <Button
              variant={alignment === 'left' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleAlignmentChange('left')}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={alignment === 'center' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleAlignmentChange('center')}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant={alignment === 'right' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleAlignmentChange('right')}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Preview */}
        {(title || content) && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
            <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Preview:</h5>
            <div className={getAlignmentClass(alignment)}>
              {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
              {content && (
                <div className="text-sm whitespace-pre-wrap">
                  {content}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};