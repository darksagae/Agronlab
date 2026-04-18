import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

class MarketService {
  constructor() {
    this.baseUrl = 'https://agrof.farm/api'; // Your existing API
    this.marketData = {
      buyers: [],
      sellers: [],
      products: [],
      prices: {},
      transactions: []
    };
  }

  // Initialize market service
  async initialize() {
    try {
      await this.loadMarketData();
      console.log('Market Service initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing market service:', error);
      return false;
    }
  }

  // Load market data from API
  async loadMarketData() {
    try {
      // Load buyers
      const buyersResponse = await axios.get(`${this.baseUrl}/buyers`);
      this.marketData.buyers = buyersResponse.data || [];

      // Load sellers
      const sellersResponse = await axios.get(`${this.baseUrl}/sellers`);
      this.marketData.sellers = sellersResponse.data || [];

      // Load products
      const productsResponse = await axios.get(`${this.baseUrl}/products`);
      this.marketData.products = productsResponse.data || [];

      // Load price data
      const pricesResponse = await axios.get(`${this.baseUrl}/prices`);
      this.marketData.prices = pricesResponse.data || {};

      return true;
    } catch (error) {
      console.error('Error loading market data:', error);
      // Return empty data instead of mock data for production
      this.marketData = {
        buyers: [],
        sellers: [],
        products: [],
        prices: {},
        transactions: []
      };
      return false;
    }
  }

  // DEPRECATED: Mock data removed for production
  // Use Amplify Data / API when available
  loadMockMarketData() {
    this.marketData = {
      buyers: [
        {
          id: '1',
          name: 'Kampala Fresh Market',
          location: 'Kampala',
          contact: '+256 700 123 456',
          products: ['tomatoes', 'onions', 'cabbage'],
          rating: 4.5,
          distance: 5.2
        },
        {
          id: '2',
          name: 'Jinja Agricultural Co-op',
          location: 'Jinja',
          contact: '+256 700 234 567',
          products: ['maize', 'beans', 'rice'],
          rating: 4.2,
          distance: 12.8
        },
        {
          id: '3',
          name: 'Mukono Farmers Market',
          location: 'Mukono',
          contact: '+256 700 345 678',
          products: ['bananas', 'pineapples', 'mangoes'],
          rating: 4.7,
          distance: 8.5
        }
      ],
      sellers: [
        {
          id: '1',
          name: 'John Kato',
          location: 'Wakiso',
          contact: '+256 700 111 222',
          products: ['tomatoes', 'onions'],
          rating: 4.3,
          verified: true
        },
        {
          id: '2',
          name: 'Mary Nakato',
          location: 'Mukono',
          contact: '+256 700 333 444',
          products: ['bananas', 'pineapples'],
          rating: 4.8,
          verified: true
        }
      ],
      products: [
        {
          id: '1',
          name: 'Tomatoes',
          category: 'vegetables',
          unit: 'kg',
          currentPrice: 2500,
          priceRange: { min: 2000, max: 3000 },
          demand: 'high',
          supply: 'medium'
        },
        {
          id: '2',
          name: 'Onions',
          category: 'vegetables',
          unit: 'kg',
          currentPrice: 1800,
          priceRange: { min: 1500, max: 2200 },
          demand: 'medium',
          supply: 'high'
        },
        {
          id: '3',
          name: 'Maize',
          category: 'grains',
          unit: 'kg',
          currentPrice: 1200,
          priceRange: { min: 1000, max: 1500 },
          demand: 'high',
          supply: 'high'
        }
      ],
      prices: {
        tomatoes: { current: 2500, trend: 'up', change: 5.2 },
        onions: { current: 1800, trend: 'down', change: -2.1 },
        maize: { current: 1200, trend: 'stable', change: 0.5 }
      }
    };
  }

