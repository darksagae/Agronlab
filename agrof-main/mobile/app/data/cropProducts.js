/**
 * Catalog used for budget product suggestions and the History tab crop overview grid.
 * Paths are relative to this file (under app/data/).
 */

const img = {
  seeds: require('../assets/seeds.png'),
  fertilizers: require('../assets/fertilizers.png'),
  fungicides: require('../assets/fungicides.png'),
  herbicides: require('../assets/herbicides.png'),
  nursery: require('../assets/nurserybed.png'),
  green: require('../assets/green.png'),
  organic: require('../assets/organic_chemicals.png'),
};

/** @type {Array<{ id: number; name: string; category: string; price: number; image: number }>} */
export const cropProducts = [
  { id: 1, name: 'Maize', category: 'seeds', price: 42, image: img.seeds },
  { id: 2, name: 'Beans', category: 'seeds', price: 28, image: img.green },
  { id: 3, name: 'Wheat', category: 'seeds', price: 35, image: img.seeds },
  { id: 4, name: 'Coffee', category: 'seeds', price: 55, image: img.nursery },
  { id: 5, name: 'Tomato', category: 'seeds', price: 18, image: img.green },
  { id: 6, name: 'Cassava', category: 'seeds', price: 22, image: img.green },
  { id: 7, name: 'NPK Basal 50kg', category: 'fertilizer', price: 65, image: img.fertilizers },
  { id: 8, name: 'CAN Topdress 50kg', category: 'fertilizer', price: 48, image: img.fertilizers },
  { id: 9, name: 'Organic compost 25kg', category: 'fertilizer', price: 32, image: img.organic },
  { id: 10, name: 'Hoe & rake set', category: 'tools', price: 24, image: img.green },
  { id: 11, name: 'Sprayer 16L', category: 'tools', price: 38, image: img.nursery },
  { id: 12, name: 'Systemic fungicide 1L', category: 'pesticide', price: 29, image: img.fungicides },
  { id: 13, name: 'Selective herbicide 1L', category: 'pesticide', price: 31, image: img.herbicides },
];
