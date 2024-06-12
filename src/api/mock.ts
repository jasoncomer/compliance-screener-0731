import { ECaseStatus } from "../typings/enums";
import { ICase } from "../typings/interfaces";

export const initData: ICase[] = [
  {
    key: 'blk-0923',
    _id: 'blk-0923',
    clientName: 'John Brown',
    clientEmail: 'john@bs.ai',
    blockchainAddress: '1Lx4wf9EixbFCb7KtiZRqRszdwdqYt3Cxn',
    status: ECaseStatus.ACTIVE,
    userId: '12345',
  },
  {
    key: 'blk-0922',
    _id: 'blk-0922',
    clientName: 'Jim Green',
    clientEmail: 'jim@bs.ai',
    blockchainAddress: 'bc1qkl2824mh3trjrhj8...jcvsx4zfkkwnep736ght',
    status: ECaseStatus.ARCHIVED,
    userId: '12345',
  },
  {
    key: 'blk-0921',
    _id: 'blk-0921',
    clientName: 'Joe Black',
    clientEmail: 'joe@bs.ai',
    blockchainAddress: 'bc1qrna7e5r6jv2g0sa39hngccr4g2myyfwmhjf3j8',
    status: ECaseStatus.ACTIVE,
    userId: '12345',
  },
];