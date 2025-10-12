const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs-extra');
const { marked } = require('marked');
const sqlite3 = require('sqlite3').verbose();
const InventoryAutomation = require('./inventory-automation');
const InventoryReports = require('./inventory-reports');

// Product translation service
const loadProductTranslations = async (language = 'en') => {
  try {
    const translationPath = path.join(__dirname, `../agrof-main/mobile/app/locales/products_${language}.json`);
    if (await fs.pathExists(translationPath)) {
      const translationData = await fs.readJson(translationPath);
      return translationData;
    }
    return {};
  } catch (error) {
    console.error(`Error loading translations for ${language}:`, error);
    return {};
  }
};

const translateProduct = (product, translations) => {
  if (!product || !product.name || !translations) return product;
  
  // Create a mapping from product names to translation keys
  const productNameMapping = {
    'Sugar Baby Watermelon Seeds': 'sugar_baby',
    'Julie F1 Watermelon Seeds': 'julie_f1',
    'Drumhead Cabbage Seeds': 'drumhead_cabbage',
    'Copenhagen Cabbage Seeds': 'copenhagen_cabbage',
    'Corriander Dhania Seeds': 'coriander_dhania',
    'Copenhagen Market Cabbage Seeds': 'copenhagen_cabbage',
    'Sugar Baby': 'sugar_baby',
    'Julie F1': 'julie_f1',
    'Drumhead': 'drumhead_cabbage',
    'Copenhagen': 'copenhagen_cabbage',
    'Corriander Dhania': 'coriander_dhania',
    'Ammonium Sulphate': 'ammonium_sulphate',
    'Urea (Prilled)': 'urea',
    'Dap': 'dap',
    'DAP': 'dap'
  };
  
  // Try to find the translation key
  let productKey = productNameMapping[product.name];
  
  // If no direct mapping, try to create a key from the name
  if (!productKey) {
    productKey = product.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .trim();
  }
  
  console.log(`🌍 Translating product: "${product.name}" -> key: "${productKey}"`);
  console.log(`🌍 Available translation keys:`, Object.keys(translations));
  
  const productTranslations = translations[productKey] || {};
  
  if (productTranslations.name) {
    console.log(`✅ Found translation for ${product.name}: ${productTranslations.name}`);
  } else {
    console.log(`❌ No translation found for ${product.name} (key: ${productKey})`);
  }
  
  return {
    ...product,
    name: productTranslations.name || product.name,
    description: productTranslations.description || product.description,
    overview: productTranslations.overview || product.overview,
    key_features: productTranslations.key_features || product.key_features,
    growing_requirements: productTranslations.growing_requirements || product.growing_requirements,
    planting_instructions: productTranslations.planting_instructions || product.planting_instructions,
    harvesting: productTranslations.harvesting || product.harvesting,
    disease_resistance: productTranslations.disease_resistance || product.disease_resistance,
    yield_potential: productTranslations.yield_potential || product.yield_potential,
    maturity: productTranslations.maturity || product.maturity,
    spacing: productTranslations.spacing || product.spacing,
    seed_rate: productTranslations.seed_rate || product.seed_rate,
    usage_instructions: productTranslations.usage_instructions || product.usage_instructions,
    application_method: productTranslations.application_method || product.application_method,
    benefits: productTranslations.benefits || product.benefits,
    storage_instructions: productTranslations.storage_instructions || product.storage_instructions,
    safety_info: productTranslations.safety_info || product.safety_info,
    price: productTranslations.price || product.price
  };
};

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import messaging routes
const messagingRoutes = require('./messaging');
app.use('/api', messagingRoutes);

// Serve static files from the store directory
const storePath = path.join(__dirname, '../agrof-main/mobile/app/assets/store');
app.use('/api/images', express.static(storePath));

