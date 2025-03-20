import { ECaseStatus } from "../typings/enums";
import { ICase, ICaseCreate, ICaseStatusChange } from "../typings/interfaces"
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
  return res.data.data;
};

const getById = async (id: string): Promise<ICase> => {
  const res = await axiosInstance.get(`/cases/${id}`);
  return res.data.data;
};

const updateStatus = async (
  id: string, 
  newStatus: ECaseStatus, 
  notes?: string
): Promise<ICase> => {
  const res = await axiosInstance.patch(`/cases/${id}/status`, { 
    status: newStatus,
    notes
  });
  return res.data.data;
};

const updateCase = async (
  id: string,
  updates: Partial<ICase>
): Promise<ICase> => {
  const res = await axiosInstance.patch(`/cases/${id}`, updates);
  return res.data.data;
};

const getCaseStatusHistory = async (id: string): Promise<ICaseStatusChange[]> => {
  const res = await axiosInstance.get(`/cases/${id}/status-history`);
  return res.data.data;
};

export const cases = {
  create,
  getUserCases,
  remove,
  getById,
  updateStatus,
  updateCase,
  getCaseStatusHistory
};