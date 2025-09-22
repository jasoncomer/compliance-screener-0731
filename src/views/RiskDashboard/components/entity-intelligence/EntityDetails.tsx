import React from 'react';
import { UserOutlined, GlobalOutlined, TwitterOutlined, SendOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined, WarningOutlined, TagOutlined, TeamOutlined, CalendarOutlined, LinkOutlined, DatabaseOutlined, CompassOutlined, FileTextOutlined } from '@ant-design/icons';
import { useTheme } from '../../../../context/ThemeContext';
import { SimpleLogo } from '../../../../components/common/Logo';
import EntityToggle from '../../../../components/EntityToggle';

interface EntityDetailsProps {
  name: string;
  type: string;
  description: string;
  website: string;
  phone: string;
  address: string;
  founded: number;
  logo: string;
  countries: string[];
  // Additional fields
  entityId?: string;
  email?: string;
  twitter?: string;
  telegram?: string;
  ensAddress?: string;
  legalInfoUrl?: string;
  ceo?: string;
  keyPersonnel?: string;
  ticker?: string;
  parentId?: string;
  entityTags?: string[];
  socialMediaProfiles?: string[];
  isCentralized?: boolean;
  noKycRequired?: boolean;
  isDead?: boolean;
  isOfacSanctioned?: boolean;
  note?: string;
  lastUpdated?: string;
  lastModifiedBy?: string;
  revisitSite?: boolean;
  // Toggle functionality
  showToggle?: boolean;
  isBeneficialOwner?: boolean;
  onToggle?: (isBeneficialOwner: boolean) => void;
  custodialEntityName?: string;
  beneficialOwnerName?: string;
}

