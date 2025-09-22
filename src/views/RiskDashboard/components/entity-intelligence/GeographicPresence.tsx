import React, { useState, useMemo } from 'react';
import { Card, Typography, Tag, Tooltip } from 'antd';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useTheme } from '../../../../context/ThemeContext';
import { countryCoordinates } from '../../../../config/country-coordinates';
import { MapPin, Globe, Users } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Risk score data
const riskScores: Record<string, number> = {
  'Afghanistan': 74.63, 'Albania': 45.34, 'Algeria': 52.28, 'American Samoa': 24.1, 'Andorra': 22.55,
  'Angola': 49.47, 'Anguilla': 34.17, 'Antigua and Barbuda': 36.74, 'Argentina': 34.71, 'Armenia': 32.69,
  'Aruba': 31.64, 'Australia': 22.12, 'Austria': 22.38, 'Azerbaijan': 38.69, 'Bahamas, The': 33.48,
  'Bahrain': 31.61, 'Bangladesh': 30.99, 'Barbados': 45.04, 'Belarus': 41.17, 'Belgium': 25.38,
  'Belize': 37.48, 'Benin': 36.6, 'Bermuda': 21.85, 'Bhutan': 27.7, 'Bolivia': 33.75,
  'Bosnia and Herzegovina': 46.75, 'Botswana': 27.5, 'Brazil': 34.94, 'British Indian Ocean Territory': 21.2,
  'British Virgin Islands': 36.7, 'Brunei': 21.4, 'Bulgaria': 45.7, 'Burkina Faso': 47.94, 'Burundi': 56.48,
  'Cambodia': 37.9, 'Cameroon': 51.35, 'Canada': 24.95, 'Cape Verde': 32.61, 'Cayman Islands': 32.89,
  'Central African Republic': 50.98, 'Chad': 38.54, 'Chile': 27.74, 'China': 45.92, 'Christmas Island': 22.33,
  'Cocos (Keeling) Islands': 22.33, 'Colombia': 37.26, 'Comoros': 40.5, 'Congo, Democratic Republic of the': 71.66,
  'Congo, Republic of the': 71.66, 'Cook Islands': 28.13, 'Costa Rica': 33.84, 'Cote d\'Ivoire': 51.61,
  'Croatia': 53.03, 'Cuba': 45.89, 'Cyprus': 32.74, 'Czech Republic': 25.46, 'Denmark': 18.46,
  'Djibouti': 41.96, 'Dominica': 33.16, 'Dominican Republic': 31.28, 'Ecuador': 35.29, 'Egypt': 31.17,
  'El Salvador': 35.15, 'Equatorial Guinea': 37.9, 'Eritrea': 54.72, 'Estonia': 21.37, 'Ethiopia': 42.85,
  'Falkland Islands (Islas Malvinas)': 21.2, 'Faroe Islands': 18.46, 'Fiji': 30.88, 'Finland': 18.01,
  'France': 21.71, 'French Guiana': 21.05, 'French Polynesia': 21.05, 'Gabon': 35.54, 'Gambia, The': 31.7,
  'Gaza Strip': 54.41, 'Georgia': 29.4, 'Germany': 23.52, 'Ghana': 34.18, 'Gibraltar': 41.21,
  'Greece': 26.7, 'Greenland': 19.43, 'Grenada': 34.87, 'Guadeloupe': 21.05, 'Guam': 24.1,
  'Guatemala': 47.01, 'Guernsey': 25.77, 'Guinea': 44.8, 'Guinea-Bissau': 55.99, 'Guyana': 40.75,
  'Haiti': 74.3, 'Holy See (Vatican City)': 22.17, 'Honduras': 35.28, 'Hong Kong': 37.47, 'Hungary': 28.7,
  'Iceland': 21.04, 'India': 32.02, 'Indonesia': 34.44, 'Iran': 81.66, 'Iraq': 54.15,
  'Ireland': 25.95, 'Isle of Man': 26.69, 'Israel': 31.77, 'Italy': 27.66, 'Jamaica': 45.11,
  'Japan': 23.94, 'Jersey': 23.29, 'Jordan': 29.73, 'Kazakhstan': 28.92, 'Kenya': 55.49,
  'Kiribati': 37.94, 'Korea, North': 78.2, 'Korea, South': 23.48, 'Kuwait': 31.52, 'Kyrgyzstan': 34.54,
  'Latvia': 25.16, 'Lebanon': 67.76, 'Lesotho': 31.5, 'Liberia': 44.66, 'Libya': 61.96,
  'Liechtenstein': 23.23, 'Lithuania': 22.08, 'Luxembourg': 23.41, 'Macau': 25.07, 'Macedonia': 39.14,
  'Madagascar': 34.67, 'Malawi': 28.76, 'Malaysia': 32.16, 'Maldives': 36.2, 'Mali': 62.78,
  'Malta': 28.46, 'Marshall Islands': 31.11, 'Martinique': 21.05, 'Mauritania': 31.08, 'Mauritius': 29.73,
  'Mayotte': 21.05, 'Mexico': 35.01, 'Micronesia, Federated States of': 35.97, 'Moldova': 37.54, 'Monaco': 43.13,
  'Mongolia': 28.82, 'Montserrat': 31.63, 'Morocco': 33.03, 'Mozambique': 57.15, 'Namibia': 41.83,
  'Nauru': 30.84, 'Nepal': 34.6, 'Netherlands': 27.23, 'Netherlands Antilles': 27.23, 'New Caledonia': 21.05,
  'New Zealand': 19.19, 'Nicaragua': 49.07, 'Niger': 47.02, 'Nigeria': 54.4, 'Niue': 32.38,
  'Norfolk Island': 22.33, 'Norway': 17.62, 'Oman': 27.9, 'Pakistan': 39.49, 'Palau': 32.18,
  'Panama': 52.28, 'Papua New Guinea': 37.2, 'Paraguay': 35.77, 'Peru': 32.99, 'Philippines': 56.44,
  'Poland': 28.13, 'Portugal': 23.4, 'Puerto Rico': 22.11, 'Qatar': 24.7, 'Romania': 28.62,
  'Russia': 71.25, 'Rwanda': 28.82, 'Saint Helena': 21.2, 'Saint Kitts and Nevis': 36.03, 'Saint Lucia': 36.18,
  'Saint Pierre and Miquelon': 21.05, 'Saint Vincent and the Grenadines': 34.08, 'Samoa': 35.68, 'San Marino': 19.1,
  'Sao Tome and Principe': 36.64, 'Saudi Arabia': 28.32, 'Senegal': 35.88, 'Serbia and Montenegro': 44.26,
  'Seychelles': 37.6, 'Sierra Leone': 39.44, 'Singapore': 25.31, 'Slovakia': 28.88, 'Slovenia': 34.62,
  'Solomon Islands': 32.08, 'Somalia': 65.38, 'South Africa': 46.6, 'Spain': 25.71, 'Sri Lanka': 30.67,
  'Sudan': 49.52, 'Suriname': 39.38, 'Svalbard': 17.18, 'Sweden': 18.85, 'Switzerland': 24.51,
  'Syria': 74.49, 'Taiwan': 27.9, 'Tajikistan': 35.9, 'Tanzania': 53.22, 'Thailand': 35.71,
  'Timor-Leste': 34.5, 'Togo': 35.01, 'Tokelau': 19.18, 'Tonga': 33.13, 'Trinidad and Tobago': 48.45,
  'Tunisia': 41.35, 'Turkey': 46.64, 'Turkmenistan': 34.75, 'Turks and Caicos Islands': 31.08, 'Tuvalu': 35.94,
  'Uganda': 46.67, 'Ukraine': 46.43, 'United Arab Emirates': 45.39, 'United Kingdom': 24.79, 'United States': 25.22,
  'Uruguay': 22.06, 'Uzbekistan': 30.78, 'Vanuatu': 47.93, 'Venezuela': 71.09, 'Vietnam': 54.24,
  'Virgin Islands': 26.64, 'Wallis and Futuna': 21.05, 'West Bank': 54.41, 'Western Sahara': 33.03,
  'Yemen': 68.4, 'Zambia': 28.16, 'Zimbabwe': 45.37, 'Global': 35.94, 'Curaçao': 39.88,
  'Darknet Entity': 91.07, 'Risky Entity': 91.07
};