// Database setup
const dbPath = path.join(__dirname, 'store.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Categories table
      db.run(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          display_name TEXT NOT NULL,
          description TEXT,
          image_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Products table
      db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          category_id INTEGER,
          description TEXT,
          price TEXT,
          image_url TEXT,
          specifications TEXT,
          features TEXT,
          usage_instructions TEXT,
          application_method TEXT,
          benefits TEXT,
          storage_instructions TEXT,
          safety_info TEXT,
          availability TEXT DEFAULT 'In Stock',
          quantity_in_stock INTEGER DEFAULT 0,
          minimum_stock_level INTEGER DEFAULT 10,
          maximum_stock_level INTEGER DEFAULT 1000,
          unit_of_measure TEXT DEFAULT 'bags',
          barcode TEXT UNIQUE,
          supplier_name TEXT,
          supplier_contact TEXT,
          cost_price DECIMAL(10,2),
          selling_price DECIMAL(10,2),
          last_restocked_date DATETIME,
          expiry_date DATETIME,
          batch_number TEXT,
          location TEXT DEFAULT 'Warehouse A',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories (id),
          UNIQUE(name, category_id)
        )
      `);

      // Cart items table (for session-based cart)
      db.run(`
        CREATE TABLE IF NOT EXISTS cart_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products (id)
        )
      `);

      // Inventory transactions table
      db.run(`
        CREATE TABLE IF NOT EXISTS inventory_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          transaction_type TEXT NOT NULL CHECK (transaction_type IN ('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER')),
          quantity INTEGER NOT NULL,
          reference_number TEXT,
          notes TEXT,
          created_by TEXT DEFAULT 'system',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products (id)
        )
      `);

      // Low stock alerts table
      db.run(`
        CREATE TABLE IF NOT EXISTS stock_alerts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          alert_type TEXT NOT NULL CHECK (alert_type IN ('LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRY_WARNING')),
          message TEXT NOT NULL,
          is_resolved BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          resolved_at DATETIME,
          FOREIGN KEY (product_id) REFERENCES products (id)
        )
      `);

      // Suppliers table
      db.run(`
        CREATE TABLE IF NOT EXISTS suppliers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          contact_person TEXT,
          phone TEXT,
          email TEXT,
          address TEXT,
          payment_terms TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating tables:', err);
          reject(err);
        } else {
          console.log('Database tables initialized successfully');
          resolve();
        }
      });
    });
  });
};

// Parse individual product markdown file
const parseProductMarkdownFile = async (filePath, language = 'en') => {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const tokens = marked.lexer(content);
    
    const product = {
      name: '',
      description: '',
      price: 'Contact for pricing',
      specifications: '',
      features: '',
      usage_instructions: '',
      application_method: '',
      benefits: '',
      storage_instructions: '',
      safety_info: '',
      overview: '',
      key_features: '',
      growing_requirements: '',
      planting_instructions: '',
      harvesting: '',
      disease_resistance: '',
      yield_potential: '',
      maturity: '',
      spacing: '',
      seed_rate: ''
    };
    
    let currentSection = '';
    
    for (const token of tokens) {
      if (token.type === 'heading') {
        const headingText = token.text.toLowerCase();
        
        if (token.depth === 1) {
          product.name = token.text;
        } else if (token.depth === 2) {
          if (headingText.includes('overview') || headingText.includes('description')) {
            currentSection = 'description';
          } else if (headingText.includes('specification')) {
            currentSection = 'specifications';
          } else if (headingText.includes('feature')) {
            currentSection = 'features';
          } else if (headingText.includes('usage') || headingText.includes('instruction')) {
            currentSection = 'usage_instructions';
          } else if (headingText.includes('application') || headingText.includes('method')) {
            currentSection = 'application_method';
          } else if (headingText.includes('benefit')) {
            currentSection = 'benefits';
          } else if (headingText.includes('storage')) {
            currentSection = 'storage_instructions';
          } else if (headingText.includes('safety')) {
            currentSection = 'safety_info';
          } else if (headingText.includes('price')) {
            currentSection = 'price';
          }
        }
      } else if (token.type === 'paragraph' && currentSection) {
        const text = token.text;
        
        if (currentSection === 'price') {
          // Extract price information - prioritize main price (usually first)
          const priceMatch = text.match(/UGX\s*([0-9,]+(?:\.[0-9]+)?)/i);
          if (priceMatch) {
            // Only set price if not already set (prioritize first/main price)
            if (!product.price || product.price === 'Contact for pricing') {
              product.price = `UGX ${priceMatch[1]}`;
              // Also set selling_price as numeric value
              const numericPrice = parseInt(priceMatch[1].replace(/,/g, ''));
              product.selling_price = numericPrice;
            }
          }
        } else if (product[currentSection]) {
          product[currentSection] += '\n' + text;
        } else {
          product[currentSection] = text;
        }
      } else if (token.type === 'list' && currentSection) {
        const listText = token.items.map(item => item.text).join('\n');
        if (product[currentSection]) {
          product[currentSection] += '\n' + listText;
        } else {
          product[currentSection] = listText;
        }
      }
    }

    return product;
  } catch (error) {
    console.error('Error parsing product markdown file:', error);
    return null;
  }
};

