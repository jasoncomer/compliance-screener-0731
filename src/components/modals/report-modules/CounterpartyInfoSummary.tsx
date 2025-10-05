import React from 'react';
import { Building2, Globe, Mail, MapPin, Calendar, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

import { IComplianceTransaction } from '@/typings/compliance';

interface CounterpartyInfoSummaryProps {
  transaction: IComplianceTransaction;
}

export const CounterpartyInfoSummary: React.FC<CounterpartyInfoSummaryProps> = () => {
  // Mock counterparty data - in real implementation, this would come from the transaction data
  const counterparties = [
    {
      id: '1',
      name: 'Crypto Exchange Ltd',
      type: 'Exchange',
      description: 'A regulated cryptocurrency exchange operating in multiple jurisdictions',
      email: 'compliance@cryptoexchange.com',
      website: 'https://cryptoexchange.com',
      address: '123 Financial District, New York, NY 10004',
      founded: '2018',
      countries: ['United States', 'United Kingdom'],
      logo: null
    },
    {
      id: '2', 
      name: 'Digital Asset Fund',
      type: 'Fund',
      description: 'Institutional digital asset investment fund',
      email: 'info@digitalassetfund.com',
      website: 'https://digitalassetfund.com',
      address: '456 Wall Street, New York, NY 10005',
      founded: '2020',
      countries: ['United States'],
      logo: null
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Building2 className="h-6 w-6 text-blue-500" />
        <div>
          <h3 className="text-lg font-semibold">Counterparty Entities</h3>
          <p className="text-sm text-gray-500">Information about transaction counterparties</p>
        </div>
      </div>

      {counterparties.map((counterparty) => (
        <Card key={counterparty.id}>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {counterparty.name}
                    </h4>
                    <Badge variant="secondary" className="capitalize">
                      {counterparty.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {counterparty.description}
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* Contact Information */}
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">
                      Contact Information
                    </Label>
                    <div className="space-y-2">
                      {counterparty.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {counterparty.email}
                          </span>
                        </div>
                      )}
                      {counterparty.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-gray-400" />
                          <a 
                            href={counterparty.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {counterparty.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                      {counterparty.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {counterparty.address}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Entity Information */}
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">
                      Entity Information
                    </Label>
                    <div className="space-y-2">
                      {counterparty.founded && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            Founded: {counterparty.founded}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          Entity Type: {counterparty.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Jurisdictions */}
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">
                      Operating Jurisdictions
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {counterparty.countries.map((country, countryIndex) => (
                        <Badge 
                          key={countryIndex}
                          variant="outline" 
                          className="text-xs"
                        >
                          {country}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Compliance Status */}
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">
                      Compliance Status
                    </Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                        <span className="text-sm">KYC Verified</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          ✓ Verified
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                        <span className="text-sm">Regulatory Compliance</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          ✓ Compliant
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                        <span className="text-sm">AML Program</span>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                          ⚠ Review Required
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};