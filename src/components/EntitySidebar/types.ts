import { SOT } from '../../typings/interfaces';

// Renamed interface for clarity
export interface EntitySidebarProps {
  associatedSots: SOT[] | null;
  currentEntityId?: string;
  onSelectSot: (sot: SOT) => void;
}

export interface RelatedEntities {
  unique_bos: string[];
  unique_custodians: string[];
}