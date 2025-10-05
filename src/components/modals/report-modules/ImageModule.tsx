import React, { useState, useRef } from 'react';
import { Image, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { ReportModuleData } from '../CaseReportBuilderModal';

interface ImageModuleProps {
  module: ReportModuleData;
}

export const ImageModule: React.FC<ImageModuleProps> = ({ module }) => {
  const [imageUrl, setImageUrl] = useState(module.content?.imageUrl || '');
  const [caption, setCaption] = useState(module.content?.caption || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImageUrl(result);
        // Update module content
        module.content = { ...module.content, imageUrl: result };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    module.content = { ...module.content, imageUrl: url };
  };

  const handleCaptionChange = (text: string) => {
    setCaption(text);
    module.content = { ...module.content, caption: text };
  };

  const removeImage = () => {
    setImageUrl('');
    module.content = { ...module.content, imageUrl: '' };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Image className="h-5 w-5 text-blue-500" />
        <h4 className="font-semibold">Image Module</h4>
      </div>

      {!imageUrl ? (
        <div className="space-y-4">
          <div>
            <Label htmlFor="image-url">Image URL</Label>
            <Input
              id="image-url"
              value={imageUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="Enter image URL..."
            />
          </div>
          
          <div className="text-center">
            <span className="text-sm text-gray-500">or</span>
          </div>
          
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Image
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={imageUrl}
              alt="Report image"
              className="w-full max-h-64 object-contain rounded-lg border border-gray-200 dark:border-gray-700"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={removeImage}
              className="absolute top-2 right-2 bg-white dark:bg-gray-800 shadow-md"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div>
            <Label htmlFor="image-caption">Caption (optional)</Label>
            <Input
              id="image-caption"
              value={caption}
              onChange={(e) => handleCaptionChange(e.target.value)}
              placeholder="Enter image caption..."
            />
          </div>
        </div>
      )}
    </div>
  );
};