export interface IAttribution {
  addr: string;
  entity: string;
  cospend_id: string;
}

export interface IAttributionMap {
  [addr: string]: IAttribution;
}

export interface IReferenceAttribution {
  addr: string;
  entity: string;
  bo: string;
  custodian: string;
  sdn: string;
}

export interface ReferenceAttributionMap {
  [addr: string]: IReferenceAttribution;
}