const EntityDetails: React.FC<EntityDetailsProps> = ({
  name,
  type,
  description,
  website,
  phone,
  address,
  founded,
  countries,
  entityId,
  email,
  twitter,
  telegram,
  ensAddress,
  legalInfoUrl,
  ceo,
  keyPersonnel,
  entityTags = [],
  socialMediaProfiles = [],
  isCentralized,
  noKycRequired,
  isDead,
  isOfacSanctioned,
  note,
  lastUpdated,
  lastModifiedBy,
  revisitSite,
  showToggle = false,
  isBeneficialOwner = false,
  onToggle,
  custodialEntityName,
  beneficialOwnerName
}) => {
  const { theme } = useTheme();

  // Check if we have meaningful entity data
  const hasEntityData = name && name !== "Unknown Entity";

  if (!hasEntityData) {
    return (
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
    );
  }

  const getSocialMediaIcon = (url: string) => {
    const urlLower = url.toLowerCase();
    if (urlLower.includes('github')) return <LinkOutlined />;
    if (urlLower.includes('twitter')) return <TwitterOutlined />;
    if (urlLower.includes('linkedin')) return <LinkOutlined />;
    if (urlLower.includes('facebook')) return <LinkOutlined />;
    if (urlLower.includes('instagram')) return <LinkOutlined />;
    if (urlLower.includes('youtube')) return <LinkOutlined />;
    if (urlLower.includes('reddit')) return <LinkOutlined />;
    return <LinkOutlined />;
  };

  return (
    <>
      <h4 className={`text-xl font-semibold mb-6 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>Entity Details</h4>
      {/* Header with logo and name */}
      <div className="flex items-center mb-6">
        <div className="mr-4">
          <SimpleLogo
            entityId={entityId}
            entityType={type}
            size="large"
            shape="circle"
          />
        </div>
        <div className="flex-1">
          <div className={`font-semibold text-lg ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>{name}</div>
          <div className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>{type}</div>
        </div>
        {/* View in VASP Explorer Button */}
        {entityId && (
          <button
            onClick={() => window.open(`/home/blockham?entity=${entityId}`, '_blank')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors bg-orange-500 hover:bg-orange-600 text-white shadow-sm`}
          >
            <DatabaseOutlined className="mr-1" />
            VASP Explorer
          </button>
        )}
      </div>
      
      {/* Entity Toggle - Show when both custodial entity and beneficial owner exist */}
      {showToggle && onToggle && (
        <div className="mb-6">
          <EntityToggle
            isBeneficialOwner={isBeneficialOwner}
            onToggle={onToggle}
            custodialEntityName={custodialEntityName}
            beneficialOwnerName={beneficialOwnerName}
          />
        </div>
      )}
      
      {/* Status Indicators */}
      {(isOfacSanctioned || isDead || isCentralized !== undefined || noKycRequired) && (
        <div className="mb-1 p-1">
          <div className="space-y-2">
            {isOfacSanctioned && (
              <div className="flex items-center text-red-600 dark:text-red-400">
                <WarningOutlined className="mr-2" />
                <span className="text-sm font-medium">OFAC SANCTIONED</span>
              </div>
            )}
            {isDead && (
              <div className="flex items-center text-red-600 dark:text-red-400">
                <WarningOutlined className="mr-2" />
                <span className="text-sm">Entity likely inactive or does not support Crypto</span>
              </div>
            )}
            {noKycRequired && (
              <div className="flex items-center text-orange-600 dark:text-orange-400">
                <WarningOutlined className="mr-2" />
                <span className="text-sm font-medium">NO KYC REQUIRED</span>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="space-y-4">
        {/* Entity ID */}
        {entityId && (
          <div className={`text-sm ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <span className={`font-medium ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            }`}>Entity ID:</span> {entityId}
          </div>
        )}
           
            {/* Associated Countries */}
            {countries.length > 0 && (
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <span className={`font-medium flex items-center ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  <CompassOutlined className="mr-1" />
                  Associated Countries:
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {countries.map(country => 
                    <span key={country} className={`px-2 py-1 rounded text-xs ${
                      theme === 'dark' 
                        ? 'bg-gray-700 text-gray-300' 
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {country}
                    </span>
                  )}
                </div>
              </div>
            )}


        {/* Description */}
        {description && (
          <div className={`text-sm ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <span className={`font-medium flex items-center ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            }`}>
              <FileTextOutlined className="mr-1" />
              Description:
            </span>
            <div className="mt-1 pl-4">
              {description}
            </div>
          </div>
        )}

        {/* Two Column Layout for Lower Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Leadership */}
            {(ceo || keyPersonnel) && (
              <div className={`text-sm mt-6 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <span className={`font-medium flex items-center ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  <TeamOutlined className="mr-1" />
                  Leadership:
                </span>
                <div className="ml-4 mt-1 space-y-1">
                  {ceo && <div>CEO: {ceo}</div>}
                  {keyPersonnel && (
                    <div>
                      Key Personnel: {keyPersonnel.split(',').map(person => 
                        <span key={person.trim()} className={`inline-block px-2 py-1 rounded text-xs mr-1 mb-1 ${
                          theme === 'dark' 
                            ? 'bg-gray-700 text-gray-300' 
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {person.trim()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contact Information */}
            {(website || email || phone || address || ensAddress) && (
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <span className={`font-medium ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}>Contact Information:</span>
                <div className="ml-4 mt-1 space-y-1">
                  {website && (
                    <div className="flex items-center">
                      <GlobalOutlined className="mr-2" />
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
                  {email && (
                    <div className="flex items-center">
                      <MailOutlined className="mr-2" />
                      <a 
                        href={`mailto:${email}`}
                        className="text-brand-primary hover:text-brand-primary/80 transition-colors"
                      >
                        {email}
                      </a>
                    </div>
                  )}
                  {phone && (
                    <div className="flex items-center">
                      <PhoneOutlined className="mr-2" />
                      {phone}
                    </div>
                  )}
                  {address && (
                    <div className="flex items-center">
                      <EnvironmentOutlined className="mr-2" />
                      {address}
                    </div>
                  )}
                  {ensAddress && (
                    <div className="flex items-center">
                      <LinkOutlined className="mr-2" />
                      ENS: {ensAddress}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Social Media */}
            {(twitter || telegram || socialMediaProfiles.length > 0) && (
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <span className={`font-medium ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}>Social Media:</span>
                <div className="ml-4 mt-1 space-y-1">
                  {twitter && (
                    <div className="flex items-center">
                      <TwitterOutlined className="mr-2" />
                      <a 
                        href={`https://twitter.com/${twitter.replace('@', '')}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-brand-primary hover:text-brand-primary/80 transition-colors"
                      >
                        {twitter}
                      </a>
                    </div>
                  )}
                  {telegram && (
                    <div className="flex items-center">
                      <SendOutlined className="mr-2" />
                      <a 
                        href={`https://t.me/${telegram.replace('@', '')}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-brand-primary hover:text-brand-primary/80 transition-colors"
                      >
                        {telegram}
                      </a>
                    </div>
                  )}
                  {socialMediaProfiles.map((profile, index) => (
                    <div key={index} className="flex items-center">
                      {getSocialMediaIcon(profile)}
                      <a 
                        href={profile.startsWith('http') ? profile : `https://${profile}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-brand-primary hover:text-brand-primary/80 transition-colors ml-2"
                      >
                        {profile}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Additional Information */}
            {(founded > 0) && (
              <div className={`text-sm mt-6 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <span className={`font-medium ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}>Additional Information:</span>
                <div className="ml-4 mt-1 space-y-1">
                  {founded > 0 && (
                    <div className="flex items-center">
                      <CalendarOutlined className="mr-2" />
                      Founded: {founded}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Entity Tags */}
            {entityTags.length > 0 && (
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <span className={`font-medium flex items-center ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  <TagOutlined className="mr-1" />
                  Entity Tags:
                </span>
                <div className="ml-4 mt-1 flex flex-wrap gap-1">
                  {entityTags.map((tag, index) => (
                    <span key={index} className={`px-2 py-1 rounded text-xs ${
                      theme === 'dark' 
                        ? 'bg-gray-700 text-gray-300' 
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Legal Information */}
            {legalInfoUrl && (
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <span className={`font-medium ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}>Legal Information:</span>
                <div className="ml-4 mt-1">
                  <a 
                    href={legalInfoUrl}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-brand-primary hover:text-brand-primary/80 transition-colors flex items-center"
                  >
                    <GlobalOutlined className="mr-2" />
                    View Legal Information
                  </a>
                </div>
              </div>
            )}

            {/* Notes */}
            {note && (
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <span className={`font-medium ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}>Notes:</span> {note}
              </div>
            )}
          </div>
        </div>

        {/* Metadata - Full Width */}
        {(lastModifiedBy || lastUpdated || revisitSite) && (
          <div className={`text-xs ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          } mt-4 pt-3 border-t ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            {lastModifiedBy && <div>Last modified by: {lastModifiedBy}</div>}
            {lastUpdated && <div>Updated: {new Date(lastUpdated).toLocaleString()}</div>}
            {revisitSite && <div>Flagged for review</div>}
          </div>
        )}
      </div>
    </>
  );
};

export default EntityDetails; 