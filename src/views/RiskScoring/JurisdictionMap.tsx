import React from 'react';
import { Card, Typography, Empty } from 'antd';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { GlobalOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { colors } from '../../styles/variables';
import { countryCoordinates } from '../../config/country-coordinates';

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

interface JurisdictionMapProps {
  countries?: string[];
}

const JurisdictionMap: React.FC<JurisdictionMapProps> = ({ countries }) => {
  if (!countries || countries.length === 0) {
    return (
      <StyledCard>
        <Empty
          image={<GlobalOutlined style={{ fontSize: 40, color: colors.primary }} />}
          imageStyle={{ height: 40 }}
          description={
            <Text type="secondary" style={{ color: colors.primary }}>
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
                  fill="#2B3847"
                  stroke="#4A5568"
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', fill: '#3B4A5A' },
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
                <circle r={5} fill="#3E8DDD" stroke="#ffffff" strokeWidth={2} />
                <text
                  textAnchor="middle"
                  y={-10}
                  style={{
                    fontFamily: 'system-ui',
                    fontSize: '11px',
                    fill: '#ffffff',
                    fontWeight: 600,
                    textShadow: '0px 0px 5px rgba(0,0,0,0.7)'
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