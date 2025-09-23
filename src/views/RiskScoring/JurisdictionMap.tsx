import React, { useState } from 'react';

import { Card, Typography } from 'antd';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

const { Text } = Typography;


interface JurisdictionMapProps {
  countries?: string[];
}

const JurisdictionMap: React.FC<JurisdictionMapProps> = ({ countries = [] }) => {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const getCountryColor = (geo: any) => {
    const countryName = geo.properties.NAME || geo.properties.name;
    if (countries.includes(countryName)) {
      return hoveredCountry === countryName ? 'hsl(var(--primary))' : 'hsl(var(--secondary))';
    }
    return '#F5F5F5';
  };

  return (
    <Card title="Geographic Jurisdiction" className="mt-6">
      <Text type="secondary">
        Countries where this entity has legal presence or operations
      </Text>
      <div className="h-[400px] mt-6">
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{
            scale: 147
          }}
        >
          <Geographies geography="/world-110m.json">
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getCountryColor(geo)}
                  stroke="#FFFFFF"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', fill: 'hsl(var(--primary))' },
                    pressed: { outline: 'none' },
                  }}
                  onMouseEnter={() => {
                    const countryName = geo.properties.NAME || geo.properties.name;
                    setHoveredCountry(countryName);
                  }}
                  onMouseLeave={() => {
                    setHoveredCountry(null);
                  }}
                />
              ))
            }
          </Geographies>
        </ComposableMap>
      </div>
      {countries.length > 0 && (
        <div className="mt-4">
          <Text strong>Active Jurisdictions: </Text>
          <Text>{countries.join(', ')}</Text>
        </div>
      )}
    </Card>
  );
};

export default JurisdictionMap; 