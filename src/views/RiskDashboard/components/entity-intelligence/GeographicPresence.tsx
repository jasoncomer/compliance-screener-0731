import React, { useState } from 'react';
import { Card, Typography, Tag } from 'antd';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useTheme } from '../../../../context/ThemeContext';
import { countryCoordinates } from '../../../../config/country-coordinates';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const { Title } = Typography;

interface GeographicPresenceProps {
  countries: string[];
}

const GeographicPresence: React.FC<GeographicPresenceProps> = ({ countries }) => {
  const { theme } = useTheme();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Filter countries that have coordinates
  const countriesWithCoordinates = countries.filter(country => 
    countryCoordinates[country]
  );

  // Calculate center point for the map
  const center = countriesWithCoordinates.length > 0 
    ? {
        lat: countriesWithCoordinates.reduce((sum, country) => sum + countryCoordinates[country][1], 0) / countriesWithCoordinates.length,
        lng: countriesWithCoordinates.reduce((sum, country) => sum + countryCoordinates[country][0], 0) / countriesWithCoordinates.length
      }
    : { lat: 20, lng: 0 };

  return (
    <Card className={`${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} rounded-2xl`}>
      <Title level={5} className={`${theme === 'light' ? 'text-gray-900' : 'text-white'} mb-4`}>Geographic Presence</Title>
      
      <div className="h-[400px] mb-4">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={countriesWithCoordinates.length > 1 ? 3 : 4}
          style={{ height: '100%', width: '100%' }}
          className="rounded-lg"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {countriesWithCoordinates.map((country) => {
            const coords = countryCoordinates[country];
            return (
              <Marker
                key={country}
                position={[coords[1], coords[0]]}
                eventHandlers={{
                  click: () => setSelectedCountry(country),
                }}
              >
                <Popup>
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900">{country}</h3>
                    <p className="text-sm text-gray-600">Active presence</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <div className="flex flex-wrap gap-2">
        {countries.map((country) => (
          <Tag
            key={country}
            color={selectedCountry === country ? 'blue' : 'default'}
            className="cursor-pointer"
            onClick={() => setSelectedCountry(country)}
          >
            {country}
          </Tag>
        ))}
      </div>
    </Card>
  );
};

export default GeographicPresence; 