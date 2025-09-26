import { vi, describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as RTL from '@testing-library/react';
const screen = RTL.screen;

import '@testing-library/jest-dom';
import React from 'react';

// Mock the EntityDetails component before importing EntityHeightMeasurer
vi.mock('../../views/RiskDashboard/components/entity-intelligence/EntityDetails', () => ({
  default: ({ name, type }: { name: string; type: string }) =>
    React.createElement('div', { 'data-testid': 'entity-details' }, [
      React.createElement('h4', { key: 'title' }, 'Entity Details'),
      React.createElement('div', { key: 'name' }, `Name: ${name}`),
      React.createElement('div', { key: 'type' }, `Type: ${type}`)
    ])
}));

import EntityHeightMeasurer from '../EntityHeightMeasurer';

describe('EntityHeightMeasurer', () => {
  const mockCustodialProps = {
    name: 'Custodial Entity',
    type: 'Exchange',
    description: 'Test description',
    website: 'https://example.com',
    phone: '123-456-7890',
    address: '123 Main St',
    founded: 2020,
    logo: '',
    countries: ['US'],
    entityId: 'custodial-1',
    email: 'test@example.com',
    twitter: '@test',
    telegram: '@test',
    ensAddress: '',
    legalInfoUrl: '',
    ceo: 'John Doe',
    keyPersonnel: 'Jane Smith',
    ticker: 'TEST',
    parentId: '',
    entityTags: ['tag1'],
    socialMediaProfiles: ['https://twitter.com/test'],
    isCentralized: true,
    noKycRequired: false,
    isDead: false,
    isOfacSanctioned: false,
    note: 'Test note',
    lastUpdated: '2024-01-01',
    lastModifiedBy: 'admin',
    revisitSite: false
  };

  const mockBeneficialOwnerProps = {
    name: 'Beneficial Owner',
    type: 'Individual',
    description: 'Test beneficial owner description',
    website: 'https://beneficial.com',
    phone: '098-765-4321',
    address: '456 Oak Ave',
    founded: 2018,
    logo: '',
    countries: ['CA'],
    entityId: 'beneficial-1',
    email: 'owner@example.com',
    twitter: '@owner',
    telegram: '@owner',
    ensAddress: '',
    legalInfoUrl: '',
    ceo: 'Bob Smith',
    keyPersonnel: 'Alice Johnson',
    ticker: 'OWNER',
    parentId: '',
    entityTags: ['tag2'],
    socialMediaProfiles: ['https://linkedin.com/owner'],
    isCentralized: false,
    noKycRequired: true,
    isDead: false,
    isOfacSanctioned: false,
    note: 'Beneficial owner note',
    lastUpdated: '2024-01-02',
    lastModifiedBy: 'admin',
    revisitSite: false
  };

  it('renders both entity details invisibly', () => {
    render(
      <EntityHeightMeasurer
        custodialProps={mockCustodialProps}
        beneficialOwnerProps={mockBeneficialOwnerProps}
        showToggle={true}
        isBeneficialOwner={false}
        custodialEntityName="Custodial Entity"
        beneficialOwnerName="Beneficial Owner"
      />
    );

    // Should render both entity details
    const entityDetails = screen.getAllByTestId('entity-details');
    expect(entityDetails).toHaveLength(2);
  });

  it('applies invisible positioning classes', () => {
    const { container } = render(
      <EntityHeightMeasurer
        custodialProps={mockCustodialProps}
        beneficialOwnerProps={mockBeneficialOwnerProps}
        showToggle={true}
        isBeneficialOwner={false}
        custodialEntityName="Custodial Entity"
        beneficialOwnerName="Beneficial Owner"
      />
    );

    const measurer = container.firstChild as HTMLElement;
    expect(measurer).toHaveClass('invisible', 'absolute', '-top-[9999px]');
  });

  it('renders custodial entity with correct props', () => {
    render(
      <EntityHeightMeasurer
        custodialProps={mockCustodialProps}
        beneficialOwnerProps={mockBeneficialOwnerProps}
        showToggle={true}
        isBeneficialOwner={false}
        custodialEntityName="Custodial Entity"
        beneficialOwnerName="Beneficial Owner"
      />
    );

    expect(screen.getByText('Name: Custodial Entity')).toBeInTheDocument();
    expect(screen.getByText('Type: Exchange')).toBeInTheDocument();
  });

  it('renders beneficial owner with correct props', () => {
    render(
      <EntityHeightMeasurer
        custodialProps={mockCustodialProps}
        beneficialOwnerProps={mockBeneficialOwnerProps}
        showToggle={true}
        isBeneficialOwner={true}
        custodialEntityName="Custodial Entity"
        beneficialOwnerName="Beneficial Owner"
      />
    );

    expect(screen.getByText('Name: Beneficial Owner')).toBeInTheDocument();
    expect(screen.getByText('Type: Individual')).toBeInTheDocument();
  });
});