  // Get nearby buyers
  async getNearbyBuyers(latitude, longitude, radius = 50) {
    try {
      const buyers = this.marketData.buyers.filter(buyer => {
        // Calculate distance (simplified)
        const distance = this.calculateDistance(latitude, longitude, buyer.latitude || 0, buyer.longitude || 0);
        return distance <= radius;
      });

      return buyers.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error('Error getting nearby buyers:', error);
      return [];
    }
  }

  // Get nearby sellers
  async getNearbySellers(latitude, longitude, radius = 50) {
    try {
      const sellers = this.marketData.sellers.filter(seller => {
        const distance = this.calculateDistance(latitude, longitude, seller.latitude || 0, seller.longitude || 0);
        return distance <= radius;
      });

      return sellers.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error('Error getting nearby sellers:', error);
      return [];
    }
  }

  // Match farmers with buyers
  async matchFarmerWithBuyers(farmerData) {
    try {
      const { products, location, quantity } = farmerData;
      const matches = [];

      for (const buyer of this.marketData.buyers) {
        const commonProducts = buyer.products.filter(product => 
          products.includes(product)
        );

        if (commonProducts.length > 0) {
          const match = {
            buyer: buyer,
            commonProducts: commonProducts,
            matchScore: this.calculateMatchScore(farmerData, buyer),
            estimatedPrice: this.calculateEstimatedPrice(commonProducts, quantity),
            distance: this.calculateDistance(
              location.latitude, 
              location.longitude, 
              buyer.latitude || 0, 
              buyer.longitude || 0
            )
          };
          matches.push(match);
        }
      }

      return matches.sort((a, b) => b.matchScore - a.matchScore);
    } catch (error) {
      console.error('Error matching farmer with buyers:', error);
      return [];
    }
  }

  // Calculate match score between farmer and buyer
  calculateMatchScore(farmerData, buyer) {
    let score = 0;

    // Product compatibility (40% weight)
    const commonProducts = buyer.products.filter(product => 
      farmerData.products.includes(product)
    );
    score += (commonProducts.length / farmerData.products.length) * 40;

    // Distance factor (30% weight)
    const distance = this.calculateDistance(
      farmerData.location.latitude,
      farmerData.location.longitude,
      buyer.latitude || 0,
      buyer.longitude || 0
    );
    score += Math.max(0, (50 - distance) / 50) * 30;

    // Buyer rating (20% weight)
    score += (buyer.rating / 5) * 20;

    // Price competitiveness (10% weight)
    const priceScore = this.calculatePriceScore(farmerData.products, buyer);
    score += priceScore * 10;

    return Math.min(100, Math.max(0, score));
  }

  // Calculate estimated price
  calculateEstimatedPrice(products, quantity) {
    let totalPrice = 0;
    
    for (const product of products) {
      const productData = this.marketData.products.find(p => p.name.toLowerCase() === product.toLowerCase());
      if (productData) {
        totalPrice += productData.currentPrice * quantity;
      }
    }

    return totalPrice;
  }

  // Calculate price score
  calculatePriceScore(products, buyer) {
    // Simplified price scoring
    return 0.8; // Mock score
  }

  // Get current market prices
  async getCurrentPrices(products = []) {
    try {
      if (products.length === 0) {
        return this.marketData.prices;
      }

      const filteredPrices = {};
      for (const product of products) {
        if (this.marketData.prices[product]) {
          filteredPrices[product] = this.marketData.prices[product];
        }
      }

      return filteredPrices;
    } catch (error) {
      console.error('Error getting current prices:', error);
      return {};
    }
  }

