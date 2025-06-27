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

  const sot = (res.data as SOT[]).map(item => {
    if (item.logo) {
      // Remove any whitespace
      item.logo = item.logo.trim();
      
      // If the URL doesn't start with http:// or https://, add https://
      if (!item.logo.startsWith('http://') && !item.logo.startsWith('https://')) {
        item.logo = 'https://' + item.logo;
      }
      
      // Remove any trailing slashes
      item.logo = item.logo.replace(/\/+$/, '');
    }
    return item;
  });
  return sot;
};

const updateSOT = async (id: string, data: Partial<SOT>): Promise<SOT> => {
  const response = await axiosInstance.put(`/sot/${id}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.data;
};

const deleteSOT = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/sot/${id}`);
};

const getRelatedEntities = async (entityId: string): Promise<RelatedEntitiesResponse> => {
  
  const response = await axiosInstance.get(`/attribution/entity/${entityId}/unique-values`);
 
    return response.data;
  };

export const sot = {
  updateMongoDb,
  loadLastUpdate,
  getSOT,
  updateSOT,
  deleteSOT,
  getRelatedEntities,
};
