import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Express app
const app = express();
app.use(cors({ origin: true }));

// ===========================================
// PRODUCT MANAGEMENT FUNCTIONS
// ===========================================

// Get all products
export const getProducts = functions.https.onRequest(async (req, res) => {
  try {
    const db = admin.firestore();
    const productsSnapshot = await db.collection('products').get();
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
});

// Get product by ID
export const getProduct = functions.https.onRequest(async (req, res) => {
  try {
    const { productId } = req.params;
    const db = admin.firestore();
    const productDoc = await db.collection('products').doc(productId).get();
    
    if (!productDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: productDoc.id,
        ...productDoc.data()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    });
  }
});

// Search products
export const searchProducts = functions.https.onRequest(async (req, res) => {
  try {
    const { query, category } = req.query;
    const db = admin.firestore();
    let productsQuery = db.collection('products');
    
    // Filter by category if provided
    if (category) {
      productsQuery = productsQuery.where('category', '==', category);
    }
    
    const productsSnapshot = await productsQuery.get();
    let products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Filter by search query
    if (query) {
      const searchTerm = (query as string).toLowerCase();
      products = products.filter(product => 
        product.name?.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm)
      );
    }
    
    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search products'
    });
  }
});

// ===========================================
// CART MANAGEMENT FUNCTIONS
// ===========================================

// Add to cart
export const addToCart = functions.https.onRequest(async (req, res) => {
  try {
    const { userId, productId, quantity = 1 } = req.body;
    const db = admin.firestore();
    
    // Get user's cart
    const cartRef = db.collection('carts').doc(userId);
    const cartDoc = await cartRef.get();
    
    let cart = cartDoc.exists ? cartDoc.data() : { items: [] };
    
    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex((item: any) => item.productId === productId);
    
    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }
    
    // Update cart
    await cartRef.set(cart);
    
    res.json({
      success: true,
      message: 'Product added to cart',
      cart: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add to cart'
    });
  }
});

// Get user's cart
export const getCart = functions.https.onRequest(async (req, res) => {
  try {
    const { userId } = req.params;
    const db = admin.firestore();
    const cartDoc = await db.collection('carts').doc(userId).get();
    
    if (!cartDoc.exists) {
      return res.json({
        success: true,
        data: { items: [] }
      });
    }
    
    res.json({
      success: true,
      data: cartDoc.data()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cart'
    });
  }
});

// ===========================================
// AI DISEASE DETECTION FUNCTIONS
// ===========================================

// Analyze disease (placeholder for AI integration)
export const analyzeDisease = functions.https.onRequest(async (req, res) => {
  try {
    const { imageUrl, cropType } = req.body;
    
    // TODO: Integrate with your AI models
    // This is where you'd call Gemini, Google Vision, etc.
    
    const analysisResult = {
      disease: 'Early Blight',
      confidence: 0.85,
      recommendations: [
        'Apply fungicide treatment',
        'Improve air circulation',
        'Monitor soil moisture'
      ],
      products: [
        'Fungicide A',
        'Fungicide B'
      ]
    };
    
    res.json({
      success: true,
      data: analysisResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to analyze disease'
    });
  }
});

// ===========================================
// CATEGORY MANAGEMENT
// ===========================================

// Get all categories
export const getCategories = functions.https.onRequest(async (req, res) => {
  try {
    const db = admin.firestore();
    const categoriesSnapshot = await db.collection('categories').get();
    const categories = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

// ===========================================
// HEALTH CHECK
// ===========================================

export const healthCheck = functions.https.onRequest((req, res) => {
  res.json({
    success: true,
    message: 'AGROF Firebase Functions API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ===========================================
// EXPRESS APP ROUTES (Alternative approach)
// ===========================================

// You can also use Express app for more complex routing
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/products', async (req, res) => {
  try {
    const db = admin.firestore();
    const productsSnapshot = await db.collection('products').get();
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

// Export Express app as Firebase Function
export const api = functions.https.onRequest(app);
