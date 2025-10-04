import React, { useEffect,useState } from 'react';

import { Form,message } from 'antd';

import { ConfirmModal, Modal as CustomModal } from '@/components/ui/modal';

import { api } from '../../../../api/api';
import type { 
  AddressUploadFormat, 
  IAddressFilters,
  MonitoredAddress, 
} from '../../../../typings/compliance';
import AddressFilters from '../AddressFilters';
import AddressFormModal from '../AddressFormModal';
import MonitoredTableActions from '../MonitoredTableActions';

// Import sub-components
import MonitoredAddressesTable from './MonitoredAddressesTable';
import MonitoredAddressHistoryModal from './MonitoredAddressHistoryModal';
import MonitoredAddressUploadModal from './MonitoredAddressUploadModal';

interface MonitoredAddressManagementProps {
  onClose?: () => void;
  visible?: boolean;
  addresses: MonitoredAddress[];
  onAddressesChange: (addresses: MonitoredAddress[]) => void;
  organizationId?: string;
}

const MonitoredAddressManagement: React.FC<MonitoredAddressManagementProps> = ({ 
  onClose, 
  visible, 
  addresses,
  onAddressesChange,
  organizationId 
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<MonitoredAddress | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<IAddressFilters>({});
  const [loading, setLoading] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState<number>(0);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Sorting state
  const [sortBy, setSortBy] = useState<string>('address');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Determine if component is being used as a modal or embedded in a tab
  const isEmbedded = visible === undefined;

  // Apply filters to get all matching addresses
  const allFilteredAddresses = React.useMemo(() => {
    const filtered = addresses.filter(addr => {
      // Handle search term separately
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          addr.address.toLowerCase().includes(searchLower) ||
          addr.clientId.toLowerCase().includes(searchLower) ||
          (addr.notes && addr.notes.toLowerCase().includes(searchLower)) ||
          addr.blockchain.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Handle other filters
      return Object.entries(filters).every(([key, value]) => {
        if (key === 'searchTerm') return true; // Already handled above
        if (key === 'blockchain') {
          return addr.blockchain.toLowerCase() === value?.toLowerCase();
        }

        return addr[key as keyof MonitoredAddress] === value;
      });
    });

    // Apply sorting
    return filtered.sort((a, b) => {
      const aValue = a[sortBy as keyof MonitoredAddress] || '';
      const bValue = b[sortBy as keyof MonitoredAddress] || '';
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [addresses, filters, sortBy, sortOrder]);

  // Apply pagination to filtered addresses
  const paginatedAddresses = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return allFilteredAddresses.slice(startIndex, endIndex);
  }, [allFilteredAddresses, currentPage, pageSize]);


  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleAddAddress = () => {
    setEditingAddress(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditAddress = (record: MonitoredAddress) => {
    setEditingAddress(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDeleteAddress = (id: string) => {
    setAddressToDelete(id);
    setDeleteConfirmVisible(true);
  };

  const confirmDelete = async () => {
    if (!addressToDelete) return;

    try {
      setLoading(true);
      await api.compliance.deleteAddress(addressToDelete);
      onAddressesChange(addresses.filter(addr => addr._id !== addressToDelete));
      message.success('Address deleted successfully');
      setDeleteConfirmVisible(false);
      setAddressToDelete(null);
    } catch (error) {
      console.error('Failed to delete address:', error);
      message.error('Failed to delete address');
    } finally {
      setLoading(false);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      if (editingAddress) {
        setLoading(true);
        // Update existing address (no status change or not to suspended/archived)
        const updatedAddress = await api.compliance.updateAddress(
          editingAddress._id, 
          '',
          values,
        );
        setLoading(false);
        const updatedAddresses = addresses.map(addr => 
          addr._id === editingAddress._id ? updatedAddress : addr
        );
        onAddressesChange(updatedAddresses);
        // Increment the history refresh key to trigger a refetch when history is viewed
        setHistoryRefreshKey(prev => prev + 1);
        message.success('Address updated successfully');
      } else {
        // Add new address
        setLoading(true);
        const newAddress = await api.compliance.addAddress({
          ...values,
          isActive: true,
          tags: values.tags || []
        }, organizationId);
        setLoading(false);
        const updatedAddresses = [...addresses, newAddress];
        onAddressesChange(updatedAddresses);
        message.success('Address added successfully');
      }
      setIsModalVisible(false);
    } catch (error) {
      console.error('Form validation failed:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error('Please select a file to upload');
      return;
    }

    const file = fileList[0];
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        let addressesToUpload: AddressUploadFormat[] = [];
        
        if (file.name.endsWith('.csv')) {
          // Parse CSV
          const lines = content.split('\n');
          const headers = lines[0].split(',');
          
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const values = lines[i].split(',');
            const entry: any = {};
            
            headers.forEach((header, index) => {
              entry[header.trim()] = values[index]?.trim();
            });
            
            addressesToUpload.push({
              address: entry.address,
              blockchain: entry.blockchain,
              clientId: entry.clientId,
              notes: entry.notes
            });
          }
        } else if (file.name.endsWith('.json')) {
          // Parse JSON
          addressesToUpload = JSON.parse(content);
        }
        
        const response = await api.compliance.bulkUpload(addressesToUpload);
        
        // Refresh the address list
        const updatedAddresses = await api.compliance.getAddresses();
        onAddressesChange(updatedAddresses);
        
        setUploadModalVisible(false);
        setFileList([]);
        
        message.success(`Successfully added ${response.successful.length} addresses. Failed: ${response.failed.length}`);
        
        if (response.failed.length > 0) {
          console.error('Failed entries:', response.failed);
        }
      } catch (error) {
        console.error('Failed to process file:', error);
        message.error('Failed to process file');
      }
    };
    
    reader.readAsText(file.originFileObj as Blob);
  };

  const handleViewHistory = (addressId: string) => {
    setSelectedAddressId(addressId);
    setHistoryModalVisible(true);
  };

  // Handle pagination changes
  const handlePaginationChange = (page: number, size: number) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  // Handle sorting changes
  const handleSort = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Only render if visible is true or component is embedded in a tab
  if (visible === false && !isEmbedded) {
    return null;
  }

  // Render the component content
  const renderContent = () => (
    <>
      <MonitoredTableActions 
        onAddAddress={handleAddAddress} 
        onUploadAddresses={() => setUploadModalVisible(true)}
      >
        <AddressFilters 
          filters={filters} 
          onFiltersChange={setFilters} 
        />
      </MonitoredTableActions>

      <MonitoredAddressesTable
        addresses={paginatedAddresses}
        loading={loading}
        onEdit={handleEditAddress}
        onDelete={handleDeleteAddress}
        onViewHistory={handleViewHistory}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: allFilteredAddresses.length,
          onChange: handlePaginationChange
        }}
        onSort={handleSort}
      />

      {/* Add/Edit Address Modal */}
      <AddressFormModal
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleModalOk}
        editingAddress={editingAddress}
        form={form}
        confirmLoading={submitLoading}
      />

      {/* Batch Upload Modal */}
      <MonitoredAddressUploadModal
        visible={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          setFileList([]);
        }}
        onUpload={handleUpload}
        fileList={fileList}
        onFileListChange={setFileList}
      />

      {/* History Modal */}
      <MonitoredAddressHistoryModal
        visible={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        addressId={selectedAddressId}
        organizationId={organizationId}
        refreshKey={historyRefreshKey}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteConfirmVisible}
        onClose={() => {
          setDeleteConfirmVisible(false);
          setAddressToDelete(null);
        }}
        title="Delete Address"
        content="Are you sure you want to delete this address? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteConfirmVisible(false);
          setAddressToDelete(null);
        }}
      />
    </>
  );

  // If used as a modal, wrap in Modal component, otherwise render directly
  if (!isEmbedded) {
    return (
      <CustomModal
        title="Monitored Addresses"
        open={visible}
        onClose={onClose}
        size="xl"
      >
        {renderContent()}
      </CustomModal>
    );
  }

  // When embedded in a tab, render content directly
  return renderContent();
};

export default MonitoredAddressManagement; 