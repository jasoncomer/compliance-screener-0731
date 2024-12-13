export interface ISOTSyncLog {
    _id: string;
    timestamp: Date;
    success: boolean;
    message: string;
    count: number;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}
