export const getUniqueBosAndCsutodiansService = async (entity: string) => {
  try {
    const BtcAttribution = await modelFactory.getModel('BtcAttribution');
    
    // First check if the entity exists to fail fast
    const entityExists = await BtcAttribution.findOne({ entity });
    if (!entityExists) {
      return { unique_bos: [], unique_custodians: [] };
    }

    // Optimized aggregation pipeline
    const result = await BtcAttribution.aggregate([
      {
        $match: {
          entity: entity,
          $or: [
            { bo: { $ne: "" } },
            { custodian: { $ne: "" } }
          ]
        }
      },
      {
        $group: {
          _id: null,
          unique_bos: { $addToSet: { $cond: [{ $eq: ["$bo", ""] }, "$$REMOVE", "$bo"] } },
          unique_custodians: { $addToSet: { $cond: [{ $eq: ["$custodian", ""] }, "$$REMOVE", "$custodian"] } }
        }
      },
      {
        $project: {
          _id: 0,
          unique_bos: 1,
          unique_custodians: 1
        }
      }
    ]).allowDiskUse(true); // Allow disk usage for large datasets

    return result[0] || { unique_bos: [], unique_custodians: [] };
  } catch (error) {
    console.error('Error in getUniqueBosAndCsutodiansService:', error);
    throw new Error('Failed to fetch unique BOs and custodians');
  }
}; 