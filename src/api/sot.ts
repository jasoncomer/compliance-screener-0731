import { ISOTSyncLog } from "../typings/SOT";
import { axiosInstance } from "./api";

const updateMongoDb = async () => {
  const res = await axiosInstance.get('/sot/update', { timeout: 180 * 1000 });
  return res.data;
};

const loadLastUpdate = async () => {
  const res = await axiosInstance.get('/sot/last-update');
  return res.data as ISOTSyncLog;
};

export const sot = {
  updateMongoDb,
  loadLastUpdate
};
