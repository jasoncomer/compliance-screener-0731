import React, { useMemo, useState } from 'react';

import { FacebookOutlined, GithubOutlined, GlobalOutlined, InstagramOutlined, LinkedinOutlined, MediumOutlined, RedditOutlined, SendOutlined, TwitterOutlined, UserOutlined, WarningOutlined,YoutubeOutlined } from '@ant-design/icons';
import { message, Modal } from 'antd';
import { useSelector } from 'react-redux';

// Design system tokens available if needed

import { api } from '../api/api';
import { RootState } from '../store/store';
import { SOT } from '../typings/interfaces';
import { EEntityType } from '../typings/SOT';
import { getEntityTypeLabel } from '../utils/display-labels';
import { renderTextWithLinks } from '../utils/urls';

// Input component now using design system Input
import { SimpleLogo } from './common/Logo';
import EntitySidebar from './EntitySidebar/index';
import EntityBalanceSheet from './EntityBalanceSheet';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';



// Typography components removed - using native HTML elements with Tailwind classes

import { cn } from '@/design-system/utils';

// Form Field Component using design system
interface FormFieldProps {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({ label, name, required, error, children, className }) => (
  <div className={cn("space-y-2", className)}>
    <label 
      htmlFor={name}
      className={cn(
        "block text-sm font-medium",
        "text-gray-900 dark:text-white",
        error && "text-red-600 dark:text-red-400"
      )}
    >
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-sm text-red-600 dark:text-red-400">
        {error}
      </p>
    )}
  </div>
);

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

const Container: React.FC<ContainerProps> = ({ children, className }) => (
  <div className={cn("w-full flex flex-row gap-6 mt-4 flex-1 min-h-0", className)}>
    {children}
  </div>
);

interface EditorWrapperProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const EditorWrapper: React.FC<EditorWrapperProps> = ({ children, className, style }) => (
  <Card className={cn("flex-1 min-w-0 p-6", className)} style={style}>
    {children}
  </Card>
);

interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({ children, className }) => (
  <div className={cn("flex gap-3 mt-6", className)}>
    {children}
  </div>
);

interface DetailSectionProps {
  children: React.ReactNode;
  className?: string;
}

const DetailSection: React.FC<DetailSectionProps> = ({ children, className }) => (
  <div className={cn("flex gap-6 text-left", className)}>
    {children}
  </div>
);

interface DetailColumnProps {
  children: React.ReactNode;
  className?: string;
}

const DetailColumn: React.FC<DetailColumnProps> = ({ children, className }) => (
  <div className={cn("flex flex-col gap-3 flex-1", className)}>
    {children}
  </div>
);

interface DetailItemProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const DetailItem: React.FC<DetailItemProps> = ({ children, className, style }) => (
  <div className={cn("mb-4", className)} style={style}>
    {children}
  </div>
);

interface DetailLabelProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const DetailLabel: React.FC<DetailLabelProps> = ({ children, className, style }) => (
  <label className={cn("block text-gray-600 dark:text-gray-300 mb-1 text-base text-left font-medium", className)} style={style}>
    {children}
  </label>
);

interface DetailValueProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const DetailValue: React.FC<DetailValueProps> = ({ children, className, style }) => (
  <div className={cn(
    "text-base flex items-start gap-2 text-left text-gray-900 dark:text-gray-100",
    className
  )} style={style}>
    {children}
  </div>
);

interface HeaderSectionProps {
  children: React.ReactNode;
  className?: string;
}

const HeaderSection: React.FC<HeaderSectionProps> = ({ children, className }) => (
  <div className={cn("flex items-center gap-4 mb-4 text-left", className)}>
    {children}
  </div>
);

interface HeaderInfoProps {
  children: React.ReactNode;
  className?: string;
}

const HeaderInfo: React.FC<HeaderInfoProps> = ({ children, className }) => (
  <div className={cn("flex-1 capitalize text-left", className)}>
    {children}
  </div>
);



interface SanctionedPillProps {
  children: React.ReactNode;
  className?: string;
}

const SanctionedPill: React.FC<SanctionedPillProps> = ({ children, className }) => (
  <div className={cn(
    "inline-flex items-center bg-danger text-white",
    "px-3 py-1.5 rounded-2xl text-xs font-bold mt-2 mb-3 w-auto",
    "shadow-md gap-1.5",
    className
  )}>
    {children}
  </div>
);

