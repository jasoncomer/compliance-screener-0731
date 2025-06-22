import React from 'react';
import { Card, Typography, Tag } from 'antd';
import { MapContainer, TileLayer } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const { Title } = Typography;

interface GeographicPresenceProps {
  countries: string[];
}

const GeographicPresence: React.FC<GeographicPresenceProps> = ({ countries }) => {
  return (
    <Card className="bg-gray-800 rounded-2xl border-gray-700">
      <Title level={5} className="text-white mb-4">Geographic Presence</Title>
      <div className="h-[400px] mb-4">
        <MapContainer 
          center={[20, 0] as LatLngExpression} 
          zoom={2} 
          className="h-full w-full rounded-lg" 
          scrollWheelZoom={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        </MapContainer>
      </div>
      <div className="text-gray-500">
        <b>Associated Countries:</b> {countries.map(c => (
          <Tag key={c} color="blue" className="rounded-lg mr-2">{c}</Tag>
        ))}
      </div>
    </Card>
  );
};

export default GeographicPresence; 