import Papa from 'papaparse';
import type { MonitoredAddress, AddressUploadFormat, AddressUploadResponse } from '../types/addresses';
import type { ParseResult } from 'papaparse';

export class AddressService {
  private static validateAddress(address: string, blockchain: string): boolean {
    // Add blockchain-specific address validation
    switch (blockchain.toLowerCase()) {
      case 'ethereum':
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      case 'bitcoin':
        // Basic Bitcoin address validation - can be enhanced
        return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) || 
               /^bc1[ac-hj-np-z02-9]{11,71}$/.test(address);
      default:
        return true;
    }
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
        if (!entry.address || !entry.blockchain || !entry.entityName) {
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

  static async addAddress(address: Omit<MonitoredAddress, 'id' | 'createdAt' | 'updatedAt'>): Promise<MonitoredAddress> {
    // TODO: Implement API call to add address
    return {
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
  }

  static async bulkUpload(addresses: AddressUploadFormat[]): Promise<AddressUploadResponse> {
    // TODO: Implement API call to bulk upload addresses
    return {
      successful: addresses,
      failed: []
    };
  }
} 