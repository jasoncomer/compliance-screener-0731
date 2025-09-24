import React from 'react';

import { Globe, Send, Twitter, User, X } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { SOT } from '@/typings/interfaces';
import { EEntityType } from '@/typings/SOT';
import { getEntityTypeLabel } from '@/utils/display-labels';
import { RootState } from '@/store/store';
import { useSelector } from 'react-redux';

interface EntityQuickViewModalProps {
  isVisible: boolean;
  onClose: () => void;
  entityId: string | null;
}

export const EntityQuickViewModal: React.FC<EntityQuickViewModalProps> = ({
  isVisible,
  onClose,
  entityId,
}) => {
  const { itemsMap: sotMap } = useSelector((state: RootState) => state.sot);

  if (!isVisible || !entityId) {
    return null;
  }

  const sot = sotMap[entityId] || null;

  if (!sot) {
    return (
      <Dialog open={isVisible} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Entity Details</span>
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            No entity data available for ID: {entityId}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const renderEntityTags = () => {
    const tags = [];
    for (let i = 1; i <= 7; i++) {
      const tag = sot[`entity_tag${i}` as keyof SOT];
      if (tag && typeof tag === 'string' && tag.trim() !== '') {
        tags.push(
          <span
            key={i}
            className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          >
            {tag}
          </span>
        );
      }
    }
    return tags.length > 0 ? tags : <span className="text-gray-500 dark:text-gray-400">None</span>;
  };

  const renderAssociatedCountries = () => {
    const countries = [];
    for (let i = 1; i <= 6; i++) {
      const country = sot[`associate_country_${i}` as keyof SOT];
      if (country && typeof country === 'string' && country.trim() !== '') {
        countries.push(
          <span
            key={i}
            className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
          >
            {country}
          </span>
        );
      }
    }
    return countries.length > 0 ? countries : <span className="text-gray-500 dark:text-gray-400">None</span>;
  };

  return (
    <Dialog open={isVisible} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              {sot.logo ? (
                <img
                  src={sot.logo}
                  alt={sot.proper_name || entityId}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="flex items-center justify-center w-full h-full"><svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>`;
                    }
                  }}
                />
              ) : (
                <User className="w-5 h-5 text-gray-500" />
              )}
            </div>
            <span className="text-xl font-semibold text-gray-900 dark:text-white">
              {sot.proper_name || entityId}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-4">
          {/* Entity Type */}
          <div className="flex">
            <span className="w-36 text-sm font-medium text-gray-600 dark:text-gray-400">Entity Type:</span>
            <span className="flex-1 text-sm text-gray-900 dark:text-white">
              {sot.entity_type ? getEntityTypeLabel(sot.entity_type as EEntityType) : 'Unknown'}
            </span>
          </div>

          {/* Website */}
          {sot.url && (
            <div className="flex">
              <span className="w-36 text-sm font-medium text-gray-600 dark:text-gray-400">Website:</span>
              <a
                href={sot.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Globe className="h-3 w-3" />
                {sot.url}
              </a>
            </div>
          )}

          {/* Twitter */}
          {sot.contact_twitter && (
            <div className="flex">
              <span className="w-36 text-sm font-medium text-gray-600 dark:text-gray-400">Twitter:</span>
              <a
                href={`https://twitter.com/${sot.contact_twitter.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Twitter className="h-3 w-3" />
                {sot.contact_twitter}
              </a>
            </div>
          )}

          {/* Telegram */}
          {sot.contact_telegram && (
            <div className="flex">
              <span className="w-36 text-sm font-medium text-gray-600 dark:text-gray-400">Telegram:</span>
              <a
                href={`https://t.me/${sot.contact_telegram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Send className="h-3 w-3" />
                {sot.contact_telegram}
              </a>
            </div>
          )}

          {/* Entity Tags */}
          <div className="flex">
            <span className="w-36 text-sm font-medium text-gray-600 dark:text-gray-400">Entity Tags:</span>
            <div className="flex-1 flex flex-wrap gap-1">
              {renderEntityTags()}
            </div>
          </div>

          {/* Associated Countries */}
          <div className="flex">
            <span className="w-36 text-sm font-medium text-gray-600 dark:text-gray-400">Countries:</span>
            <div className="flex-1 flex flex-wrap gap-1">
              {renderAssociatedCountries()}
            </div>
          </div>

          {/* Description */}
          {sot.description_merged && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <span className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Description:
              </span>
              <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                {sot.description_merged}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};