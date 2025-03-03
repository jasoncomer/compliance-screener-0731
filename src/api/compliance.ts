import { axiosInstance } from './api';
import type { MonitoredAddress, AddressUploadFormat, AddressUploadResponse } from '../types/addresses';

// Local storage keys
const STORAGE_KEYS = {
  ADDRESSES: 'bs-monitored-addresses'
};

// Local storage helper functions
const getLocalAddresses = (): MonitoredAddress[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.ADDRESSES);
  return stored ? JSON.parse(stored) : [];
};

const setLocalAddresses = (addresses: MonitoredAddress[]) => {
  localStorage.setItem(STORAGE_KEYS.ADDRESSES, JSON.stringify(addresses));
};

// API endpoints
export const compliance = {
  // Get all monitored addresses
  getAddresses: async (): Promise<MonitoredAddress[]> => {
    // TODO: Implement actual API call
    // try {
    //   const response = await axiosInstance.get('/compliance/addresses');
    //   return response.data;
    // } catch (error) {
    //   throw new Error('Failed to fetch addresses');
    // }

    // Local storage implementation
    return getLocalAddresses();
  },

  // Add a new address
  addAddress: async (address: Omit<MonitoredAddress, 'id' | 'createdAt' | 'updatedAt'>): Promise<MonitoredAddress> => {
    // TODO: Implement actual API call
    // try {
    //   const response = await axiosInstance.post('/compliance/addresses', address);
    //   return response.data;
    // } catch (error) {
    //   throw new Error('Failed to add address');
    // }

    // Local storage implementation
    const addresses = getLocalAddresses();
    const newAddress: MonitoredAddress = {
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...address
    };
    addresses.push(newAddress);
    setLocalAddresses(addresses);
    return newAddress;
  },

  // Update an existing address
  updateAddress: async (id: string, address: Partial<MonitoredAddress>): Promise<MonitoredAddress> => {
    // TODO: Implement actual API call
    // try {
    //   const response = await axiosInstance.put(`/compliance/addresses/${id}`, address);
    //   return response.data;
    // } catch (error) {
    //   throw new Error('Failed to update address');
    // }

    // Local storage implementation
    const addresses = getLocalAddresses();
    const index = addresses.findIndex(addr => addr.id === id);
    if (index === -1) {
      throw new Error('Address not found');
    }
    const updatedAddress = {
      ...addresses[index],
      ...address,
      updatedAt: new Date().toISOString()
    };
    addresses[index] = updatedAddress;
    setLocalAddresses(addresses);
    return updatedAddress;
  },

  // Delete an address
  deleteAddress: async (id: string): Promise<void> => {
    // TODO: Implement actual API call
    // try {
    //   await axiosInstance.delete(`/compliance/addresses/${id}`);
    // } catch (error) {
    //   throw new Error('Failed to delete address');
    // }

    // Local storage implementation
    const addresses = getLocalAddresses();
    const filteredAddresses = addresses.filter(addr => addr.id !== id);
    setLocalAddresses(filteredAddresses);
  },

  // Bulk upload addresses
  bulkUpload: async (addresses: AddressUploadFormat[]): Promise<AddressUploadResponse> => {
    // TODO: Implement actual API call
    // try {
    //   const response = await axiosInstance.post('/compliance/addresses/bulk', { addresses });
    //   return response.data;
    // } catch (error) {
    //   throw new Error('Failed to bulk upload addresses');
    // }

    // Local storage implementation
    const existingAddresses = getLocalAddresses();
    const response: AddressUploadResponse = {
      successful: [],
      failed: []
    };

    for (const entry of addresses) {
      // Check for duplicates
      const isDuplicate = existingAddresses.some(addr => 
        addr.address.toLowerCase() === entry.address.toLowerCase() && 
        addr.blockchain.toLowerCase() === entry.blockchain.toLowerCase()
      );

      if (isDuplicate) {
        response.failed.push({
          entry,
          reason: 'Address already exists for this blockchain'
        });
        continue;
      }

      // Add the new address
      const newAddress: MonitoredAddress = {
        id: Math.random().toString(36).substr(2, 9),
        address: entry.address,
        blockchain: entry.blockchain,
        entityName: entry.entityName,
        riskThreshold: entry.riskThreshold,
        tags: entry.tags || [],
        notes: entry.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      };

      existingAddresses.push(newAddress);
      response.successful.push(entry);
    }

    setLocalAddresses(existingAddresses);
    return response;
  },

  // Get addresses by filter
  getFilteredAddresses: async (filters: {
    blockchain?: string;
    entityName?: string;
    tags?: string[];
    isActive?: boolean;
  }): Promise<MonitoredAddress[]> => {
    // TODO: Implement actual API call
    // try {
    //   const response = await axiosInstance.get('/compliance/addresses/filter', { params: filters });
    //   return response.data;
    // } catch (error) {
    //   throw new Error('Failed to fetch filtered addresses');
    // }

    // Local storage implementation
    let addresses = getLocalAddresses();

    if (filters.blockchain) {
      addresses = addresses.filter(addr => 
        addr.blockchain.toLowerCase() === filters.blockchain?.toLowerCase()
      );
    }

    if (filters.entityName) {
      addresses = addresses.filter(addr => 
        addr.entityName.toLowerCase().includes(filters.entityName?.toLowerCase() || '')
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      addresses = addresses.filter(addr => 
        filters.tags?.some(tag => addr.tags.includes(tag))
      );
    }

    if (typeof filters.isActive === 'boolean') {
      addresses = addresses.filter(addr => addr.isActive === filters.isActive);
    }

    return addresses;
  }
}; 