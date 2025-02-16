import React from 'react';
import { Card, Typography, Empty } from 'antd';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { Feature, GeometryObject } from 'geojson';
import styled from 'styled-components';

const { Text } = Typography;

const MapContainer = styled.div`
  height: 400px;
  margin-top: 24px;
  svg {
    width: 100%;
    height: 100%;
    display: block;
  }
`;

const StyledCard = styled(Card)`
  margin-top: 24px;
  .ant-card-body {
    padding: 24px;
  }
`;

// Map of country names to their approximate center coordinates [longitude, latitude]
const countryCoordinates: Record<string, [number, number]> = {
  'United States': [-95, 40],
  'United Kingdom': [-2, 54],
  'Singapore': [103.8, 1.3],
  'China': [105, 35],
  'Japan': [138, 36],
  'South Korea': [127.5, 36.5],
  'Germany': [10, 51],
  'France': [2, 46],
  'Italy': [12, 42],
  'Spain': [-3, 40],
  'Russia': [105, 60],
  'India': [78, 22],
  'Brazil': [-55, -10],
  'Canada': [-95, 60],
  'Australia': [133, -25],
};

interface JurisdictionMapProps {
  countries?: string[];
}

const JurisdictionMap: React.FC<JurisdictionMapProps> = ({ countries }) => {
  if (!countries || countries.length === 0) {
    return (
      <StyledCard>
        <Empty
          description={
            <Text type="secondary">
              No jurisdiction information available for this entity.
              Risk assessment is based on available transaction patterns and entity data.
            </Text>
          }
        />
      </StyledCard>
    );
  }

  return (
    <StyledCard title="Geographic Distribution">
      <Text type="secondary" style={{ marginBottom: '16px', display: 'block' }}>
        This entity operates in {countries.length} {countries.length === 1 ? 'jurisdiction' : 'jurisdictions'}
      </Text>
      <MapContainer>
        <ComposableMap
          width={800}
          height={400}
          projectionConfig={{
            scale: 160,
            center: [0, 0]
          }}
          style={{
            width: '100%',
            height: '100%'
          }}
        >
          <Geographies geography="/world-110m.json">
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey || geo.properties?.name}
                  geography={geo}
                  fill="#E6E6E6"
                  stroke="#D9D9D9"
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>
          {countries.map((country) => {
            const coordinates = countryCoordinates[country];
            if (!coordinates) return null;
            return (
              <Marker key={country} coordinates={coordinates}>
                <circle r={4} fill="#1890FF" stroke="#fff" strokeWidth={2} />
                <text
                  textAnchor="middle"
                  y={-8}
                  style={{
                    fontFamily: 'system-ui',
                    fontSize: '10px',
                    fill: '#1890FF',
                    fontWeight: 500,
                  }}
                >
                  {country}
                </text>
              </Marker>
            );
          })}
        </ComposableMap>
      </MapContainer>
    </StyledCard>
  );
};

export default JurisdictionMap; 