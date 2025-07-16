import { SOT } from '../typings/interfaces';

export const getEntityTags = (sot: SOT): string[] => {
  const tags: string[] = [];
  for (let i = 1; i <= 7; i++) {
    const tag = sot[`entity_tag${i}` as keyof SOT];
    if (tag && typeof tag === 'string' && tag.trim() !== '') {
      tags.push(tag);
    }
  }
  return tags;
};

export const getAssociateCountries = (sot: SOT): string[] => {
  const countries: string[] = [];
  for (let i = 1; i <= 6; i++) {
    const country = sot[`associate_country_${i}` as keyof SOT];
    if (country && typeof country === 'string' && country.trim() !== '') {
      countries.push(country);
    }
  }
  return countries;
};

export const getSocialMediaProfiles = (sot: SOT): string[] => {
  const profiles: string[] = [];
  ['social_media_profile', 'social_media_profile_2', 'social_media_profile_3', 'social_media_profile_4'].forEach(field => {
    const profile = sot[field as keyof SOT];
    if (profile && typeof profile === 'string' && profile.trim() !== '') {
      profiles.push(profile);
    }
  });
  return profiles;
}; 