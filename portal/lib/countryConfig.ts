export interface CountryInfo {
  name: string;
  flag: string;
  defaultLang: string;
  currency: { code: string; symbol: string; name: string };
  hemisphere: 'north' | 'south' | 'equatorial';
}

export const COUNTRIES: Record<string, CountryInfo> = {
  // East Africa
  UG: { name: 'Uganda', flag: '🇺🇬', defaultLang: 'lg', currency: { code: 'UGX', symbol: 'UGX', name: 'Ugandan Shilling' }, hemisphere: 'equatorial' },
  KE: { name: 'Kenya', flag: '🇰🇪', defaultLang: 'sw', currency: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' }, hemisphere: 'equatorial' },
  TZ: { name: 'Tanzania', flag: '🇹🇿', defaultLang: 'sw', currency: { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling' }, hemisphere: 'equatorial' },
  RW: { name: 'Rwanda', flag: '🇷🇼', defaultLang: 'rn', currency: { code: 'RWF', symbol: 'RWF', name: 'Rwandan Franc' }, hemisphere: 'equatorial' },
  BI: { name: 'Burundi', flag: '🇧🇮', defaultLang: 'fr', currency: { code: 'BIF', symbol: 'BIF', name: 'Burundian Franc' }, hemisphere: 'equatorial' },
  SS: { name: 'South Sudan', flag: '🇸🇸', defaultLang: 'en', currency: { code: 'SSP', symbol: 'SSP', name: 'South Sudanese Pound' }, hemisphere: 'north' },
  ET: { name: 'Ethiopia', flag: '🇪🇹', defaultLang: 'am', currency: { code: 'ETB', symbol: 'ETB', name: 'Ethiopian Birr' }, hemisphere: 'north' },
  ER: { name: 'Eritrea', flag: '🇪🇷', defaultLang: 'en', currency: { code: 'ERN', symbol: 'Nfk', name: 'Nakfa' }, hemisphere: 'north' },
  DJ: { name: 'Djibouti', flag: '🇩🇯', defaultLang: 'fr', currency: { code: 'DJF', symbol: 'Fdj', name: 'Djiboutian Franc' }, hemisphere: 'north' },
  SO: { name: 'Somalia', flag: '🇸🇴', defaultLang: 'ar', currency: { code: 'SOS', symbol: 'Sh.So.', name: 'Somali Shilling' }, hemisphere: 'north' },
  MG: { name: 'Madagascar', flag: '🇲🇬', defaultLang: 'fr', currency: { code: 'MGA', symbol: 'Ar', name: 'Malagasy Ariary' }, hemisphere: 'south' },
  MU: { name: 'Mauritius', flag: '🇲🇺', defaultLang: 'en', currency: { code: 'MUR', symbol: '₨', name: 'Mauritian Rupee' }, hemisphere: 'south' },
  SC: { name: 'Seychelles', flag: '🇸🇨', defaultLang: 'en', currency: { code: 'SCR', symbol: '₨', name: 'Seychellois Rupee' }, hemisphere: 'south' },
  KM: { name: 'Comoros', flag: '🇰🇲', defaultLang: 'fr', currency: { code: 'KMF', symbol: 'CF', name: 'Comorian Franc' }, hemisphere: 'south' },
  // Central Africa
  CD: { name: 'DR Congo', flag: '🇨🇩', defaultLang: 'fr', currency: { code: 'CDF', symbol: 'FC', name: 'Congolese Franc' }, hemisphere: 'equatorial' },
  CM: { name: 'Cameroon', flag: '🇨🇲', defaultLang: 'fr', currency: { code: 'XAF', symbol: 'FCFA', name: 'CFA Franc' }, hemisphere: 'north' },
  CG: { name: 'Congo', flag: '🇨🇬', defaultLang: 'fr', currency: { code: 'XAF', symbol: 'FCFA', name: 'CFA Franc' }, hemisphere: 'equatorial' },
  CF: { name: 'Central African Republic', flag: '🇨🇫', defaultLang: 'fr', currency: { code: 'XAF', symbol: 'FCFA', name: 'CFA Franc' }, hemisphere: 'north' },
  GA: { name: 'Gabon', flag: '🇬🇦', defaultLang: 'fr', currency: { code: 'XAF', symbol: 'FCFA', name: 'CFA Franc' }, hemisphere: 'equatorial' },
  GQ: { name: 'Equatorial Guinea', flag: '🇬🇶', defaultLang: 'fr', currency: { code: 'XAF', symbol: 'FCFA', name: 'CFA Franc' }, hemisphere: 'north' },
  TD: { name: 'Chad', flag: '🇹🇩', defaultLang: 'fr', currency: { code: 'XAF', symbol: 'FCFA', name: 'CFA Franc' }, hemisphere: 'north' },
  ST: { name: 'São Tomé and Príncipe', flag: '🇸🇹', defaultLang: 'pt', currency: { code: 'STN', symbol: 'Db', name: 'Dobra' }, hemisphere: 'equatorial' },
  // West Africa
  NG: { name: 'Nigeria', flag: '🇳🇬', defaultLang: 'en', currency: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' }, hemisphere: 'north' },
  GH: { name: 'Ghana', flag: '🇬🇭', defaultLang: 'en', currency: { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' }, hemisphere: 'north' },
  SN: { name: 'Senegal', flag: '🇸🇳', defaultLang: 'fr', currency: { code: 'XOF', symbol: 'CFA', name: 'CFA Franc' }, hemisphere: 'north' },
  CI: { name: "Côte d'Ivoire", flag: '🇨🇮', defaultLang: 'fr', currency: { code: 'XOF', symbol: 'CFA', name: 'CFA Franc' }, hemisphere: 'north' },
  ML: { name: 'Mali', flag: '🇲🇱', defaultLang: 'fr', currency: { code: 'XOF', symbol: 'CFA', name: 'CFA Franc' }, hemisphere: 'north' },
  BJ: { name: 'Benin', flag: '🇧🇯', defaultLang: 'fr', currency: { code: 'XOF', symbol: 'CFA', name: 'CFA Franc' }, hemisphere: 'north' },
  TG: { name: 'Togo', flag: '🇹🇬', defaultLang: 'fr', currency: { code: 'XOF', symbol: 'CFA', name: 'CFA Franc' }, hemisphere: 'north' },
  GN: { name: 'Guinea', flag: '🇬🇳', defaultLang: 'fr', currency: { code: 'GNF', symbol: 'FG', name: 'Guinean Franc' }, hemisphere: 'north' },
  BF: { name: 'Burkina Faso', flag: '🇧🇫', defaultLang: 'fr', currency: { code: 'XOF', symbol: 'CFA', name: 'CFA Franc' }, hemisphere: 'north' },
  NE: { name: 'Niger', flag: '🇳🇪', defaultLang: 'fr', currency: { code: 'XOF', symbol: 'CFA', name: 'CFA Franc' }, hemisphere: 'north' },
  LR: { name: 'Liberia', flag: '🇱🇷', defaultLang: 'en', currency: { code: 'LRD', symbol: '$', name: 'Liberian Dollar' }, hemisphere: 'north' },
  SL: { name: 'Sierra Leone', flag: '🇸🇱', defaultLang: 'en', currency: { code: 'SLE', symbol: 'Le', name: 'Leone' }, hemisphere: 'north' },
  GM: { name: 'Gambia', flag: '🇬🇲', defaultLang: 'en', currency: { code: 'GMD', symbol: 'D', name: 'Dalasi' }, hemisphere: 'north' },
  MR: { name: 'Mauritania', flag: '🇲🇷', defaultLang: 'ar', currency: { code: 'MRU', symbol: 'UM', name: 'Ouguiya' }, hemisphere: 'north' },
  GW: { name: 'Guinea-Bissau', flag: '🇬🇼', defaultLang: 'pt', currency: { code: 'XOF', symbol: 'CFA', name: 'CFA Franc' }, hemisphere: 'north' },
  CV: { name: 'Cabo Verde', flag: '🇨🇻', defaultLang: 'pt', currency: { code: 'CVE', symbol: 'Esc', name: 'Cape Verdean Escudo' }, hemisphere: 'north' },
  // Southern Africa
  ZA: { name: 'South Africa', flag: '🇿🇦', defaultLang: 'en', currency: { code: 'ZAR', symbol: 'R', name: 'South African Rand' }, hemisphere: 'south' },
  ZM: { name: 'Zambia', flag: '🇿🇲', defaultLang: 'en', currency: { code: 'ZMW', symbol: 'K', name: 'Zambian Kwacha' }, hemisphere: 'south' },
  MW: { name: 'Malawi', flag: '🇲🇼', defaultLang: 'en', currency: { code: 'MWK', symbol: 'MK', name: 'Malawian Kwacha' }, hemisphere: 'south' },
  MZ: { name: 'Mozambique', flag: '🇲🇿', defaultLang: 'pt', currency: { code: 'MZN', symbol: 'MT', name: 'Mozambican Metical' }, hemisphere: 'south' },
  ZW: { name: 'Zimbabwe', flag: '🇿🇼', defaultLang: 'en', currency: { code: 'USD', symbol: '$', name: 'US Dollar (Zimbabwe)' }, hemisphere: 'south' },
  AO: { name: 'Angola', flag: '🇦🇴', defaultLang: 'pt', currency: { code: 'AOA', symbol: 'Kz', name: 'Angolan Kwanza' }, hemisphere: 'south' },
  BW: { name: 'Botswana', flag: '🇧🇼', defaultLang: 'en', currency: { code: 'BWP', symbol: 'P', name: 'Botswana Pula' }, hemisphere: 'south' },
  NA: { name: 'Namibia', flag: '🇳🇦', defaultLang: 'en', currency: { code: 'NAD', symbol: '$', name: 'Namibian Dollar' }, hemisphere: 'south' },
  LS: { name: 'Lesotho', flag: '🇱🇸', defaultLang: 'en', currency: { code: 'LSL', symbol: 'L', name: 'Loti' }, hemisphere: 'south' },
  SZ: { name: 'Eswatini', flag: '🇸🇿', defaultLang: 'en', currency: { code: 'SZL', symbol: 'L', name: 'Lilangeni' }, hemisphere: 'south' },
  // North Africa
  EG: { name: 'Egypt', flag: '🇪🇬', defaultLang: 'ar', currency: { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' }, hemisphere: 'north' },
  MA: { name: 'Morocco', flag: '🇲🇦', defaultLang: 'ar', currency: { code: 'MAD', symbol: 'MAD', name: 'Moroccan Dirham' }, hemisphere: 'north' },
  DZ: { name: 'Algeria', flag: '🇩🇿', defaultLang: 'ar', currency: { code: 'DZD', symbol: 'DA', name: 'Algerian Dinar' }, hemisphere: 'north' },
  TN: { name: 'Tunisia', flag: '🇹🇳', defaultLang: 'ar', currency: { code: 'TND', symbol: 'DT', name: 'Tunisian Dinar' }, hemisphere: 'north' },
  LY: { name: 'Libya', flag: '🇱🇾', defaultLang: 'ar', currency: { code: 'LYD', symbol: 'LD', name: 'Libyan Dinar' }, hemisphere: 'north' },
  SD: { name: 'Sudan', flag: '🇸🇩', defaultLang: 'ar', currency: { code: 'SDG', symbol: 'SD', name: 'Sudanese Pound' }, hemisphere: 'north' },
  // South/Southeast Asia
  IN: { name: 'India', flag: '🇮🇳', defaultLang: 'en', currency: { code: 'INR', symbol: '₹', name: 'Indian Rupee' }, hemisphere: 'north' },
  PH: { name: 'Philippines', flag: '🇵🇭', defaultLang: 'en', currency: { code: 'PHP', symbol: '₱', name: 'Philippine Peso' }, hemisphere: 'north' },
  ID: { name: 'Indonesia', flag: '🇮🇩', defaultLang: 'en', currency: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' }, hemisphere: 'equatorial' },
  CN: { name: 'China', flag: '🇨🇳', defaultLang: 'en', currency: { code: 'CNY', symbol: '¥', name: 'Yuan' }, hemisphere: 'north' },
  JP: { name: 'Japan', flag: '🇯🇵', defaultLang: 'en', currency: { code: 'JPY', symbol: '¥', name: 'Yen' }, hemisphere: 'north' },
  PK: { name: 'Pakistan', flag: '🇵🇰', defaultLang: 'en', currency: { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' }, hemisphere: 'north' },
  BD: { name: 'Bangladesh', flag: '🇧🇩', defaultLang: 'en', currency: { code: 'BDT', symbol: '৳', name: 'Taka' }, hemisphere: 'north' },
  VN: { name: 'Vietnam', flag: '🇻🇳', defaultLang: 'en', currency: { code: 'VND', symbol: '₫', name: 'Dong' }, hemisphere: 'north' },
  TH: { name: 'Thailand', flag: '🇹🇭', defaultLang: 'en', currency: { code: 'THB', symbol: '฿', name: 'Baht' }, hemisphere: 'north' },
  SA: { name: 'Saudi Arabia', flag: '🇸🇦', defaultLang: 'ar', currency: { code: 'SAR', symbol: 'SR', name: 'Riyal' }, hemisphere: 'north' },
  AE: { name: 'United Arab Emirates', flag: '🇦🇪', defaultLang: 'ar', currency: { code: 'AED', symbol: 'AED', name: 'Dirham' }, hemisphere: 'north' },
  // Americas
  BR: { name: 'Brazil', flag: '🇧🇷', defaultLang: 'pt', currency: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' }, hemisphere: 'south' },
  US: { name: 'United States', flag: '🇺🇸', defaultLang: 'en', currency: { code: 'USD', symbol: '$', name: 'US Dollar' }, hemisphere: 'north' },
  CA: { name: 'Canada', flag: '🇨🇦', defaultLang: 'en', currency: { code: 'CAD', symbol: '$', name: 'Canadian Dollar' }, hemisphere: 'north' },
  MX: { name: 'Mexico', flag: '🇲🇽', defaultLang: 'en', currency: { code: 'MXN', symbol: '$', name: 'Mexican Peso' }, hemisphere: 'north' },
  AR: { name: 'Argentina', flag: '🇦🇷', defaultLang: 'en', currency: { code: 'ARS', symbol: '$', name: 'Argentine Peso' }, hemisphere: 'south' },
  // Europe (diaspora traders)
  GB: { name: 'United Kingdom', flag: '🇬🇧', defaultLang: 'en', currency: { code: 'GBP', symbol: '£', name: 'British Pound' }, hemisphere: 'north' },
  FR: { name: 'France', flag: '🇫🇷', defaultLang: 'fr', currency: { code: 'EUR', symbol: '€', name: 'Euro' }, hemisphere: 'north' },
  DE: { name: 'Germany', flag: '🇩🇪', defaultLang: 'en', currency: { code: 'EUR', symbol: '€', name: 'Euro' }, hemisphere: 'north' },
  IT: { name: 'Italy', flag: '🇮🇹', defaultLang: 'en', currency: { code: 'EUR', symbol: '€', name: 'Euro' }, hemisphere: 'north' },
  ES: { name: 'Spain', flag: '🇪🇸', defaultLang: 'en', currency: { code: 'EUR', symbol: '€', name: 'Euro' }, hemisphere: 'north' },
  // Oceania
  AU: { name: 'Australia', flag: '🇦🇺', defaultLang: 'en', currency: { code: 'AUD', symbol: '$', name: 'Australian Dollar' }, hemisphere: 'south' },
  NZ: { name: 'New Zealand', flag: '🇳🇿', defaultLang: 'en', currency: { code: 'NZD', symbol: '$', name: 'New Zealand Dollar' }, hemisphere: 'south' },
  OTHER: { name: 'Other', flag: '🌍', defaultLang: 'en', currency: { code: 'USD', symbol: '$', name: 'US Dollar' }, hemisphere: 'north' },
};

// Sorted list for dropdowns
export const COUNTRY_LIST = Object.entries(COUNTRIES)
  .map(([code, info]) => ({ code, ...info }))
  .sort((a, b) => (a.name === 'Other' ? 1 : b.name === 'Other' ? -1 : a.name.localeCompare(b.name)));

type RegionKey = 'east_africa' | 'west_africa' | 'central_africa' | 'southern_africa' | 'north_africa' | 'south_asia' | 'global';

interface RegionData {
  label: string;
  crops: string[];
  diseases: Record<string, string[]>;
  marketContext: string;
}

export const REGION_DATA: Record<RegionKey, RegionData> = {
  east_africa: {
    label: 'East Africa',
    crops: ['maize', 'beans', 'banana', 'cassava', 'coffee', 'tomato', 'potato', 'sorghum', 'millet', 'rice', 'groundnuts', 'sunflower', 'soybean', 'sweet potato'],
    diseases: {
      maize: ['Maize Lethal Necrosis (MLN)', 'Grey Leaf Spot', 'Northern Leaf Blight', 'Smut', 'Downy Mildew', 'Fall Armyworm', 'Streak Virus'],
      beans: ['Bean Rust', 'Angular Leaf Spot', 'Root Rot', 'Anthracnose', 'Bean Common Mosaic Virus', 'Aphids'],
      banana: ['Banana Xanthomonas Wilt (BXW)', 'Black Sigatoka', 'Fusarium Wilt (Panama disease)', 'Banana Streak Virus', 'Weevil damage'],
      cassava: ['Cassava Mosaic Virus (CMD)', 'Cassava Brown Streak (CBSD)', 'Anthracnose', 'Bacterial Blight', 'Mealybug infestation'],
      coffee: ['Coffee Leaf Rust', 'Coffee Berry Disease (CBD)', 'Antestia Bug', 'Coffee Wilt (Fusarium)'],
      tomato: ['Early Blight', 'Late Blight', 'Fusarium Wilt', 'Bacterial Wilt', 'Leaf Curl Virus', 'Tuta absoluta (moth)'],
      potato: ['Late Blight', 'Early Blight', 'Bacterial Wilt', 'Potato Virus Y', 'Nematodes'],
      rice: ['Rice Blast', 'Brown Plant Hopper', 'Rice Yellow Mottle Virus', 'Bacterial Leaf Blight'],
    },
    marketContext: 'Two rainy seasons (March–May and October–December). Key markets: Kampala, Nairobi, Dar es Salaam, Kigali.',
  },
  west_africa: {
    label: 'West Africa',
    crops: ['maize', 'cassava', 'yam', 'cocoa', 'rice', 'groundnuts', 'sorghum', 'millet', 'cowpea', 'plantain', 'oil palm', 'tomato'],
    diseases: {
      cassava: ['Cassava Mosaic Virus', 'Cassava Brown Streak', 'Anthracnose', 'Bacterial Blight', 'Whitefly infestation'],
      maize: ['Streak Virus', 'Stem Borer', 'Fall Armyworm', 'Smut', 'Downy Mildew', 'Aspergillus ear rot'],
      cocoa: ['Black Pod Disease (Phytophthora)', 'Swollen Shoot Virus', 'Witches Broom', 'Moniliophthora Roreri', 'Capsid damage'],
      yam: ['Yam Mosaic Virus', 'Anthracnose', 'Dry Rot', 'Storage Rot', 'Nematodes'],
      rice: ['Rice Blast', 'Brown Plant Hopper', 'Rice Yellow Mottle Virus', 'Bacterial Leaf Blight', 'African Rice Gall Midge'],
      groundnuts: ['Late Leaf Spot', 'Rosette Virus', 'Aflatoxin', 'Root Rot', 'Early Leaf Spot'],
    },
    marketContext: 'Single rainy season (May–October in north, year-round near coast). Key markets: Lagos, Accra, Dakar, Abidjan.',
  },
  central_africa: {
    label: 'Central Africa',
    crops: ['cassava', 'plantain', 'maize', 'rice', 'groundnuts', 'oil palm', 'coffee', 'cocoa', 'sorghum'],
    diseases: {
      cassava: ['Cassava Mosaic Virus', 'Cassava Brown Streak', 'Bacterial Blight', 'Whitefly', 'Mealybug'],
      plantain: ['Black Sigatoka', 'Fusarium Wilt', 'Banana Xanthomonas Wilt', 'Banana Bunchy Top Virus'],
      maize: ['Streak Virus', 'Fall Armyworm', 'Smut', 'Downy Mildew'],
      rice: ['Rice Blast', 'Rice Yellow Mottle Virus', 'Bacterial Leaf Blight'],
    },
    marketContext: 'Equatorial climate with year-round rainfall. Key markets: Kinshasa, Yaoundé, Douala.',
  },
  southern_africa: {
    label: 'Southern Africa',
    crops: ['maize', 'tobacco', 'cotton', 'soybean', 'sunflower', 'wheat', 'potato', 'tomato', 'sorghum', 'groundnuts', 'sweet potato'],
    diseases: {
      maize: ['Grey Leaf Spot', 'Northern Leaf Blight', 'Smut', 'Streak Virus', 'Fall Armyworm', 'Rootworm', 'Maize Dwarf Mosaic'],
      tobacco: ['Blue Mold', 'Black Shank', 'Mosaic Virus', 'Wildfire', 'Angular Leaf Spot', 'Root Rots'],
      cotton: ['Bollworm', 'Bacterial Blight', 'Fusarium Wilt', 'Verticillium Wilt', 'Jassid'],
      wheat: ['Yellow Rust', 'Brown Rust', 'Stem Rust', 'Septoria Leaf Blotch', 'Smut', 'Fusarium Head Blight'],
      soybean: ['Soybean Rust', 'Root Rot', 'Stem Canker', 'Pod and Stem Blight', 'Whitefly'],
    },
    marketContext: 'Summer rainfall (November–March). Reverse seasons from northern hemisphere. Key markets: Johannesburg, Lusaka, Harare, Maputo.',
  },
  north_africa: {
    label: 'North Africa',
    crops: ['wheat', 'barley', 'dates', 'olives', 'citrus', 'tomato', 'potato', 'cotton', 'sugar beet', 'groundnuts', 'sugarcane'],
    diseases: {
      wheat: ['Yellow Rust', 'Leaf Rust', 'Stem Rust', 'Septoria', 'Fusarium', 'Powdery Mildew', 'Hessian Fly'],
      olives: ['Olive Knot', 'Peacock Spot', 'Verticillium Wilt', 'Olive Fruit Fly', 'Scale insects'],
      citrus: ['Citrus Canker', 'Greasy Spot', 'Citrus Greening (HLB)', 'Root Rot', 'Citrus Tristeza Virus'],
      tomato: ['Early Blight', 'Late Blight', 'Fusarium Wilt', 'Tomato Yellow Leaf Curl Virus', 'Tuta absoluta'],
      potato: ['Late Blight', 'Early Blight', 'Potato Virus Y', 'Colorado Beetle'],
    },
    marketContext: 'Mediterranean climate — dry summer, wet winter. Key markets: Cairo, Casablanca, Tunis.',
  },
  south_asia: {
    label: 'South/Southeast Asia',
    crops: ['rice', 'wheat', 'cotton', 'sugarcane', 'maize', 'groundnuts', 'soybean', 'pulses', 'vegetables', 'banana', 'mango', 'coconut'],
    diseases: {
      rice: ['Rice Blast', 'Bacterial Leaf Blight', 'Brown Plant Hopper', 'Sheath Blight', 'Tungro Virus', 'Neck Rot'],
      wheat: ['Rust (Yellow/Brown/Stem)', 'Loose Smut', 'Karnal Bunt', 'Powdery Mildew', 'Aphids'],
      cotton: ['Bollworm', 'Leaf Curl Virus', 'Fusarium Wilt', 'Alternaria Leaf Spot', 'Whitefly'],
      sugarcane: ['Red Rot', 'Smut', 'Leaf Scald', 'Ratoon Stunting', 'Pyrilla Leaf Hopper'],
      banana: ['Panama Disease', 'Sigatoka', 'Bunchy Top Virus', 'Rhizome Rot'],
    },
    marketContext: 'Monsoon-driven seasons. Key markets: Mumbai, Delhi, Manila, Jakarta, Dhaka.',
  },
  global: {
    label: 'Global',
    crops: ['maize', 'wheat', 'rice', 'soybean', 'potato', 'tomato', 'cassava', 'beans', 'sorghum', 'vegetables'],
    diseases: {
      maize: ['Grey Leaf Spot', 'Northern Leaf Blight', 'Smut', 'Fall Armyworm', 'Streak Virus'],
      wheat: ['Rust', 'Septoria', 'Smut', 'Fusarium', 'Powdery Mildew'],
      rice: ['Rice Blast', 'Bacterial Blight', 'Brown Plant Hopper', 'Sheath Blight'],
      tomato: ['Early Blight', 'Late Blight', 'Fusarium Wilt', 'Bacterial Wilt'],
      potato: ['Late Blight', 'Early Blight', 'Bacterial Wilt', 'Virus diseases'],
    },
    marketContext: 'Varies by location. Crops and seasons depend on your local growing region.',
  },
};

const EAST_AFRICA = ['UG', 'KE', 'TZ', 'RW', 'BI', 'ET', 'SS', 'ER', 'DJ', 'SO', 'MG', 'MU', 'SC', 'KM'];
const WEST_AFRICA = ['NG', 'GH', 'SN', 'CI', 'ML', 'BJ', 'TG', 'GN', 'BF', 'NE', 'LR', 'SL', 'GM', 'MR', 'GW', 'CV'];
const CENTRAL_AFRICA = ['CD', 'CM', 'CG', 'CF', 'GA', 'GQ', 'AO', 'TD', 'ST'];
const SOUTHERN_AFRICA = ['ZA', 'ZM', 'MW', 'MZ', 'ZW', 'BW', 'NA', 'LS', 'SZ'];
const NORTH_AFRICA = ['EG', 'MA', 'DZ', 'TN', 'LY', 'SD'];
const SOUTH_ASIA = ['IN', 'PK', 'BD', 'LK', 'NP', 'PH', 'ID', 'VN', 'TH', 'MM', 'KH', 'MY'];

export function getRegion(countryCode: string): RegionKey {
  if (EAST_AFRICA.includes(countryCode)) return 'east_africa';
  if (WEST_AFRICA.includes(countryCode)) return 'west_africa';
  if (CENTRAL_AFRICA.includes(countryCode)) return 'central_africa';
  if (SOUTHERN_AFRICA.includes(countryCode)) return 'southern_africa';
  if (NORTH_AFRICA.includes(countryCode)) return 'north_africa';
  if (SOUTH_ASIA.includes(countryCode)) return 'south_asia';
  return 'global';
}

export function getSeason(countryCode: string, date = new Date()): string {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const country = COUNTRIES[countryCode];
  const hemisphere = country?.hemisphere || 'north';

  if (EAST_AFRICA.includes(countryCode) || countryCode === 'CD') {
    if (month >= 3 && month <= 5) return `long_rains_${year}`;
    if (month >= 10 && month <= 12) return `short_rains_${year}`;
    return `dry_season_${year}`;
  }
  if (hemisphere === 'south') {
    if (month >= 11 || month <= 1) return `summer_${year}`;
    if (month >= 3 && month <= 5) return `autumn_${year}`;
    if (month >= 6 && month <= 8) return `winter_${year}`;
    return `spring_${year}`;
  }
  if (WEST_AFRICA.includes(countryCode) || CENTRAL_AFRICA.includes(countryCode)) {
    if (month >= 5 && month <= 10) return `rainy_season_${year}`;
    return `dry_season_${year}`;
  }
  // North/Northern hemisphere temperate
  if (month >= 3 && month <= 5) return `spring_${year}`;
  if (month >= 6 && month <= 8) return `summer_${year}`;
  if (month >= 9 && month <= 11) return `autumn_${year}`;
  return `winter_${year}`;
}

export interface AIPromptOptions {
  storeContext?: string;  // live product catalog injected by AI routes
  userContext?: string;   // personal farm/season/diagnosis summary from the farmer
}

export function buildAISystemPrompt(
  countryCode: string,
  task: 'analyze' | 'chat' = 'analyze',
  options: AIPromptOptions = {}
): string {
  const country = COUNTRIES[countryCode] || COUNTRIES['OTHER'];
  const region = getRegion(countryCode);
  const regionData = REGION_DATA[region];
  const currency = country.currency;
  const season = getSeason(countryCode);

  const diseaseSummary = Object.entries(regionData.diseases)
    .slice(0, 6)
    .map(([crop, diseases]) => `- ${crop.charAt(0).toUpperCase() + crop.slice(1)}: ${diseases.slice(0, 4).join(', ')}`)
    .join('\n');

  const cropList = regionData.crops.slice(0, 12).join(', ');

  const storeCatalog = options.storeContext || [
    'AGRON STORE CATALOG (general):',
    `- Seeds: maize, beans, soybeans, sorghum, millet, vegetables (avg ${currency.symbol} 34,000)`,
    `- Fertilizers: CAN, DAP, NPK 17-17-17, Urea, Optimizer foliar (avg ${currency.symbol} 43,000)`,
    `- Fungicides: Mancozeb, Ridomil Gold, Amistar Top, Score 250 EC, Dithane M45 (avg ${currency.symbol} 73,000)`,
    `- Herbicides: Roundup, Weedmaster, Stomp, Galex (avg ${currency.symbol} 67,000)`,
    '- Nursery items, pesticides, irrigation supplies',
  ].join('\n');

  const userSection = options.userContext
    ? `\n${options.userContext}\n`
    : '';

  if (task === 'analyze') {
    return `You are AGRON AI — the intelligent crop health assistant built into the AGRON platform.

USER LOCATION: ${country.name} (${countryCode}) — ${regionData.label}
CURRENT SEASON: ${season}
LOCAL CURRENCY: ${currency.name} (${currency.code})

COMMON CROPS IN THIS REGION: ${cropList}

COMMON DISEASES IN THIS REGION:
${diseaseSummary}

${storeCatalog}
${userSection}
RULES:
- Diagnose crops common in ${country.name} and the ${regionData.label} region
- If FARMER PERSONAL CONTEXT is provided above, use it as your PRIMARY reference — treat the listed crops as the most likely candidates
- Reference local seasonal context (current season: ${season})
- When recommending a product, use the exact product name from the AGRON STORE CATALOG above
- Use simple practical language a smallholder farmer can act on today
- Say "likely" or "possible" — never claim 100% certainty from image alone
- If user writes in a language other than English, respond in that language
- Always end with one prevention tip
- Return valid JSON only — no markdown, no extra text`;
  }

  // Chat / plan prompt
  return `You are AGRON AI — an expert agricultural assistant for the AGRON platform.

USER LOCATION: ${country.name} (${countryCode}) — ${regionData.label}
CURRENT SEASON: ${season}
LOCAL CURRENCY: ${currency.name} (${currency.code} — symbol: ${currency.symbol})

COMMON CROPS IN THIS REGION: ${cropList}

COMMON DISEASES TO ADVISE ON:
${diseaseSummary}

${storeCatalog}
${userSection}
MARKET CONTEXT (${regionData.label}): ${regionData.marketContext}

RULES:
- Answer in the same language the user writes in
- Always give advice relevant to ${country.name} and ${regionData.label} farming conditions
- Reference local seasonal calendar (current: ${season})
- When recommending products, use exact product names from the AGRON STORE CATALOG above and note they are available in the AGRON store
- Keep responses concise and use bullet points for lists
- If FARMER PERSONAL CONTEXT is provided above, personalise your advice to their specific farm and crops
- If the question is unrelated to agriculture or AGRON, politely redirect`;
}
