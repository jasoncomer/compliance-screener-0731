import { useState } from 'react';
import { ICase } from '../typings/interfaces';

const initData: ICase[] = [
  {
    id: 'blk-0923',
    clientName: 'John Brown',
    clientEmail: 'john@bs.ai',
    blockchainAddress: '1Lx4wf9EixbFCb7KtiZRqRszdwdqYt3Cxn',
    status: 'active',
  },
  {
    id: 'blk-0922',
    clientName: 'Jim Green',
    clientEmail: 'jim@bs.ai',
    blockchainAddress: 'bc1qkl2824mh3trjrhj8...jcvsx4zfkkwnep736ght',
    status: 'complete',
  },
  {
    id: 'blk-0921',
    clientName: 'Joe Black',
    clientEmail: 'joe@bs.ai',
    blockchainAddress: 'bc1qrna7e5r6jv2g0sa39hngccr4g2myyfwmhjf3j8',
    status: 'pending',
  },
];

const useData = () => {
  const [cases, setCases] = useState<ICase[]>(initData);

  // Add your data management functions here
  // For example, you can have functions to add, update, or delete data

  return {
    cases,
    setCases,
    // Add your data management functions here
  };
};

export default useData;