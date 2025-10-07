import React from 'react';

import { Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface UploadFile {
  uid: string;
  name: string;
  status?: string;
  originFileObj?: File;
}

interface MonitoredAddressUploadModalProps {
  visible: boolean;
  onCancel: () => void;
  onUpload: () => void;
  fileList: UploadFile[];
  onFileListChange: (fileList: UploadFile[]) => void;
}

const MonitoredAddressUploadModal: React.FC<MonitoredAddressUploadModalProps> = ({
  visible,
  onCancel,
  onUpload,
  fileList,
  onFileListChange,
}) => {
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      const uploadFile: UploadFile = {
        uid: Date.now().toString(),
        name: file.name,
        originFileObj: file,
      };
      onFileListChange([uploadFile]);
    }
  };

  const handleRemoveFile = () => {
    onFileListChange([]);
  };

  return (
    <Modal
      title="Batch Upload Addresses"
      open={visible}
      onClose={onCancel}
      footer={
        <>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onUpload} disabled={fileList.length === 0}>
            Upload
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          {fileList.length === 0 ? (
            <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Upload className="w-5 h-5" />
                <span>Select File</span>
              </div>
            </label>
          ) : (
            <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {fileList[0].name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                Remove
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>Supported formats: CSV, JSON</p>
          <p>Required columns: address, blockchain, client_id</p>
          <p>Optional columns: note</p>
          <div>
            <p className="mb-2">Example CSV format:</p>
            <pre className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
              address,blockchain,client_id,note{'\n'}
              0x123...,Ethereum,client-001,Major exchange{'\n'}
              1abc...,Bitcoin,client-002,Known mixer
            </pre>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default MonitoredAddressUploadModal; 