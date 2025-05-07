import { SOT } from "../typings/interfaces";
import { ISOTSyncLog } from "../typings/SOT";
import { axiosInstance } from "./api";

interface RelatedEntitiesResponse {
  unique_bos: string[];
  unique_custodians: string[];
}

const updateMongoDb = async () => {
  const res = await axiosInstance.get('/sot/update', { timeout: 180 * 1000 });
  return res.data;
};

const loadLastUpdate = async () => {
  const res = await axiosInstance.get('/sot/last-update');
  return res.data as ISOTSyncLog;
};

const getSOT = async () => {
    const res = await axiosInstance.get(`/sot`, { timeout: 20000 });
    
    // TODO: fix the logo url for all SOTs in the sheet
    const sot = (res.data as SOT[]).map(item => {
      if (item.logo && !item.logo.startsWith('https://')) {
        item.logo = 'https://' + item.logo;
      }
      return item;
    });
    return sot;
  };
  
  export const updateSOT = async (id: string, data: Partial<SOT>): Promise<SOT> => {
    const response = await axiosInstance.put(`/sot/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.data;
  };
  
  export const deleteSOT = async (id: string): Promise<void> => {
    await axiosInstance.delete(`/sot/${id}`);
  };

export const getRelatedEntities = async (entityId: string): Promise<RelatedEntitiesResponse> => {
  console.log('Fetching related entities for entity:', entityId);
  const response = await axiosInstance.get(`/:entity/${entityId}/unique-values`);
  console.log('Related entities response:', response.data);
  return response.data.data;
};

export const sot = {
  updateMongoDb,
  loadLastUpdate,
  getSOT,
  updateSOT,
  deleteSOT,
  getRelatedEntities
};
