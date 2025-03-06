export interface IAttribution {
  addr: string;
  entity: string;
  bo: string;
  custodian: string;
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