interface ScrollableSocialLinksProps {
  children: React.ReactNode;
  className?: string;
}

const ScrollableSocialLinks: React.FC<ScrollableSocialLinksProps> = ({ children, className }) => (
  <div className={cn("max-h-25 overflow-y-auto", className)}>
    {children}
  </div>
);

interface ScrollableWebsiteLinksProps {
  children: React.ReactNode;
  className?: string;
}

const ScrollableWebsiteLinks: React.FC<ScrollableWebsiteLinksProps> = ({ children, className }) => (
  <div className={cn("max-h-25 overflow-y-auto flex flex-col gap-0 pr-1", className)}>
    {children}
  </div>
);

interface SOTEditorProps {
  sot: SOT | null;
  onSelectAssociatedSot: (sot: SOT) => void;
}

const ToggleSwitch = ({ name, label, defaultValue }: { name: string; label: string; defaultValue?: boolean }) => (
  <FormField 
    label={label}
    name={name}
  >
    <div className="flex justify-between items-end">
      <span>{/* Empty span to maintain spacing */}</span>
      <Switch 
        id={name}
        name={name}
        defaultChecked={defaultValue || false}
      />
    </div>
  </FormField>
);

const SOTEditor: React.FC<SOTEditorProps> = ({ sot, onSelectAssociatedSot }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { itemsMap } = useSelector((state: RootState) => state.sot);
  const [hasRelatedEntities] = useState(false);

  const isValidSOT = (sot: SOT | null): sot is SOT => {
    return sot !== null;
  };

  // Check if there are any associated entities
  const associatedSotItems = useMemo(() => {
    if (!sot || !Object.keys(sot).length) return [];

    const isParent = (item: SOT) => item.parent_id === sot.entity_id;
    const isChild = (item: SOT) => item.entity_id === sot.parent_id;

    const associatedSots = Object.values(itemsMap).filter(item => isParent(item) || isChild(item));

    return associatedSots;
  }, [sot, itemsMap]);

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!isValidSOT(sot)) return;
    
    Modal.confirm({
      title: 'Save Changes',
      content: 'Are you sure you want to save these changes?',
      onOk: async () => {
        try {
          setLoading(true);
          
          // Get form data from the form element
          const formElement = document.querySelector('form');
          if (!formElement) return;
          
          const formData = new FormData(formElement);
          const values: Record<string, any> = {};
          
          // Convert FormData to object
          for (const [key, value] of formData.entries()) {
            values[key] = value;
          }
          
          // Handle checkbox values (switches)
          const switches = formElement.querySelectorAll('input[type="checkbox"]');
          switches.forEach((switchEl) => {
            const input = switchEl as HTMLInputElement;
            values[input.name] = input.checked;
          });
          
          await api.sot.updateSOT(sot._id, values);
          setIsEditing(false);
          message.success('SOT updated successfully');
        } catch (error) {
          console.error('Failed to update SOT:', error);
          message.error('Failed to update SOT');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const getSocialMediaIcon = (url: string) => {
    const urlLower = url.toLowerCase();

    if (urlLower.includes('github')) return <GithubOutlined />;
    if (urlLower.includes('twitter')) return <TwitterOutlined />;
    if (urlLower.includes('linkedin')) return <LinkedinOutlined />;
    if (urlLower.includes('facebook')) return <FacebookOutlined />;
    if (urlLower.includes('instagram')) return <InstagramOutlined />;
    if (urlLower.includes('youtube')) return <YoutubeOutlined />;
    if (urlLower.includes('reddit')) return <RedditOutlined />;
    if (urlLower.includes('medium')) return <MediumOutlined />;
    if (urlLower.includes('telegram')) return <SendOutlined />;

    return <GlobalOutlined />;
  };

  const renderContent = () => {
    if (!isValidSOT(sot)) return null;

    // Check if entity is an individual person
    // const isIndividualPerson = sot.entity_type?.toLowerCase() === EEntityType.INDIVIDUAL_PERSON;

    const isOfacSanctioned = sot.ofac === true;

    if (isEditing) {
      return (
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <FormField 
                label="Company Name"
                name="proper_name"
                required
              >
                <Input 
                  id="proper_name"
                  defaultValue={sot.proper_name || ''}
                />
              </FormField>
              <FormField 
                label="Entity ID"
                name="entity_id"
                required
              >
                <Input 
                  id="entity_id"
                  defaultValue={sot.entity_id || ''}
                />
              </FormField>
              <FormField 
                label="Entity Type"
                name="entity_type"
              >
                <Input 
                  id="entity_type"
                  defaultValue={sot.entity_type || ''}
                />
              </FormField>
              <FormField 
                label="CEO"
                name="ceo"
              >
                <Input 
                  id="ceo"
                  defaultValue={sot.ceo || ''}
                />
              </FormField>
              <FormField 
                label="Key Personnel"
                name="key_personnel"
              >
                <Input 
                  id="key_personnel"
                  placeholder="Comma-separated list of key personnel"
                  defaultValue={sot.key_personnel || ''}
                />
              </FormField>
              <FormField 
                label="Ticker"
                name="ticker"
              >
                <Input 
                  id="ticker"
                  placeholder="Comma-separated list of tickers"
                  defaultValue={sot.ticker || ''}
                />
              </FormField>
              <FormField 
                label="Parent ID"
                name="parent_id"
              >
                <Input 
                  id="parent_id"
                  defaultValue={sot.parent_id || ''}
                />
              </FormField>
              <FormField 
                label="Year Founded"
                name="year_founded"
              >
                <Input 
                  id="year_founded"
                  defaultValue={sot.year_founded || ''}
                />
              </FormField>
              <FormField 
                label="ENS Address"
                name="ens_address"
              >
                <Input 
                  id="ens_address"
                  defaultValue={sot.ens_address || ''}
                />
              </FormField>
              <FormField 
                label="Social Media"
                name="social_media_profile"
              >
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((num) => (
                    <Input 
                      key={`social_media_profile${num === 1 ? '' : '_' + num}`}
                      id={`social_media_profile${num === 1 ? '' : '_' + num}`}
                      name={`social_media_profile${num === 1 ? '' : '_' + num}`}
                      placeholder={`Social Media Profile ${num}`}
                      defaultValue={sot[`social_media_profile${num === 1 ? '' : '_' + num}` as keyof SOT] as string || ''}
                    />
                  ))}
                </div>
              </FormField>

              <ToggleSwitch name="no_kyc_req" label="No KYC Required" defaultValue={sot.no_kyc_req || false} />
              <ToggleSwitch name="dead" label="Dead" defaultValue={sot.dead || false} />
              <ToggleSwitch name="centralized" label="Centralized" defaultValue={sot.centralized || false} />
              <ToggleSwitch name="revisit_site" label="Revisit Site" defaultValue={sot.revisit_site || false} />

              <FormField 
                label="Legal Info URL"
                name="legal_info_url"
              >
                <Input 
                  id="legal_info_url"
                  defaultValue={sot.legal_info_url || ''}
                />
              </FormField>
              <FormField 
                label="User"
                name="user"
              >
                <Input 
                  id="user"
                  defaultValue={sot.user || ''}
                />
              </FormField>
              <FormField 
                label="Date Updated"
                name="date_updated"
              >
                <Input 
                  id="date_updated"
                  defaultValue={sot.date_updated || ''}
                />
              </FormField>
            </div>

            <div className="space-y-4">
              <FormField 
                label="Website"
                name="url"
              >
                <Input 
                  id="url"
                  defaultValue={sot.url || ''}
                />
              </FormField>
              <FormField 
                label="Phone"
                name="contact_phone"
              >
                <Input 
                  id="contact_phone"
                  defaultValue={sot.contact_phone || ''}
                />
              </FormField>
              <FormField 
                label="Address"
                name="contact_address"
              >
                <Input 
                  id="contact_address"
                  defaultValue={sot.contact_address || ''}
                />
              </FormField>
              <FormField 
                label="Twitter"
                name="contact_twitter"
              >
                <Input 
                  id="contact_twitter"
                  defaultValue={sot.contact_twitter || ''}
                />
              </FormField>
              <FormField 
                label="Telegram"
                name="contact_telegram"
              >
                <Input 
                  id="contact_telegram"
                  defaultValue={sot.contact_telegram || ''}
                />
              </FormField>
              <FormField 
                label="Email"
                name="contact_email"
              >
                <Input 
                  id="contact_email"
                  type="email"
                  defaultValue={sot.contact_email || ''}
                />
              </FormField>

              {/* Associated Countries */}
              <FormField 
                label="Associated Countries"
                name="associated_countries"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <div key={`country_${num}`}>
                      <Input 
                        id={`associate_country_${num}`}
                        name={`associate_country_${num}`}
                        placeholder={`Country ${num}`}
                        defaultValue={sot[`associate_country_${num}` as keyof SOT] as string || ''}
                      />
                    </div>
                  ))}
                </div>
              </FormField>

              <FormField 
                label="Logo"
                name="logo"
              >
                <SimpleLogo
                  entityId={sot.entity_id}
                  entityType={sot.entity_type}
                  size="large"
                />
              </FormField>

              <FormField 
                label="Entity Tags"
                name="entity_tags"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <div key={`tag_${num}`}>
                      <Input 
                        id={`entity_tag${num}`}
                        name={`entity_tag${num}`}
                        placeholder={`Tag ${num}`}
                        defaultValue={sot[`entity_tag${num}` as keyof SOT] as string || ''}
                      />
                    </div>
                  ))}
                </div>
              </FormField>

              <FormField 
                label="Description"
                name="description_merged"
              >
                <Textarea 
                  id="description_merged"
                  name="description_merged"
                  rows={6}
                  defaultValue={sot.description_merged || ''}
                />
              </FormField>

              <FormField 
                label="Notes"
                name="note"
              >
                <Textarea 
                  id="note"
                  name="note"
                  rows={4}
                  defaultValue={sot.note || ''}
                />
              </FormField>
            </div>
          </div>

          <ButtonGroup>
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </ButtonGroup>
        </form>
      );
    }

    return (
      <>
        <HeaderSection>
          <SimpleLogo
            entityId={sot.entity_id}
            entityType={sot.entity_type}
            size="large"
            fallbackIcon={<UserOutlined />}
          />
          <HeaderInfo>
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{sot.proper_name || sot.entity_id}</h4>
            <div className="block mb-1">
              <span className="text-sm text-gray-600 dark:text-gray-400">{getEntityTypeLabel(sot.entity_type as EEntityType)}</span>
            </div>

            {isOfacSanctioned && (
              <SanctionedPill>
                <WarningOutlined />
                THIS ENTITY IS SANCTIONED BY OFAC
              </SanctionedPill>
            )}
            <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sot.dead && (
                <span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    Entity likely inactive or does not support Crypto
                  </span>
                </span>
              )}
              {sot.centralized === false && (
                <span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400 mb-0">
                    Decentralized Entity
                  </span>
                </span>
              )}
              {sot.no_kyc_req && (
                <span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400 mt-0">
                    NO KYC REQUIRED
                  </span>
                </span>
              )}
            </div>
          </HeaderInfo>
        </HeaderSection>

        <DetailSection>
          {/* Left Column */}
          <DetailColumn>
            {/* Entity ID */}
            <DetailItem>
              <DetailLabel>Entity ID</DetailLabel>

              <DetailValue>
                <span>{sot.entity_id}</span>
              </DetailValue>
            </DetailItem>

            {/* Leadership */}
            {(sot.ceo || sot.key_personnel) && (
              <DetailItem>
                <DetailLabel>Leadership</DetailLabel>
                <DetailValue style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sot.ceo && <span><strong>CEO:</strong> {sot.ceo}</span>}
                  {sot.key_personnel && (
                    <span>
                      <strong>Key Personnel:</strong>{' '}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {sot.key_personnel.split(',').map(person =>
                          <Badge key={person.trim()} variant="secondary" className="mr-1 mb-1">{person.trim()}</Badge>
                        )}
                      </div>
                    </span>
                  )}
                </DetailValue>
              </DetailItem>
            )}
            {/* Description */}
            {sot.description_merged && (
              <DetailItem>
                <DetailLabel>Description</DetailLabel>
                <DetailValue style={{ display: 'block', whiteSpace: 'pre-wrap', width: '70%', wordBreak: 'break-word' }}>
                  {renderTextWithLinks(sot.description_merged)}
                </DetailValue>
              </DetailItem>
            )}

            {/* Contact Information */}
            {(sot.contact_email || sot.contact_phone || sot.contact_address || sot.ens_address) && (
              <DetailItem>
                <DetailLabel>Contact Information</DetailLabel>
                <DetailValue style={{ display: 'flex', flexDirection: 'column', width: '70%', gap: '8px' }}>
                  {sot.contact_email && <span><strong>Email:</strong> {sot.contact_email}</span>}
                  {sot.contact_phone && <span><strong>Phone:</strong> {sot.contact_phone}</span>}
                  {sot.contact_address && <span><strong>Address:</strong> {sot.contact_address}</span>}
                  {sot.ens_address && <span><strong>ENS Address:</strong> {sot.ens_address}</span>}
                  {sot.legal_info_url && (
                    <span style={{ marginTop: '48px', display: 'block' }}>
                      <strong>Legal Info: </strong>
                      <a 
                        href={sot.legal_info_url?.startsWith('http') ? sot.legal_info_url : `https://${sot.legal_info_url}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#e87e4f] hover:text-[#d6693a] dark:text-[#e87e4f] dark:hover:text-[#d6693a] transition-colors"
                      >
                        <GlobalOutlined /> View Legal Information
                      </a>
                    </span>
                  )}
                </DetailValue>
              </DetailItem>
            )}


            {/* Metadata - moved to bottom of left column */}
            {(sot.user || sot.date_updated || sot.revisit_site) && (
              <DetailItem style={{ fontSize: '0.9em', color: '#666', marginTop: '0px' }}>
                {sot.user && <div>Last modified by: {sot.user}</div>}
                {sot.date_updated && <div>Updated: {new Date(sot.date_updated).toLocaleString()}</div>}
                {sot.revisit_site && <div>Flagged for review</div>}
              </DetailItem>
            )}
          </DetailColumn>

          {/* Right Column */}
          <DetailColumn>
            {/* Websites */}
            {(() => {
              // Collect all unique URLs for this entity_id from all SOTs
              const allSots = Object.values(itemsMap).filter(item => item.entity_id === sot.entity_id);
              const allUrls = Array.from(new Set(allSots.map(item => item.url).filter(Boolean)));
              if (allUrls.length === 0) return null;
              return (
                <DetailItem>
                  <DetailLabel>Websites</DetailLabel>
                  <DetailValue style={{ display: 'flex', flexDirection: 'column', width: '70%', gap: '8px' }}>
                    <ScrollableWebsiteLinks>
                      {allUrls.map((url, idx) => (
                        <a 
                          key={idx} 
                          href={url.startsWith('http') ? url : `https://${url}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#e87e4f] hover:text-[#d6693a] dark:text-[#e87e4f] dark:hover:text-[#d6693a] transition-colors"
                        >
                          <GlobalOutlined style={{ marginRight: 4 }} />
                          {url}
                        </a>
                      ))}
                    </ScrollableWebsiteLinks>
                  </DetailValue>
                </DetailItem>
              );
            })()}

            {/* Social Media Profiles */}
            {(sot.contact_twitter || sot.contact_telegram ||
              Object.entries(sot).some(([key, value]) => key.startsWith('social_media_profile') && value)) && (
                <DetailItem>
                  <DetailLabel>Social Media Profiles</DetailLabel>
                  <DetailValue style={{ display: 'block' }}>
                    {(() => {
                      // Count total social media links
                      const socialMediaCount = [
                        sot.contact_twitter,
                        sot.contact_telegram,
                        ...Object.entries(sot)
                          .filter(([key, value]) => key.startsWith('social_media_profile') && value)
                          .map(([_, value]) => value)
                      ].filter(Boolean).length;

                      // Determine if we need a scrollable container
                      const needsScroll = socialMediaCount > 5;

                      // Create array of all social media links components
                      const socialMediaLinks = [];

                      // Add Twitter link
                      if (sot.contact_twitter) {
                        socialMediaLinks.push(
                          <a
                            key="twitter"
                            href={`https://twitter.com/${sot.contact_twitter.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            className="text-[#e87e4f] hover:text-[#d6693a] dark:text-[#e87e4f] dark:hover:text-[#d6693a] transition-colors"
                          >
                            <TwitterOutlined />
                            <span>{sot.contact_twitter}</span>
                          </a>
                        );
                      }

                      // Add Telegram link
                      if (sot.contact_telegram) {
                        socialMediaLinks.push(
                          <a
                            key="telegram"
                            href={`https://t.me/${sot.contact_telegram.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            className="text-[#e87e4f] hover:text-[#d6693a] dark:text-[#e87e4f] dark:hover:text-[#d6693a] transition-colors"
                          >
                            <SendOutlined />
                            <span>{sot.contact_telegram}</span>
                          </a>
                        );
                      }

                      // Add other social media profile links
                      Object.entries(sot)
                        .filter(([key, value]) => key.startsWith('social_media_profile') && value)
                        .forEach(([key, value]) => {
                          const icon = getSocialMediaIcon(value);
                          const url = value.startsWith('http') ? value : `https://${value}`;

                          socialMediaLinks.push(
                            <a
                              key={key}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                              className="text-[#e87e4f] hover:text-[#d6693a] dark:text-[#e87e4f] dark:hover:text-[#d6693a] transition-colors"
                            >
                              {icon}
                              <span>{value}</span>
                            </a>
                          );
                        });

                      // Render links in scrollable container if needed
                      if (needsScroll) {
                        return (
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
                              {socialMediaCount} profiles available (scroll to view all)
                            </p>
                            <ScrollableSocialLinks>
                              {socialMediaLinks}
                            </ScrollableSocialLinks>
                          </div>
                        );
                      }

                      // Otherwise render normally
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {socialMediaLinks}
                        </div>
                      );
                    })()}
                  </DetailValue>
                </DetailItem>
              )}
            {/* Additional Information */}
            {(sot.year_founded || sot.ticker || sot.parent_id ||
              Object.entries(sot).some(([key, value]) => key.startsWith('associate_country_') && value) ||
              sot.legal_info_url) && (
                <>
                  <DetailItem>
                    <DetailLabel style={{ marginTop: '24px' }}>Additional Information</DetailLabel>
                    <DetailValue style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {sot.year_founded && <span><strong>Founded:</strong> {sot.year_founded}</span>}
                      {sot.ticker && (
                        <span>
                          <strong>Ticker:</strong>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                            {sot.ticker.split(',').map(t =>
                              <Badge key={t.trim()} variant="outline" className="mr-1 mb-1">{t.trim()}</Badge>
                            )}
                          </div>
                        </span>
                      )}
                      {sot.parent_id && <span><strong>Parent ID:</strong> {sot.parent_id}</span>}

                      {/* Associated Countries */}
                      {Object.entries(sot)
                        .filter(([key, value]) => key.startsWith('associate_country_') && value)
                        .length > 0 && (
                          <span>
                            <strong>Associated Countries:</strong>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                              {Object.entries(sot)
                                .filter(([key, value]) => key.startsWith('associate_country_') && value)
                                .map(([key, value]) => (
                                  <Badge key={key} variant="secondary" className="mr-1 mb-1">{value}</Badge>
                                ))}
                            </div>
                          </span>
                        )}
                    </DetailValue>
                  </DetailItem>
                  <DetailItem style={{ marginTop: 0, marginBottom: 0 }}>
                    {(() => {
                      const balanceSheet = <EntityBalanceSheet currentEntityId={sot.entity_id} />;
                      return balanceSheet ? (
                        <>
                          <DetailLabel style={{ marginBottom: 0 }}>{sot.proper_name} Balances:</DetailLabel>
                          {balanceSheet}
                        </>
                      ) : null;
                    })()}
                  </DetailItem>
                </>
              )}
          </DetailColumn>
        </DetailSection>
      </>
    );
  };

  return (
    <Container>
      <EditorWrapper style={{ flex: associatedSotItems.length === 0 && !hasRelatedEntities ? '1 1 100%' : '1' }}>
        {renderContent()}
      </EditorWrapper>

      {/* Unified sidebar for associated entities, parent, custodian, and beneficial owner */}
      <div className="w-66 flex-shrink-0 h-full">
        <EntitySidebar
          associatedSots={associatedSotItems}
          currentEntityId={sot?.entity_id}
          onSelectSot={onSelectAssociatedSot}
        />
      </div>
    </Container>
  );
};

export default SOTEditor; 