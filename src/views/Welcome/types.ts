export type WelcomeOption = 'create' | 'join' | 'skip';

export interface WelcomeProps {
  theme: 'dark' | 'light';
}

export interface OptionCardProps extends WelcomeProps {
  selected?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface CreateOrgFormData {
  name: string;
  description?: string;
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