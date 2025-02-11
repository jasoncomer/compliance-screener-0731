export interface IAttribution {
  addr: string;
  attribution: string;
  cospend_id: string;
}

export interface IAttributionMap {
  [addr: string]: IAttribution;
}

export interface IReferenceAttribution {
  address: string;
  entity: string;
  beneficial_owner: string;
  custodian: string;
  sdn_name: string;
}

export interface ReferenceAttributionMap {
  [addr: string]: IReferenceAttribution;
}