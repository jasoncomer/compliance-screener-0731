import Papa from 'papaparse';
import type { MonitoredAddress, AddressUploadFormat, AddressUploadResponse } from '../typings/addresses';
import type { ParseResult } from 'papaparse';
import { isValidBlockchainAddress, getBlockchainType } from '../utils/addressValidation';

export class AddressService {
  private static validateAddress(address: string, blockchain: string): boolean {
    // Use the new comprehensive address validation
    const isValid = isValidBlockchainAddress(address);
    const detectedType = getBlockchainType(address);
    
    // If blockchain is specified, check if it matches the detected type
    if (blockchain.toLowerCase() !== 'auto' && detectedType) {
      return isValid && detectedType.toLowerCase() === blockchain.toLowerCase();
    }
    
    return isValid;
  }

  private static parseCsvFile(file: File): Promise<AddressUploadFormat[]> {
    return new Promise((resolve, reject) => {
      Papa.parse<AddressUploadFormat>(file, {
        header: true,
        complete: (results: ParseResult<AddressUploadFormat>) => {
          resolve(results.data);
        },
        error: () => {
          reject(new Error('Failed to parse CSV file'));
        }
      });
    });
  }

  private static async parseJsonFile(file: File): Promise<AddressUploadFormat[]> {
    const text = await file.text();
    return JSON.parse(text);
  }

  static async processUploadedFile(file: File): Promise<AddressUploadResponse> {
    try {
      let addresses: AddressUploadFormat[];
      
      if (file.type === 'application/json') {
        addresses = await this.parseJsonFile(file);
      } else if (file.type === 'text/csv') {
        addresses = await this.parseCsvFile(file);
      } else {
        throw new Error('Unsupported file format');
      }

      const response: AddressUploadResponse = {
        successful: [],
        failed: []
      };

      for (const entry of addresses) {
        if (!entry.address || !entry.blockchain || !entry.clientId) {
          response.failed.push({
            entry,
            reason: 'Missing required fields'
          });
          continue;
        }

        if (!this.validateAddress(entry.address, entry.blockchain)) {
          response.failed.push({
            entry,
            reason: 'Invalid address format'
          });
          continue;
        }

        response.successful.push(entry);
      }

      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to process file: ${error.message}`);
      }
      throw new Error('Failed to process file: Unknown error');
    }
  }

  static async getAddresses(): Promise<MonitoredAddress[]> {
    // TODO: Implement API call to fetch addresses
    return [];
  }

  static async addAddress(address: Omit<MonitoredAddress, '_id'>): Promise<MonitoredAddress> {
    // TODO: Implement API call to add address
    return {
      _id: Math.random().toString(36).substr(2, 9),
      ...address
    };
  }

  static async updateAddress(id: string, address: Partial<MonitoredAddress>): Promise<MonitoredAddress> {
    // TODO: Implement API call to update address
    return {
      id,
      ...address,
      updatedAt: new Date().toISOString()
    } as MonitoredAddress;
  }

  static async deleteAddress(id: string): Promise<void> {
    // TODO: Implement API call to delete address
    console.log('deleteAddress', id);
  }

  static async bulkUpload(addresses: AddressUploadFormat[]): Promise<AddressUploadResponse> {
    // TODO: Implement API call to bulk upload addresses
    return {
      successful: addresses,
      failed: []
    };
  }
} 