// Parse category markdown file (legacy support)
const parseMarkdownFile = async (filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const tokens = marked.lexer(content);
    const products = [];
    let currentProduct = null;

    for (const token of tokens) {
      if (token.type === 'heading' && token.depth === 1) {
        // New product
        if (currentProduct) {
          products.push(currentProduct);
        }
        currentProduct = {
          name: token.text,
          description: '',
          price: 'Contact for pricing',
          specifications: ''
        };
      } else if (token.type === 'paragraph' && currentProduct) {
        const text = token.text;
        
        // Extract price if mentioned
        const priceMatch = text.match(/price[:\s]*\$?([0-9,]+(?:\.[0-9]+)?)/i);
        if (priceMatch) {
          currentProduct.price = `$${priceMatch[1]}`;
        }
        
        // Extract specifications
        if (text.toLowerCase().includes('specification') || text.toLowerCase().includes('features')) {
          currentProduct.specifications = text;
        } else if (!currentProduct.description) {
          currentProduct.description = text;
        }
      } else if (token.type === 'list' && currentProduct) {
        // Handle lists as specifications
        const listText = token.items.map(item => item.text).join('\n• ');
        currentProduct.specifications += '\n• ' + listText;
      }
    }

    if (currentProduct) {
      products.push(currentProduct);
    }

    return products;
  } catch (error) {
    console.error('Error parsing markdown file:', error);
    return [];
  }
};