// Get risk color based on score
const getRiskColor = (country: string): string => {
  const score = riskScores[country] || 0;
  
  if (score >= 70) return '#ef4444'; // Soft Red - Very High Risk
  if (score >= 50) return '#f97316'; // Soft Orange - High Risk  
  if (score >= 30) return '#eab308'; // Soft Yellow - Medium Risk
  return '#22c55e'; // Soft Green - Low Risk (includes developed countries up to 30)
};

// Get risk level description
const getRiskLevel = (country: string): string => {
  const score = riskScores[country] || 0;
  
  if (score >= 70) return 'Very High Risk';
  if (score >= 50) return 'High Risk';
  if (score >= 30) return 'Medium Risk';
  return 'Low Risk'; // Includes developed countries up to 30
};

// Create custom markers with risk-based coloring
const createCustomIcon = (country: string, count: number, isSelected: boolean) => {
  const riskColor = getRiskColor(country);
  const isSpecialCase = ['Global', 'Darknet Entity', 'Risky Entity'].includes(country);
  const size = isSelected ? 24 : 20;
  const borderWidth = isSelected ? 3 : 2;
  
  // Create a more transparent version of the color
  const transparentColor = riskColor + 'CC'; // Add 80% opacity
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${transparentColor};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: ${borderWidth}px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${isSelected ? '12px' : '10px'};
        cursor: pointer;
        transition: all 0.2s ease;
        backdrop-filter: blur(4px);
        ${isSpecialCase ? 'border: 2px solid #374151;' : ''}
      ">
        ${count > 1 ? count : '•'}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

const { Title } = Typography;

interface GeographicPresenceProps {
  countries: string[];
}

const GeographicPresence: React.FC<GeographicPresenceProps> = ({ countries }) => {
  const { theme } = useTheme();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Filter countries that have coordinates and count occurrences
  const countriesWithCoordinates = useMemo(() => {
    const countryCounts = countries.reduce((acc, country) => {
      if (countryCoordinates[country]) {
        acc[country] = (acc[country] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(countryCounts).map(([country, count]) => ({
      country,
      count,
      coordinates: countryCoordinates[country]
    }));
  }, [countries]);

  // Get countries without coordinates (special cases like "Global", "Darknet Entity", etc.)
  const countriesWithoutCoordinates = useMemo(() => {
    const countryCounts = countries.reduce((acc, country) => {
      if (!countryCoordinates[country]) {
        acc[country] = (acc[country] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(countryCounts).map(([country, count]) => ({
      country,
      count
    }));
  }, [countries]);

  // Calculate center point for the map
  const center = useMemo(() => {
    if (countriesWithCoordinates.length === 0) return { latitude: 20, longitude: 0 };
    
    const totalLat = countriesWithCoordinates.reduce((sum, { coordinates }) => sum + coordinates[1], 0);
    const totalLng = countriesWithCoordinates.reduce((sum, { coordinates }) => sum + coordinates[0], 0);
    
    return {
      latitude: totalLat / countriesWithCoordinates.length,
      longitude: totalLng / countriesWithCoordinates.length
    };
  }, [countriesWithCoordinates]);

  // Get map tile URL based on theme
  const mapTileUrl = theme === 'dark' 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <Card className={`${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} rounded-2xl`}>
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-blue-500" />
        <Title level={5} className={`${theme === 'light' ? 'text-gray-900' : 'text-white'} mb-0`}>
          Geographic Presence
        </Title>
        <div className="ml-auto flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{countriesWithCoordinates.length + countriesWithoutCoordinates.length} total</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#22c55e' }}></div>
              <span>Low (0-29)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#eab308' }}></div>
              <span>Med (30-49)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f97316' }}></div>
              <span>High (50-69)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
              <span>Very High (70+)</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="h-[400px] mb-4 rounded-lg overflow-hidden">
        <MapContainer
          center={[center.latitude, center.longitude]}
          zoom={countriesWithCoordinates.length > 1 ? 2 : 4}
          style={{ height: '100%', width: '100%' }}
          className="rounded-lg"
        >
          <TileLayer
            url={mapTileUrl}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          
          {countriesWithCoordinates.map(({ country, count, coordinates }) => {
            const isSelected = selectedCountry === country;
            const riskScore = riskScores[country] || 0;
            const riskLevel = getRiskLevel(country);
            const isSpecialCase = ['Global', 'Darknet Entity', 'Risky Entity'].includes(country);
            
            return (
              <Marker
                key={country}
                position={[coordinates[1], coordinates[0]]}
                icon={createCustomIcon(country, count, isSelected)}
                eventHandlers={{
                  click: () => setSelectedCountry(isSelected ? null : country),
                }}
              >
                <Popup>
                  <div className="text-center p-2">
                    <h3 className="font-semibold text-gray-900 mb-1">{country}</h3>
                    <p className="text-sm text-gray-600">
                      {count} {count === 1 ? 'reference' : 'references'}
                    </p>
                    <div className="mt-2 text-xs text-gray-500">
                      {isSpecialCase ? 'Special entity type' : 'Geographic presence'}
                    </div>
                    {riskScore > 0 && (
                      <div className="mt-2 text-xs">
                        <span className={`px-2 py-1 rounded text-white text-xs`} 
                              style={{ backgroundColor: getRiskColor(country) }}>
                          Risk: {riskScore.toFixed(1)} ({riskLevel})
                        </span>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Special Cases Section */}
      {countriesWithoutCoordinates.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-orange-500" />
            <span className={`text-sm font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              Special Cases
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {countriesWithoutCoordinates.map(({ country, count }) => (
              <Tooltip key={country} title={`${country} (${count} ${count === 1 ? 'reference' : 'references'})`}>
                <Tag
                  color="orange"
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  {country} {count > 1 && `(${count})`}
                </Tag>
              </Tooltip>
            ))}
          </div>
        </div>
      )}

      {/* Geographic Countries Section */}
      {countriesWithCoordinates.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-blue-500" />
            <span className={`text-sm font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              Geographic Locations
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {countriesWithCoordinates.map(({ country, count }) => {
              const isSpecialCase = ['Global', 'Darknet Entity', 'Risky Entity'].includes(country);
              const riskScore = riskScores[country] || 0;
              const riskLevel = getRiskLevel(country);
              const riskColor = getRiskColor(country);
              
              return (
                <Tooltip key={country} title={`${country} (${count} ${count === 1 ? 'reference' : 'references'}) - Risk: ${riskScore.toFixed(1)} (${riskLevel})`}>
                  <Tag
                    color={isSpecialCase ? 'red' : (selectedCountry === country ? 'blue' : 'default')}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedCountry(selectedCountry === country ? null : country)}
                    style={!isSpecialCase && !selectedCountry ? { 
                      backgroundColor: riskColor + 'DD', // 87% opacity
                      color: 'white',
                      border: 'none',
                      backdropFilter: 'blur(4px)'
                    } : {}}
                  >
                    {country} {count > 1 && `(${count})`}
                    {riskScore > 0 && (
                      <span className="ml-1 text-xs opacity-90">
                        {riskScore.toFixed(0)}
                      </span>
                    )}
                  </Tag>
                </Tooltip>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};

export default GeographicPresence; 