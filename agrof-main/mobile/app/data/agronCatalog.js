/**
 * Agron Store catalog — Apple-Store-style premium browsing UI.
 * Products are grouped by agricultural category with optional Standard/Pro line variants.
 * priceFrom is numeric (UGX); price is the formatted display string.
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ugx(n) {
  return `UGX ${n.toLocaleString('en-US')}`;
}

export const PRICE_NOTE = 'Prices are indicative Kampala market rates. Confirm availability before purchasing.';

// ─── Seeds & Planting Materials ───────────────────────────────────────────────

export const SEED_PRODUCTS = [
  {
    id: 'agron-seed-maize',
    name: 'Hybrid Maize Seed',
    subtitle: 'High-yield certified varieties',
    listImage: require('../assets/seeds.png'),
    priceFrom: 35000,
    price: ugx(35000),
    category: 'seeds',
    description:
      'Certified hybrid maize suited for East African highland and mid-altitude conditions. Choose OPN for open-pollinated, Hybrid F1 for maximum commercial yield.',
    highlights: [
      '90–100 day maturity',
      'Drought-tolerant options',
      'Up to 8 t/ha potential',
      'Treated & certified seed',
    ],
    lines: [
      {
        id: 'standard',
        label: 'OPN Variety',
        priceFrom: 35000,
        price: ugx(35000),
        colors: [
          { id: 'opn', label: 'Open Pollinated', image: require('../assets/seeds.png') },
        ],
      },
      {
        id: 'pro',
        label: 'Hybrid F1',
        subtitle: 'Maximum-yield commercial hybrid',
        priceFrom: 65000,
        price: ugx(65000),
        colors: [
          { id: 'hybrid', label: 'F1 Hybrid', image: require('../assets/seeds.png') },
        ],
      },
    ],
    storageOptions: ['1 kg', '2 kg', '5 kg', '10 kg'],
    purchaseOptionLabel: 'Pack size',
  },
  {
    id: 'agron-seed-beans',
    name: 'Climbing Bean Seed',
    subtitle: 'NABE certified highland varieties',
    listImage: require('../assets/seeds.png'),
    priceFrom: 12000,
    price: ugx(12000),
    category: 'seeds',
    description:
      'NABE certified climbing bean varieties adapted to highland Uganda and Rwanda — high protein, short season, excellent market acceptance.',
    highlights: [
      '60–75 day maturity',
      'NABE 4 / NABE 16 options',
      '22% protein content',
      'Altitude-adapted',
    ],
    storageOptions: ['1 kg', '5 kg', '25 kg', '50 kg'],
    purchaseOptionLabel: 'Pack size',
  },
  {
    id: 'agron-seed-tomato',
    name: 'Tomato Seedlings',
    subtitle: 'Grafted, disease-resistant varieties',
    listImage: require('../assets/nurserybed.png'),
    priceFrom: 1500,
    price: ugx(1500),
    category: 'seeds',
    description:
      'Healthy grafted tomato seedlings ready to transplant. Fusarium wilt and bacterial spot resistant rootstock.',
    highlights: [
      'Grafted onto resistant rootstock',
      'Early fruiting 55–65 days',
      'High Brix sweetness rating',
      'Ready to transplant',
    ],
    storageOptions: ['50 plants', '100 plants', '250 plants', '500 plants'],
    purchaseOptionLabel: 'Tray size',
  },
  {
    id: 'agron-seed-cassava',
    name: 'Cassava Cuttings',
    subtitle: 'CMD-resistant NASE varieties',
    listImage: require('../assets/seeds.png'),
    priceFrom: 8000,
    price: ugx(8000),
    category: 'seeds',
    description:
      'Virus-free cassava stem cuttings from NARO-released CMD-resistant varieties. Best for high-starch processing and food security programs.',
    highlights: [
      'CMD & CBSD resistant',
      '18-month harvest cycle',
      'Up to 40 t/ha fresh weight',
      'Multipurpose: food & starch',
    ],
    storageOptions: ['50 stems', '100 stems', '500 stems'],
    purchaseOptionLabel: 'Bundle',
  },
];

// ─── Fertilizers & Soil Amendments ───────────────────────────────────────────

export const FERTILIZER_PRODUCTS = [
  {
    id: 'agron-fert-npk',
    name: 'NPK Compound Fertilizer',
    subtitle: 'Balanced macro-nutrient blend',
    listImage: require('../assets/fertilizers.png'),
    priceFrom: 88000,
    price: ugx(88000),
    category: 'fertilizers',
    description:
      'Granular compound fertilizer for basal application. Standard grade for general crops; Pro grade for intensive horticulture with higher nitrogen demand.',
    highlights: [
      'Soluble granules',
      'Consistent particle size',
      'Works with all spreaders',
      'Moisture-proof bag',
    ],
    lines: [
      {
        id: 'standard',
        label: '17-17-17',
        priceFrom: 88000,
        price: ugx(88000),
        colors: [
          { id: 'std', label: 'Standard NPK', image: require('../assets/fertilizers.png') },
        ],
      },
      {
        id: 'pro',
        label: '20-10-10 Pro',
        subtitle: 'High-nitrogen for leafy crops',
        priceFrom: 115000,
        price: ugx(115000),
        colors: [
          { id: 'pro', label: 'High-N Pro', image: require('../assets/fertilizers.png') },
        ],
      },
    ],
    storageOptions: ['5 kg', '25 kg', '50 kg'],
    purchaseOptionLabel: 'Bag weight',
  },
  {
    id: 'agron-fert-organic',
    name: 'Organic Compost',
    subtitle: 'Premium bio-enriched soil builder',
    listImage: require('../assets/organic_chemicals.png'),
    priceFrom: 25000,
    price: ugx(25000),
    category: 'fertilizers',
    description:
      'Fully matured organic compost inoculated with beneficial microbes. Improves water retention, soil structure, and long-term fertility.',
    highlights: [
      'C:N ratio 15:1',
      'Biochar-enriched option',
      'Weed-seed free',
      'Certified organic input',
    ],
    storageOptions: ['10 kg', '25 kg', '50 kg', '100 kg'],
    purchaseOptionLabel: 'Bag weight',
  },
  {
    id: 'agron-fert-foliar',
    name: 'Foliar Feed Concentrate',
    subtitle: 'Fast-acting micronutrient spray',
    listImage: require('../assets/fertilizers.png'),
    priceFrom: 32000,
    price: ugx(32000),
    category: 'fertilizers',
    description:
      'Liquid micronutrient complex (Zn, B, Mn, Fe, Cu) for rapidly correcting deficiencies via leaf absorption.',
    highlights: [
      'Visible response in 5–7 days',
      'Compatible with most pesticides',
      'Chelated metals for stability',
      'Concentrated — dilute 5 ml/L',
    ],
    storageOptions: ['250 ml', '500 ml', '1 L', '5 L'],
    purchaseOptionLabel: 'Volume',
  },
];

// ─── Fungicides ────────────────────────────────────────────────────────────────

export const FUNGICIDE_PRODUCTS = [
  {
    id: 'agron-fung-systemic',
    name: 'Systemic Fungicide',
    subtitle: 'Curative & protective action',
    listImage: require('../assets/fungicides.png'),
    priceFrom: 35000,
    price: ugx(35000),
    category: 'fungicides',
    description:
      'Triazole-based systemic fungicide for blight, rust, and mould control on cereals, vegetables, and coffee.',
    highlights: [
      'Systemic translocation',
      'Controls 15+ fungal diseases',
      '14–21 day residual',
      'NAADS registered',
    ],
    storageOptions: ['100 ml', '250 ml', '500 ml', '1 L'],
    purchaseOptionLabel: 'Volume',
  },
  {
    id: 'agron-fung-copper',
    name: 'Copper-Based Fungicide',
    subtitle: 'Broad-spectrum protective spray',
    listImage: require('../assets/fungicides.png'),
    priceFrom: 28000,
    price: ugx(28000),
    category: 'fungicides',
    description:
      'Copper oxychloride suspension for preventive protection against bacterial and fungal diseases on coffee, vegetables, and fruits.',
    highlights: [
      'Contact protective action',
      'Bacterial & fungal control',
      'Safe on bees when dry',
      'Tank-mix compatible',
    ],
    lines: [
      {
        id: 'standard',
        label: 'WP Powder',
        priceFrom: 28000,
        price: ugx(28000),
        colors: [
          { id: 'wp', label: 'Wettable Powder', image: require('../assets/fungicides.png') },
        ],
      },
      {
        id: 'pro',
        label: 'SC Suspension',
        subtitle: 'Ready-to-dilute concentrate',
        priceFrom: 42000,
        price: ugx(42000),
        colors: [
          { id: 'sc', label: 'Suspension Concentrate', image: require('../assets/fungicides.png') },
        ],
      },
    ],
    storageOptions: ['250 g', '500 g', '1 kg', '5 kg'],
    purchaseOptionLabel: 'Pack size',
  },
];

// ─── Herbicides ───────────────────────────────────────────────────────────────

export const HERBICIDE_PRODUCTS = [
  {
    id: 'agron-herb-broad',
    name: 'Broad-Spectrum Herbicide',
    subtitle: 'Pre & post-emergence options',
    listImage: require('../assets/herbicides.png'),
    priceFrom: 22000,
    price: ugx(22000),
    category: 'herbicides',
    description:
      'Systemic herbicide for controlling grass and broadleaf weeds. Pre-emergence for land prep; post-emergence for standing crops.',
    highlights: [
      'Rainfast within 2 hours',
      'Low mammalian toxicity',
      'WHO Class II rated',
      'NAADS approved',
    ],
    lines: [
      {
        id: 'standard',
        label: 'Pre-emergence',
        priceFrom: 22000,
        price: ugx(22000),
        colors: [
          { id: 'pre', label: 'Pre-emergence', image: require('../assets/herbicides.png') },
        ],
      },
      {
        id: 'pro',
        label: 'Post-emergence',
        priceFrom: 29000,
        price: ugx(29000),
        colors: [
          { id: 'post', label: 'Post-emergence', image: require('../assets/herbicides.png') },
        ],
      },
    ],
    storageOptions: ['100 ml', '250 ml', '500 ml', '1 L', '5 L'],
    purchaseOptionLabel: 'Volume',
  },
  {
    id: 'agron-herb-selective',
    name: 'Selective Grass Killer',
    subtitle: 'Targets grasses, safe on broadleaf crops',
    listImage: require('../assets/herbicides.png'),
    priceFrom: 38000,
    price: ugx(38000),
    category: 'herbicides',
    description:
      'Graminicide for use in beans, soybeans, and vegetable fields to kill grass weeds without damaging the crop.',
    highlights: [
      'Safe on all broadleaf crops',
      'Absorbed via leaves & shoots',
      'No soil residue',
      'Use from 2-leaf stage',
    ],
    storageOptions: ['100 ml', '250 ml', '500 ml', '1 L'],
    purchaseOptionLabel: 'Volume',
  },
];

// ─── Organic Chemicals ────────────────────────────────────────────────────────

export const ORGANIC_PRODUCTS = [
  {
    id: 'agron-org-neem',
    name: 'Neem Bio-Pesticide',
    subtitle: 'Organic, zero harvest interval',
    listImage: require('../assets/organic_chemicals.png'),
    priceFrom: 42000,
    price: ugx(42000),
    category: 'organic_chemicals',
    description:
      'Neem oil + pyrethrin concentrate for organic and GAP-compliant pest management. Zero harvest interval — safe to apply and pick same day.',
    highlights: [
      '100% botanical actives',
      'Aphid, whitefly, mite control',
      '0-day pre-harvest interval',
      'EU organic compliant',
    ],
    storageOptions: ['250 ml', '500 ml', '1 L', '5 L'],
    purchaseOptionLabel: 'Volume',
  },
  {
    id: 'agron-org-compost-tea',
    name: 'Compost Tea Concentrate',
    subtitle: 'Soil microbiome booster',
    listImage: require('../assets/organic_chemicals.png'),
    priceFrom: 18000,
    price: ugx(18000),
    category: 'organic_chemicals',
    description:
      'Brewed compost tea inoculated with beneficial bacteria and fungi. Drench or foliar spray to restore depleted soils.',
    highlights: [
      'Live microbial cultures',
      'Improves nutrient cycling',
      'Suppresses soilborne pathogens',
      'Certified organic',
    ],
    storageOptions: ['500 ml', '1 L', '5 L', '20 L'],
    purchaseOptionLabel: 'Volume',
  },
];

// ─── Nursery Bed Supplies ─────────────────────────────────────────────────────

export const NURSERY_PRODUCTS = [
  {
    id: 'agron-nur-tray',
    name: 'Seedling Tray Set',
    subtitle: 'Professional plug & flat trays',
    listImage: require('../assets/nurserybed.png'),
    priceFrom: 8500,
    price: ugx(8500),
    category: 'nursery_bed',
    description:
      'Durable polystyrene plug trays for uniform seedling production. Available in 50, 72, and 128-cell configurations.',
    highlights: [
      'UV-stabilised polystyrene',
      'Uniform cell volume',
      'Easy push-out extraction',
      'Reusable 3–5 seasons',
    ],
    lines: [
      {
        id: 'standard',
        label: '72-cell Tray',
        priceFrom: 8500,
        price: ugx(8500),
        colors: [
          { id: 'cell72', label: '72 Cells', image: require('../assets/nurserybed.png') },
        ],
      },
      {
        id: 'pro',
        label: '128-cell Tray',
        subtitle: 'High-density for small seeds',
        priceFrom: 11000,
        price: ugx(11000),
        colors: [
          { id: 'cell128', label: '128 Cells', image: require('../assets/nurserybed.png') },
        ],
      },
    ],
    storageOptions: ['1 tray', '5 trays', '10 trays', '25 trays'],
    purchaseOptionLabel: 'Quantity',
  },
  {
    id: 'agron-nur-pottingmix',
    name: 'Premium Potting Mix',
    subtitle: 'Peat + perlite + compost blend',
    listImage: require('../assets/nurserybed.png'),
    priceFrom: 22000,
    price: ugx(22000),
    category: 'nursery_bed',
    description:
      'Sterilised nursery potting mix with a balanced peat, perlite, and compost blend. Optimal air-to-water ratio for seedling roots.',
    highlights: [
      'pH 5.8–6.5',
      'Sterilised — disease free',
      'Wetting agent included',
      'Ready to use straight from bag',
    ],
    storageOptions: ['5 L', '10 L', '25 L', '50 L'],
    purchaseOptionLabel: 'Volume',
  },
];

// ─── All products flat list ───────────────────────────────────────────────────

export const ALL_AGRON_PRODUCTS = [
  ...SEED_PRODUCTS,
  ...FERTILIZER_PRODUCTS,
  ...FUNGICIDE_PRODUCTS,
  ...HERBICIDE_PRODUCTS,
  ...ORGANIC_PRODUCTS,
  ...NURSERY_PRODUCTS,
];

export const AGRON_CATEGORIES = [
  { id: 'seeds', name: 'Seeds', image: require('../assets/seeds.png') },
  { id: 'fertilizers', name: 'Fertilizers', image: require('../assets/fertilizers.png') },
  { id: 'fungicides', name: 'Fungicides', image: require('../assets/fungicides.png') },
  { id: 'herbicides', name: 'Herbicides', image: require('../assets/herbicides.png') },
  { id: 'organic_chemicals', name: 'Organic', image: require('../assets/organic_chemicals.png') },
  { id: 'nursery_bed', name: 'Nursery Bed', image: require('../assets/nurserybed.png') },
];

export function getAgronProductById(id) {
  return ALL_AGRON_PRODUCTS.find((p) => p.id === id);
}

export function getAgronProductsByCategory(category) {
  return ALL_AGRON_PRODUCTS.filter((p) => p.category === category);
}
