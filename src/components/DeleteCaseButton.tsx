import React, { useState } from 'react';
import { ICase } from '../typings/interfaces';
import { DeleteOutlined } from '@ant-design/icons';
import { Popconfirm, Space, Button } from 'antd';
import { ECaseStatus } from '../typings/enums';
import { api } from '../api/api';
import { useAppContext } from '../context/AppContext';

interface DeleteCaseButtonProps {
  caseDoc: ICase;
}

const DeleteCaseButton: React.FC<DeleteCaseButtonProps> = ({ caseDoc }) => {
  const { setCases } = useAppContext();
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const text = "Are you sure you want to delete this case?";
  
  const handleOk = async () => {
    console.log('delete', caseDoc._id);
    setConfirmLoading(true);

    await api.cases.remove(caseDoc._id)
      .then(res => {
        console.log('res', res);
        setCases(prev => prev.filter(c => c._id !== caseDoc._id));
        setOpen(false);
        setConfirmLoading(false);
      })
      .catch(console.error);
  };

  const handleCancel = () => {
    console.log('Clicked cancel button');
    setOpen(false);
  };

  if (caseDoc.status === ECaseStatus.ARCHIVED) return null;

  return (
    <Popconfirm
      title={text}
      open={open}
      onConfirm={handleOk}
      okButtonProps={{ loading: confirmLoading }}
      onCancel={handleCancel}
    >
      <Space size="middle">
        <Button type="default" icon={<DeleteOutlined />} onClick={() => setOpen(true)}></Button>
      </Space>
    </Popconfirm >
  );
};

export default DeleteCaseButton;