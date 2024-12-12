import { axiosInstance } from "./api";

const updateMongoDb = async () => {
  const res = await axiosInstance.get('/sot/update', { timeout: 180 * 1000 });
  return res.data;
};

export const sot = {
  updateMongoDb
};
