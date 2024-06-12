import { ICase, ICaseCreate } from "../typings/interfaces"
import { axiosInstance } from "./api";

const create = async (data: ICaseCreate): Promise<ICase> => {
  const res = await axiosInstance.post('/cases', data);
  return res.data.data;
};

const remove = async (id: string): Promise<boolean> => {
  const res = await axiosInstance.delete(`/cases/${id}`);
  return res.data.data;
};

const getUserCases = async (): Promise<ICase[]> => {
  const res = await axiosInstance.get('/cases');
  console.log('res', res.data.data);
  return res.data.data;
};


export const cases = {
  create,
  getUserCases,
  remove,
};