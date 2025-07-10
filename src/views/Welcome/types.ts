export type WelcomeOption = 'create' | 'join' | 'skip';

export interface WelcomeProps {
  theme: 'dark' | 'light';
}

export interface OptionCardProps {
  selected?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface CreateOrgFormData {
  name: string;
  description?: string;
  email?: string; // Optional organization email - will default to user's email if not provided
}

export interface JoinOrgFormData {
  code: string;
}

export interface CreateOrgFormProps extends WelcomeProps {
  onBack: () => void;
  onSubmit: (values: CreateOrgFormData) => Promise<void>;
}

export interface JoinOrgFormProps extends WelcomeProps {
  onBack: () => void;
  onSubmit: (values: JoinOrgFormData) => Promise<void>;
} 