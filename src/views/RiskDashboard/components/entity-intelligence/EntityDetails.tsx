import React from 'react';
import { UserOutlined } from '@ant-design/icons';
import { useTheme } from '../../../../context/ThemeContext';

interface EntityDetailsProps {
  name: string;
  type: string;
  description: string;
  website: string;
  contact: string;
  phone: string;
  address: string;
  founded: number;
  logo: string;
  countries: string[];
}

const EntityDetails: React.FC<EntityDetailsProps> = ({
  name,
  type,
  description,
  website,
  contact,
  phone,
  address,
  founded,
  logo,
  countries
}) => {
  const { theme } = useTheme();

  // Check if we have meaningful entity data
  const hasEntityData = name && name !== "Unknown Entity";

  if (!hasEntityData) {
    return (
      <div className={`rounded-2xl border p-6 h-full ${
        theme === 'dark' 
          ? 'bg-gray-800/50 border-gray-700' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <UserOutlined className={`text-2xl ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`} />
          </div>
          <h4 className={`text-lg font-medium mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>No Entity Information</h4>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            No entity information available for this address
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border p-6 h-full ${
      theme === 'dark' 
        ? 'bg-gray-800/50 border-gray-700' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <h4 className={`text-xl font-semibold mb-6 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>Entity Details</h4>
      
      <div className="flex items-center mb-6">
        {logo && (
          <img 
            src={logo} 
            alt="Entity logo" 
            className="w-12 h-12 rounded-full mr-4 object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }} 
          />
        )}
        <div>
          <div className={`font-semibold text-lg ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>{name}</div>
          <div className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>{type}</div>
        </div>
      </div>

      <div className="space-y-3">
        {description && (
          <div className={`text-sm ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <span className={`font-medium ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            }`}>Description:</span> {description}
          </div>
        )}
        
        {website && (
          <div className={`text-sm ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <span className={`font-medium ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            }`}>Website:</span>{' '}
            <a 
              href={`https://${website}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-brand-primary hover:text-brand-primary/80 transition-colors"
            >
              {website}
            </a>
          </div>
        )}
        
        {contact && (
          <div className={`text-sm ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <span className={`font-medium ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            }`}>Contact:</span>{' '}
            <a 
              href={`https://${contact}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-brand-primary hover:text-brand-primary/80 transition-colors"
            >
              {contact}
            </a>
          </div>
        )}
        
        {phone && (
          <div className={`text-sm ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <span className={`font-medium ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            }`}>Phone:</span> {phone}
          </div>
        )}
        
        {address && (
          <div className={`text-sm ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <span className={`font-medium ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            }`}>Address:</span> {address}
          </div>
        )}
        
        {founded > 0 && (
          <div className={`text-sm ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <span className={`font-medium ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            }`}>Founded:</span> {founded}
          </div>
        )}
        
        {countries.length > 0 && (
          <div className={`text-sm ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <span className={`font-medium ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            }`}>Countries:</span> {countries.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityDetails; 