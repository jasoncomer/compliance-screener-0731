import { SOT, SOTV2 } from "../typings/interfaces";

export const transformSOT = (sot: SOT): SOTV2 => {
    const sotV2: SOTV2 = {
        ...sot,
        entity_tags: [],
        associated_countries: [],
        social_media_profiles: [],
    };
    return sotV2;
}