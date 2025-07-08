import { SOT } from '../../typings/interfaces';

export interface PopulatedSOT extends SOT {
  autocompleteDisplayTitle: string;
  matchedField?: string;
  searchScore?: number;
}

export interface ConsolidatedEntity {
  _id: string;
  entity_id: string;
  proper_name: string;
  urls: string[];
  contact_email?: string;
  contact_twitter?: string;
  contact_telegram?: string;
  entity_type?: string;
  logo?: string;
  description_merged?: string;
  entity_tags: string[];
  associate_countries: string[];
  social_media_profiles: string[];
  matchedFields: string[];
  searchScore: number;
  originalSOT: SOT;
} 