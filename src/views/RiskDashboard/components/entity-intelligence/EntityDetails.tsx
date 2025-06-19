import React from 'react';
import { Card, Empty } from 'antd';
import { UserOutlined } from '@ant-design/icons';


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
  // Check if we have meaningful entity data
  const hasEntityData = name && name !== "Unknown Entity";

  if (!hasEntityData) {
    return (
      <Card className="bg-gray-800 rounded-2xl border-gray-700">
        <Empty
          image={<UserOutlined style={{ fontSize: 40, color: '#6b7280' }} />}
          description={
            <span className="text-gray-500">
              No entity information available for this address
            </span>
          }
          className="text-gray-500"
        />
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 rounded-2xl border-gray-700">
      <div className="flex items-center mb-4">
        <img src={logo} alt="logo" className="w-12 h-12 rounded-full mr-4" onError={(e) => {
          e.currentTarget.style.display = 'none';
        }} />
        <div>
          <div className="text-white font-semibold text-lg">{name}</div>
          <div className="text-gray-500 text-sm">{type}</div>
        </div>
      </div>
      {description && (
        <div className="text-gray-500 mb-2">{description}</div>
      )}
      {website && (
        <div className="text-gray-500 mb-1">
          <b>Website:</b> <a href={`https://${website}`} className="text-blockscout-orange">{website}</a>
        </div>
      )}
      {contact && (
        <div className="text-gray-500 mb-1">
          <b>Contact:</b> <a href={`https://${contact}`} className="text-blockscout-orange">{contact}</a>
        </div>
      )}
      {phone && (
        <div className="text-gray-500 mb-1"><b>Phone:</b> {phone}</div>
      )}
      {address && (
        <div className="text-gray-500 mb-1"><b>Address:</b> {address}</div>
      )}
      {founded > 0 && (
        <div className="text-gray-500 mb-1"><b>Founded:</b> {founded}</div>
      )}
      {countries.length > 0 && (
        <div className="text-gray-500 mb-1">
          <b>Countries:</b> {countries.join(', ')}
        </div>
      )}
    </Card>
  );
};

export default EntityDetails; 