// Scan store directory and populate database
const populateDatabase = async () => {
  try {
    console.log('Scanning store directory for products...');
    
    const categories = [
      { name: 'fertilizers', display_name: 'Fertilizers', description: 'Agricultural fertilizers for crop nutrition' },
      { name: 'fungicides', display_name: 'Fungicides', description: 'Plant protection against fungal diseases' },
      { name: 'herbicides', display_name: 'Herbicides', description: 'Weed control solutions' },
      { name: 'nursery_bed', display_name: 'Nursery Bed', description: 'Seedlings and plantlets' },
      { name: 'organic_chemicals', display_name: 'Organic Chemicals', description: 'Organic agricultural chemicals' },
      { name: 'seeds', display_name: 'Seeds', description: 'High-quality agricultural seeds' }
    ];

    // Insert categories
    for (const category of categories) {
      db.run(
        'INSERT OR IGNORE INTO categories (name, display_name, description) VALUES (?, ?, ?)',
        [category.name, category.display_name, category.description]
      );
    }

    // Process each category directory
    for (const category of categories) {
      // Map category names to actual directory names
      const categoryDirMap = {
        'fertilizers': 'FERTLIZERS',
        'fungicides': 'FUNGICIDES', 
        'herbicides': 'HERBICIDE',
        'nursery_bed': 'Nursery_bed',
        'organic_chemicals': 'ORGANIC_CHEMICALS',
        'seeds': 'SEEDS'
      };
      const categoryPath = path.join(storePath, categoryDirMap[category.name] || category.name.toUpperCase());
      
      if (await fs.pathExists(categoryPath)) {
        console.log(`Processing category: ${category.name}`);
        
        // Get category ID
        const categoryId = await new Promise((resolve, reject) => {
          db.get('SELECT id FROM categories WHERE name = ?', [category.name], (err, row) => {
            if (err) reject(err);
            else resolve(row.id);
          });
        });

        // Clear existing products for this category to prevent duplicates
        await new Promise((resolve, reject) => {
          db.run('DELETE FROM products WHERE category_id = ?', [categoryId], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        // Process directories with deduplication logic
        const items = await fs.readdir(categoryPath);
        const processedProducts = new Set(); // Track processed product names
        
        for (const item of items) {
          const itemPath = path.join(categoryPath, item);
          
          try {
            const stat = await fs.stat(itemPath);
            
            // Only process directories (skip files)
            if (stat.isDirectory()) {
              // Normalize product name for deduplication
              const normalizedName = item.toLowerCase().trim();
              
              // Skip if we've already processed a similar product
              if (processedProducts.has(normalizedName)) {
                console.log(`Skipping duplicate: ${item}`);
                continue;
              }
              
              const productFiles = await fs.readdir(itemPath);
              const imageFile = productFiles.find(file => 
                /\.(jpg|jpeg|png|gif)$/i.test(file)
              );
              
              // Check for individual product .md file
              const productMdFile = productFiles.find(file => file === 'product.md');
              let productData = {
                name: item,
                description: 'Agricultural product for farming needs',
                price: 'Contact for pricing',
                quantity_in_stock: Math.floor(Math.random() * 50) + 10, // Random stock 10-60
                minimum_stock_level: Math.floor(Math.random() * 10) + 5, // Min stock 5-15
                maximum_stock_level: Math.floor(Math.random() * 100) + 50, // Max stock 50-150
                cost_price: Math.floor(Math.random() * 50000) + 10000, // Cost 10k-60k UGX
                selling_price: Math.floor(Math.random() * 50000) + 15000, // Selling 15k-65k UGX
                specifications: '',
                features: '',
                usage_instructions: '',
                application_method: '',
                benefits: '',
                storage_instructions: '',
                safety_info: ''
              };
              
              if (productMdFile) {
                // Parse individual product .md file
                const mdPath = path.join(itemPath, productMdFile);
                const parsedProduct = await parseProductMarkdownFile(mdPath);
                if (parsedProduct && parsedProduct.name) {
                  productData = { ...productData, ...parsedProduct };
                }
              }
              
              const imageUrl = imageFile ? 
                `/api/images/${categoryDirMap[category.name] || category.name.toUpperCase()}/${item}/${imageFile}` : 
                null;
              
              // Insert product with enhanced data
              await new Promise((resolve, reject) => {
                db.run(
                  `INSERT INTO products 
                   (name, category_id, description, price, image_url, specifications, features, usage_instructions, application_method, benefits, storage_instructions, safety_info, quantity_in_stock, minimum_stock_level, maximum_stock_level, cost_price, selling_price, created_at, updated_at) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                  [
                    productData.name, 
                    categoryId, 
                    productData.description, 
                    productData.price, 
                    imageUrl, 
                    productData.specifications,
                    productData.features,
                    productData.usage_instructions,
                    productData.application_method,
                    productData.benefits,
                    productData.storage_instructions,
                    productData.safety_info,
                    productData.quantity_in_stock,
                    productData.minimum_stock_level,
                    productData.maximum_stock_level,
                    productData.cost_price,
                    productData.selling_price
                  ],
                  function(err) {
                    if (err) {
                      console.error(`Error inserting product ${item}:`, err.message);
                      reject(err);
                    } else {
                      console.log(`✅ Added: ${item}`);
                      processedProducts.add(normalizedName);
                      resolve();
                    }
                  }
                );
              });
            }
          } catch (error) {
            console.error(`Error processing item ${item}:`, error);
          }
        }
      }
    }
    
    console.log('Database populated successfully');
  } catch (error) {
    console.error('Error populating database:', error);
  }
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'AGROF Store Backend is running' });
});

// Get all categories
app.get('/api/categories', async (req, res) => {
  const { language = 'en' } = req.query;
  
  try {
    const translations = await loadProductTranslations(language);
    const categoryTranslations = translations.categories || {};
    
    db.all('SELECT * FROM categories ORDER BY name', (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Translate category names
      const translatedRows = rows.map(row => ({
        ...row,
        display_name: categoryTranslations[row.name] || row.display_name
      }));
      
      res.json(translatedRows);
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load translations' });
  }
});

// Get products by category
app.get('/api/categories/:categoryId/products', async (req, res) => {
  const { categoryId } = req.params;
  const { language = 'en' } = req.query;
  
  try {
    const translations = await loadProductTranslations(language);
    
    const query = `
      SELECT p.*, c.name as category_name, c.display_name as category_display_name 
      FROM products p 
      JOIN categories c ON p.category_id = c.id 
      WHERE c.name = ? 
      ORDER BY p.name
    `;
    
    db.all(query, [categoryId], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Translate products
      const translatedRows = rows.map(row => translateProduct(row, translations));
      res.json(translatedRows);
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load translations' });
  }
});

// Get all products
app.get('/api/products', async (req, res) => {
  const { search, category, limit = 500, offset = 0, language = 'en' } = req.query;
  
  let query = `
    SELECT p.*, c.name as category_name, c.display_name as category_display_name 
    FROM products p 
    JOIN categories c ON p.category_id = c.id 
    WHERE 1=1
  `;
  const params = [];
  
  if (search) {
    query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  if (category) {
    query += ' AND c.name = ?';
    params.push(category);
  }
  
  query += ' ORDER BY p.name LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  try {
    const translations = await loadProductTranslations(language);
    
    db.all(query, params, (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Translate products
      const translatedRows = rows.map(row => translateProduct(row, translations));
      res.json(translatedRows);
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load translations' });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { language = 'en' } = req.query;
  
  try {
    const translations = await loadProductTranslations(language);
    
    const query = `
      SELECT p.*, c.name as category_name, c.display_name as category_display_name 
      FROM products p 
      JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `;
    
    db.get(query, [id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!row) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      
      // Translate product
      const translatedRow = translateProduct(row, translations);
      res.json(translatedRow);
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load translations' });
  }
});

// Search products
app.get('/api/search', (req, res) => {
  const { q, category } = req.query;
  
  if (!q) {
    res.status(400).json({ error: 'Search query is required' });
    return;
  }
  
  let query = `
    SELECT p.*, c.name as category_name, c.display_name as category_display_name 
    FROM products p 
    JOIN categories c ON p.category_id = c.id 
    WHERE (p.name LIKE ? OR p.description LIKE ? OR p.specifications LIKE ?)
  `;
  const params = [`%${q}%`, `%${q}%`, `%${q}%`];
  
  if (category) {
    query += ' AND c.name = ?';
    params.push(category);
  }
  
  query += ' ORDER BY p.name';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Cart operations
app.post('/api/cart/add', (req, res) => {
  const { sessionId, productId, quantity = 1 } = req.body;
  
  if (!sessionId || !productId) {
    res.status(400).json({ error: 'Session ID and Product ID are required' });
    return;
  }
  
  // Check if item already exists in cart
  db.get(
    'SELECT * FROM cart_items WHERE session_id = ? AND product_id = ?',
    [sessionId, productId],
    (err, existingItem) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (existingItem) {
        // Update quantity
        db.run(
          'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
          [quantity, existingItem.id],
          function(err) {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.json({ message: 'Cart updated successfully', id: existingItem.id });
          }
        );
      } else {
        // Add new item
        db.run(
          'INSERT INTO cart_items (session_id, product_id, quantity) VALUES (?, ?, ?)',
          [sessionId, productId, quantity],
          function(err) {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.json({ message: 'Item added to cart successfully', id: this.lastID });
          }
        );
      }
    }
  );
});

app.get('/api/cart/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  const query = `
    SELECT ci.*, p.name, p.price, p.image_url, c.display_name as category_name
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    WHERE ci.session_id = ?
    ORDER BY ci.created_at DESC
  `;
  
  db.all(query, [sessionId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.delete('/api/cart/:sessionId/item/:itemId', (req, res) => {
  const { sessionId, itemId } = req.params;
  
  db.run(
    'DELETE FROM cart_items WHERE id = ? AND session_id = ?',
    [itemId, sessionId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Cart item not found' });
        return;
      }
      res.json({ message: 'Item removed from cart successfully' });
    }
  );
});

app.put('/api/cart/:sessionId/item/:itemId', (req, res) => {
  const { sessionId, itemId } = req.params;
  const { quantity } = req.body;
  
  if (!quantity || quantity < 1) {
    res.status(400).json({ error: 'Valid quantity is required' });
    return;
  }
  
  db.run(
    'UPDATE cart_items SET quantity = ? WHERE id = ? AND session_id = ?',
    [quantity, itemId, sessionId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Cart item not found' });
        return;
      }
      res.json({ message: 'Cart item updated successfully' });
    }
  );
});

app.delete('/api/cart/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  db.run(
    'DELETE FROM cart_items WHERE session_id = ?',
    [sessionId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Cart cleared successfully' });
    }
  );
});

// ==================== INVENTORY MANAGEMENT API ENDPOINTS ====================

// Get inventory status for all products
app.get('/api/inventory/status', (req, res) => {
  const query = `
    SELECT 
      p.id,
      p.name,
      p.quantity_in_stock,
      p.minimum_stock_level,
      p.maximum_stock_level,
      p.unit_of_measure,
      p.availability,
      p.last_restocked_date,
      c.display_name as category_name,
      CASE 
        WHEN p.quantity_in_stock <= 0 THEN 'OUT_OF_STOCK'
        WHEN p.quantity_in_stock <= p.minimum_stock_level THEN 'LOW_STOCK'
        ELSE 'IN_STOCK'
      END as stock_status
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.name
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get low stock alerts
app.get('/api/inventory/alerts', (req, res) => {
  const query = `
    SELECT 
      sa.*,
      p.name as product_name,
      p.quantity_in_stock,
      p.minimum_stock_level
    FROM stock_alerts sa
    JOIN products p ON sa.product_id = p.id
    WHERE sa.is_resolved = FALSE
    ORDER BY sa.created_at DESC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Update product stock
app.post('/api/inventory/update-stock', (req, res) => {
  const { productId, quantity, transactionType, notes, referenceNumber } = req.body;
  
  if (!productId || !quantity || !transactionType) {
    res.status(400).json({ error: 'Product ID, quantity, and transaction type are required' });
    return;
  }
  
  // Start transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Get current stock
    db.get('SELECT quantity_in_stock FROM products WHERE id = ?', [productId], (err, product) => {
      if (err) {
        db.run('ROLLBACK');
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (!product) {
        db.run('ROLLBACK');
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      
      let newQuantity = product.quantity_in_stock;
      
      // Calculate new quantity based on transaction type
      switch (transactionType) {
        case 'IN':
          newQuantity += quantity;
          break;
        case 'OUT':
          newQuantity -= quantity;
          if (newQuantity < 0) {
            db.run('ROLLBACK');
            res.status(400).json({ error: 'Insufficient stock' });
            return;
          }
          break;
        case 'ADJUSTMENT':
          newQuantity = quantity;
          break;
        default:
          db.run('ROLLBACK');
          res.status(400).json({ error: 'Invalid transaction type' });
          return;
      }
      
      // Update product stock
      db.run(
        'UPDATE products SET quantity_in_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newQuantity, productId],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            res.status(500).json({ error: err.message });
            return;
          }
          
          // Record transaction
          db.run(
            'INSERT INTO inventory_transactions (product_id, transaction_type, quantity, reference_number, notes) VALUES (?, ?, ?, ?, ?)',
            [productId, transactionType, quantity, referenceNumber, notes],
            function(err) {
              if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: err.message });
                return;
              }
              
              // Check for low stock alerts
              db.get('SELECT minimum_stock_level FROM products WHERE id = ?', [productId], (err, product) => {
                if (err) {
                  db.run('ROLLBACK');
                  res.status(500).json({ error: err.message });
                  return;
                }
                
                if (newQuantity <= product.minimum_stock_level) {
                  const alertType = newQuantity <= 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK';
                  const message = newQuantity <= 0 
                    ? `Product is out of stock` 
                    : `Product stock is below minimum level (${newQuantity}/${product.minimum_stock_level})`;
                  
                  db.run(
                    'INSERT INTO stock_alerts (product_id, alert_type, message) VALUES (?, ?, ?)',
                    [productId, alertType, message],
                    function(err) {
                      if (err) {
                        console.error('Error creating stock alert:', err);
                      }
                      db.run('COMMIT');
                      res.json({ 
                        message: 'Stock updated successfully',
                        newQuantity: newQuantity,
                        alertCreated: newQuantity <= product.minimum_stock_level
                      });
                    }
                  );
                } else {
                  db.run('COMMIT');
                  res.json({ 
                    message: 'Stock updated successfully',
                    newQuantity: newQuantity
                  });
                }
              });
            }
          );
        }
      );
    });
  });
});

// Get inventory transactions
app.get('/api/inventory/transactions', (req, res) => {
  const { productId, limit = 50, offset = 0 } = req.query;
  
  let query = `
    SELECT 
      it.*,
      p.name as product_name
    FROM inventory_transactions it
    JOIN products p ON it.product_id = p.id
  `;
  
  const params = [];
  if (productId) {
    query += ' WHERE it.product_id = ?';
    params.push(productId);
  }
  
  query += ' ORDER BY it.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Resolve stock alert
app.put('/api/inventory/alerts/:alertId/resolve', (req, res) => {
  const { alertId } = req.params;
  
  db.run(
    'UPDATE stock_alerts SET is_resolved = TRUE, resolved_at = CURRENT_TIMESTAMP WHERE id = ?',
    [alertId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Alert not found' });
        return;
      }
      res.json({ message: 'Alert resolved successfully' });
    }
  );
});

// Get inventory analytics
app.get('/api/inventory/analytics', (req, res) => {
  const queries = {
    totalProducts: 'SELECT COUNT(*) as count FROM products',
    outOfStock: 'SELECT COUNT(*) as count FROM products WHERE quantity_in_stock <= 0',
    lowStock: 'SELECT COUNT(*) as count FROM products WHERE quantity_in_stock > 0 AND quantity_in_stock <= minimum_stock_level',
    totalValue: 'SELECT SUM(quantity_in_stock * COALESCE(selling_price, 0)) as value FROM products',
    recentTransactions: `
      SELECT COUNT(*) as count 
      FROM inventory_transactions 
      WHERE created_at >= datetime('now', '-7 days')
    `
  };
  
  const results = {};
  let completed = 0;
  const total = Object.keys(queries).length;
  
  Object.entries(queries).forEach(([key, query]) => {
    db.get(query, (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      results[key] = row.count || row.value || 0;
      completed++;
      
      if (completed === total) {
        res.json(results);
      }
    });
  });
});

// Generate barcodes for products without them
app.post('/api/inventory/generate-barcodes', (req, res) => {
  db.all('SELECT id FROM products WHERE barcode IS NULL', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (rows.length === 0) {
      res.json({ message: 'All products already have barcodes', count: 0 });
      return;
    }

    let completed = 0;
    const results = [];

    rows.forEach(row => {
      const barcode = `AGROF${row.id.toString().padStart(4, '0')}${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      
      db.run('UPDATE products SET barcode = ? WHERE id = ?', [barcode, row.id], function(err) {
        if (err) {
          console.error('Error assigning barcode:', err);
        } else {
          results.push({ productId: row.id, barcode });
        }
        
        completed++;
        if (completed === rows.length) {
          res.json({ 
            message: `Generated ${results.length} barcodes`, 
            count: results.length,
            results 
          });
        }
      });
    });
  });
});

// Scan barcode endpoint
app.get('/api/inventory/scan/:barcode', (req, res) => {
  const { barcode } = req.params;
  
  db.get('SELECT * FROM products WHERE barcode = ?', [barcode], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    
    res.json(row);
  });
});

// Serve inventory dashboard
app.get('/inventory', (req, res) => {
  res.sendFile(path.join(__dirname, 'inventory-dashboard.html'));
});

// Test dashboard route
app.get('/test-inventory', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-dashboard.html'));
});

// Diagnostic route
app.get('/diagnostic', (req, res) => {
  res.sendFile(path.join(__dirname, 'diagnostic.html'));
});

// ==================== INVENTORY AUTOMATION ENDPOINTS ====================

// Initialize stock levels for existing products
app.post('/api/inventory/initialize-stock', async (req, res) => {
  try {
    const automation = new InventoryAutomation(dbPath);
    const result = await automation.initializeStockLevels();
    automation.close();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Run daily automation tasks
app.post('/api/inventory/run-daily-tasks', async (req, res) => {
  try {
    const automation = new InventoryAutomation(dbPath);
    const result = await automation.runDailyTasks();
    automation.close();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reorder suggestions
app.get('/api/inventory/reorder-suggestions', async (req, res) => {
  try {
    const automation = new InventoryAutomation(dbPath);
    const result = await automation.generateReorderSuggestions();
    automation.close();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simulate daily sales (for testing)
app.post('/api/inventory/simulate-sales', async (req, res) => {
  try {
    const automation = new InventoryAutomation(dbPath);
    const result = await automation.simulateDailySales();
    automation.close();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== INVENTORY REPORTS ENDPOINTS ====================

// Generate comprehensive inventory report
app.get('/api/inventory/reports/comprehensive', async (req, res) => {
  try {
    const reports = new InventoryReports(dbPath);
    const result = await reports.generateInventoryReport();
    reports.close();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate reorder report
app.get('/api/inventory/reports/reorder', async (req, res) => {
  try {
    const reports = new InventoryReports(dbPath);
    const result = await reports.generateReorderReport();
    reports.close();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate sales analysis report
app.get('/api/inventory/reports/sales', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const reports = new InventoryReports(dbPath);
    const result = await reports.generateSalesAnalysis(parseInt(days));
    reports.close();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate supplier performance report
app.get('/api/inventory/reports/suppliers', async (req, res) => {
  try {
    const reports = new InventoryReports(dbPath);
    const result = await reports.generateSupplierReport();
    reports.close();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export inventory data to CSV
app.get('/api/inventory/export/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const reports = new InventoryReports(dbPath);
    
    let data, filename;
    
    switch (type) {
      case 'inventory':
        const inventoryReport = await reports.generateInventoryReport();
        data = inventoryReport.categories;
        filename = 'inventory_summary';
        break;
      case 'reorder':
        const reorderReport = await reports.generateReorderReport();
        data = reorderReport.items;
        filename = 'reorder_suggestions';
        break;
      case 'sales':
        const salesReport = await reports.generateSalesAnalysis(30);
        data = salesReport.allProducts;
        filename = 'sales_analysis';
        break;
      default:
        throw new Error('Invalid export type');
    }
    
    const filePath = reports.exportToCSV(data, filename);
    reports.close();
    
    res.download(filePath, `${filename}.csv`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    await initializeDatabase();
    await populateDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 AGROF Store Backend running on port ${PORT}`);
      console.log(`📁 Store directory: ${storePath}`);
      console.log(`🗄️  Database: ${dbPath}`);
      console.log(`🌐 Server accessible from all network interfaces`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});
