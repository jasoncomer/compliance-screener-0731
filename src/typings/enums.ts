export enum ECaseStatus {
  NEW = 'new',
  UNDER_REVIEW = 'under_review',
  ESCALATED = 'escalated', 
  PENDING_INFO = 'pending_info',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
}

export enum ECaseStatusDisplayNames {
  new = 'New',
  under_review = 'Under Review',
  escalated = 'Escalated',
  pending_info = 'Pending Info',
  closed = 'Closed',
  archived = 'Archived'
}

export enum ECaseStatusColors {
  new = 'blue',
  under_review = 'processing',
  escalated = 'error',
  pending_info = 'warning',
  closed = 'success',
  archived = 'default'
}
