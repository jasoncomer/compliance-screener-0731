import React from 'react';
import { Modal, Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';

interface AddressUploadModalProps {
  visible: boolean;
  onCancel: () => void;
  onUpload: () => void;
  fileList: UploadFile[];
  onFileListChange: (fileList: UploadFile[]) => void;
}

const AddressUploadModal: React.FC<AddressUploadModalProps> = ({
  visible,
  onCancel,
  onUpload,
  fileList,
  onFileListChange,
}) => {
  return (
    <Modal
      title="Batch Upload Addresses"
      open={visible}
      onOk={onUpload}
      onCancel={onCancel}
    >
      <Upload
        accept=".csv,.json"
        fileList={fileList}
        onChange={({ fileList }) => onFileListChange(fileList)}
        beforeUpload={() => false}
      >
        <Button icon={<UploadOutlined />}>Select File</Button>
      </Upload>
      <div style={{ marginTop: 16 }}>
        <p>Supported formats: CSV, JSON</p>
        <p>Required columns: address, blockchain, entityName</p>
        <p>Optional columns: riskThreshold, tags (semicolon-separated), notes</p>
        <p>Example CSV format:</p>
        <pre>
          address,blockchain,entityName,riskThreshold,tags,notes{'\n'}
          0x123...,Ethereum,Exchange A,75,exchange;high-risk,Major exchange{'\n'}
          1abc...,Bitcoin,Mixer B,90,mixer;high-risk,Known mixer
        </pre>
      </div>
    </Modal>
  );
};

export default AddressUploadModal; 