  // Get price trends
  async getPriceTrends(product, days = 7) {
    try {
      // Mock price trend data
      const trends = [];
      const basePrice = this.marketData.prices[product]?.current || 1000;
      
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        trends.push({
          date: date.toISOString().split('T')[0],
          price: basePrice + (Math.random() - 0.5) * 200,
          volume: Math.random() * 1000
        });
      }

      return trends;
    } catch (error) {
      console.error('Error getting price trends:', error);
      return [];
    }
  }

  // Create market listing
  async createListing(listingData) {
    try {
      const listing = {
        id: Date.now().toString(),
        ...listingData,
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      // Save to local storage
      await this.saveListing(listing);
      
      return listing;
    } catch (error) {
      console.error('Error creating listing:', error);
      return null;
    }
  }

  // Save listing to local storage
  async saveListing(listing) {
    try {
      const savedListings = await AsyncStorage.getItem('marketListings');
      const listings = savedListings ? JSON.parse(savedListings) : [];
      
      listings.push(listing);
      
      await AsyncStorage.setItem('marketListings', JSON.stringify(listings));
      return true;
    } catch (error) {
      console.error('Error saving listing:', error);
      return false;
    }
  }

  // Get market listings
  async getMarketListings(filters = {}) {
    try {
      const savedListings = await AsyncStorage.getItem('marketListings');
      let listings = savedListings ? JSON.parse(savedListings) : [];

      // Apply filters
      if (filters.category) {
        listings = listings.filter(listing => listing.category === filters.category);
      }

      if (filters.location) {
        listings = listings.filter(listing => 
          this.calculateDistance(
            filters.location.latitude,
            filters.location.longitude,
            listing.location.latitude,
            listing.location.longitude
          ) <= (filters.radius || 50)
        );
      }

      if (filters.priceRange) {
        listings = listings.filter(listing => 
          listing.price >= filters.priceRange.min && 
          listing.price <= filters.priceRange.max
        );
      }

      return listings;
    } catch (error) {
      console.error('Error getting market listings:', error);
      return [];
    }
  }

  // Create transaction
  async createTransaction(transactionData) {
    try {
      const transaction = {
        id: Date.now().toString(),
        ...transactionData,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };

      // Save to local storage
      await this.saveTransaction(transaction);
      
      return transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      return null;
    }
  }

  // Save transaction
  async saveTransaction(transaction) {
    try {
      const savedTransactions = await AsyncStorage.getItem('marketTransactions');
      const transactions = savedTransactions ? JSON.parse(savedTransactions) : [];
      
      transactions.push(transaction);
      
      await AsyncStorage.setItem('marketTransactions', JSON.stringify(transactions));
      return true;
    } catch (error) {
      console.error('Error saving transaction:', error);
      return false;
    }
  }

  // Get transactions
  async getTransactions(userId) {
    try {
      const savedTransactions = await AsyncStorage.getItem('marketTransactions');
      const transactions = savedTransactions ? JSON.parse(savedTransactions) : [];
      
      return transactions.filter(transaction => 
        transaction.buyerId === userId || transaction.sellerId === userId
      );
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  // Calculate distance between two points
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  // Get market insights
  getMarketInsights() {
    const insights = {
      trendingProducts: [],
      priceAlerts: [],
      demandForecast: {},
      recommendations: []
    };

    // Analyze trending products
    const productDemand = {};
    this.marketData.products.forEach(product => {
      productDemand[product.name] = product.demand;
    });

    insights.trendingProducts = Object.entries(productDemand)
      .filter(([name, demand]) => demand === 'high')
      .map(([name, demand]) => ({ name, demand }));

    // Generate price alerts
    Object.entries(this.marketData.prices).forEach(([product, data]) => {
      if (data.change > 10) {
        insights.priceAlerts.push({
          product,
          type: 'price_increase',
          message: `${product} price increased by ${data.change.toFixed(1)}%`,
          severity: 'high'
        });
      } else if (data.change < -10) {
        insights.priceAlerts.push({
          product,
          type: 'price_decrease',
          message: `${product} price decreased by ${Math.abs(data.change).toFixed(1)}%`,
          severity: 'medium'
        });
      }
    });

    // Generate recommendations
    insights.recommendations = [
      {
        type: 'planting',
        message: 'Consider planting tomatoes - high demand and good prices',
        priority: 'high'
      },
      {
        type: 'harvesting',
        message: 'Harvest onions now - prices are at peak',
        priority: 'medium'
      }
    ];

    return insights;
  }
}

export default new MarketService();
