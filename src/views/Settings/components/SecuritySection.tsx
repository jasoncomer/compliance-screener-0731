import React, { useState } from 'react';
import { Card, SubTitle, InfoList, InfoItem, Label, Value, Button } from './styled';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Lock } from 'lucide-react';
import { changePassword } from '../../../api/auth';
import { useToast } from '@/hooks/use-toast';

interface SecuritySectionProps {
  theme: 'dark' | 'light';
}

const SecuritySection: React.FC<SecuritySectionProps> = ({ theme }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formValues, setFormValues] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formValues.currentPassword) {
      newErrors.currentPassword = 'Please enter your current password';
    }
    if (!formValues.newPassword) {
      newErrors.newPassword = 'Please enter your new password';
    } else if (formValues.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long';
    }
    if (!formValues.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formValues.newPassword !== formValues.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await changePassword(formValues.currentPassword, formValues.newPassword);
      toast({
        title: 'Success',
        description: 'Password updated successfully',
      });
      setIsModalVisible(false);
      setFormValues({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setErrors({});
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update password. Please check your current password and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card theme={{ theme }}>
      <SubTitle theme={{ theme }}>Security Settings</SubTitle>
      <InfoList>
        <InfoItem theme={{ theme }}>
          <Label theme={{ theme }}>Password</Label>
          <Value theme={{ theme }}>
            <Button onClick={() => setIsModalVisible(true)}>
              Change Password
            </Button>
          </Value>
        </InfoItem>
      </InfoList>

      <Modal
        title="Change Password"
        open={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setFormValues({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setErrors({});
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsModalVisible(false);
              setFormValues({ currentPassword: '', newPassword: '', confirmPassword: '' });
              setErrors({});
            }}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        ]}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="password"
                value={formValues.currentPassword}
                onChange={(e) => setFormValues({ ...formValues, currentPassword: e.target.value })}
                className="pl-10"
                placeholder="Enter current password"
              />
            </div>
            {errors.currentPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.currentPassword}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="password"
                value={formValues.newPassword}
                onChange={(e) => setFormValues({ ...formValues, newPassword: e.target.value })}
                className="pl-10"
                placeholder="Enter new password"
              />
            </div>
            {errors.newPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="password"
                value={formValues.confirmPassword}
                onChange={(e) => setFormValues({ ...formValues, confirmPassword: e.target.value })}
                className="pl-10"
                placeholder="Confirm new password"
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>
        </div>
      </Modal>
    </Card>
  );
};

export default SecuritySection; 