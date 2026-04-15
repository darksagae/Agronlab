# AGROF E-Commerce Store Integration

A complete e-commerce store integration for the AGROF agricultural mobile application, featuring a backend API server and enhanced frontend with shopping cart functionality.

## 🌟 Features

### Backend Features
- **Automatic Product Discovery**: Scans store directory and parses markdown files
- **RESTful API**: Complete CRUD operations for products, categories, and cart
- **Image Serving**: Serves product images from the store directory
- **Search Functionality**: Full-text search across products
- **Session-based Cart**: Manages shopping cart per user session
- **SQLite Database**: Lightweight database for data persistence
- **Markdown Parsing**: Extracts product information from markdown files

### Frontend Features
- **Enhanced Store Screen**: Modern UI with search, featured products, and categories
- **Product Detail Screen**: Comprehensive product information with add to cart
- **Shopping Cart**: Full cart management with quantity updates and checkout
- **Search Functionality**: Real-time product search
- **Offline Support**: Caches data for offline access
- **Backend Integration**: Seamless API integration with fallback support
- **Responsive Design**: Optimized for mobile devices

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Make the script executable and run it
chmod +x start-store.sh
./start-store.sh
```

This script will:
1. Install dependencies for both backend and frontend
2. Start the backend server on http://localhost:3001
3. Start the Expo development server
4. Handle cleanup when you stop the services

### Option 2: Manual Setup

#### Backend Setup
```bash
cd store-backend
npm install
npm run dev
```

#### Frontend Setup
```bash
cd agrof-main/mobile/app
npm install
npm start
```

## 📁 Project Structure

```
agrof1/
├── agrof-main/
│   └── mobile/
│       └── app/                 # Existing Expo React Native app
│           ├── assets/
│           │   └── store/       # Product images and data
│           │       ├── FERTLIZERS/
│           │       ├── FUNGICIDES/
│           │       ├── HERBICIDE/
│           │       ├── Nursery_bed/
│           │       ├── ORGANIC_CHEMICALS/
│           │       └── SEEDS/
│           ├── screens/         # Store screens
│           │   ├── StoreScreen.js
│           │   ├── CartScreen.js
│           │   └── ProductDetailScreen.js
│           ├── services/        # API services
│           │   └── storeApi.js
│           ├── contexts/        # Cart context
│           │   └── CartContext.js
│           └── package.json
├── store-backend/               # New backend server
│   ├── server.js
│   ├── package.json
│   └── README.md
├── start-store.sh              # Quick start script
├── SETUP_INSTRUCTIONS.md       # Detailed setup guide
└── README.md                   # This file
```

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite3** - Database
- **Marked** - Markdown parsing
- **Multer** - File handling
- **CORS** - Cross-origin requests
- **Helmet** - Security headers

### Frontend
- **React Native** - Mobile framework
- **Expo** - Development platform
- **AsyncStorage** - Local storage
- **React Context** - State management
- **Material Icons** - UI icons

## 📱 Screenshots

The e-commerce store includes:

1. **Store Home Screen** - Featured products, categories, and search
2. **Product Categories** - Organized by agricultural product types
3. **Product Detail Screen** - Comprehensive product information
4. **Shopping Cart** - Full cart management and checkout
5. **Search Results** - Real-time product search

## 🔧 Configuration

### Backend Configuration

The backend automatically scans the store directory. To modify the path, edit `store-backend/server.js`:

```javascript
const storePath = path.join(__dirname, '../agrof-main/mobile/app/assets/store');
```

### Frontend Configuration

Update the API URL in `services/storeApi.js` if needed:

```javascript
const API_BASE_URL = 'http://localhost:3001/api';
```

## 📊 API Endpoints

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:categoryId/products` - Get products by category

### Products
- `GET /api/products` - Get all products (with optional filters)
- `GET /api/products/:id` - Get single product
- `GET /api/search?q=query` - Search products

### Cart
- `POST /api/cart/add` - Add item to cart
- `GET /api/cart/:sessionId` - Get cart items
- `PUT /api/cart/:sessionId/item/:itemId` - Update cart item
- `DELETE /api/cart/:sessionId/item/:itemId` - Remove cart item
- `DELETE /api/cart/:sessionId` - Clear cart

### Images
- `GET /api/images/*` - Serve product images

## 🎯 Usage

1. **Browse Products**: Navigate to the Store tab in your Expo app
2. **Search**: Use the search bar to find specific products
3. **View Details**: Tap on products to see detailed information
4. **Add to Cart**: Add products to your shopping cart
5. **Checkout**: Complete your purchase (simulated)

## 🔍 Product Data Structure

Products are automatically discovered from the store directory structure:

```
store/
├── FERTLIZERS/
│   ├── Product Name/
│   │   └── image.jpg
│   └── fertilizer_product_details.md
├── FUNGICIDES/
│   └── ...
```

Markdown files can contain:
- Product names (as headings)
- Descriptions
- Prices
- Specifications
- Features

## 🚨 Troubleshooting

### Common Issues

1. **Backend won't start**
   - Check if port 3001 is available
   - Ensure Node.js is installed
   - Run `npm install` in the backend directory

2. **Frontend can't connect to backend**
   - Verify backend is running on http://localhost:3001
   - Check network connectivity
   - App works offline with cached data

3. **Images not loading**
   - Ensure backend is running
   - Check image file paths
   - Fallback images are used if backend fails

4. **Cart not persisting**
   - Clear app data if cart becomes corrupted
   - Check AsyncStorage permissions

## 🔄 Development

### Adding New Products

1. Add product images to the appropriate category folder
2. Create or update markdown files with product information
3. Restart the backend server to scan for new products

### Customizing the UI

- Modify styles in the respective screen files
- Update colors and themes in StyleSheet objects
- Add new features by extending existing components

### Extending the API

- Add new endpoints in `store-backend/server.js`
- Update the frontend API service in `services/storeApi.js`
- Add corresponding UI components as needed

## 📈 Performance

- **Image Optimization**: Lazy loading and caching
- **API Caching**: 5-minute cache for API responses
- **Offline Support**: Cached data for offline access
- **Database Optimization**: Indexed queries for fast searches

## 🔒 Security

- **CORS Protection**: Configured for cross-origin requests
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Helmet security headers

## 🚀 Production Deployment

### Backend Deployment
1. Set up production server (VPS, cloud instance)
2. Install Node.js and dependencies
3. Set environment variables
4. Use PM2 for process management
5. Set up Nginx reverse proxy
6. Configure SSL certificates

### Frontend Deployment
1. Build Expo app for production
2. Deploy to app stores
3. Or deploy as web app using Expo web build

## 📝 License

This e-commerce integration is part of the AGROF project and follows the same licensing terms.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues or questions:
1. Check the console logs for error messages
2. Verify all dependencies are installed
3. Ensure both backend and frontend are running
4. Check the API endpoints are accessible

## 🎉 Success!

You now have a fully functional e-commerce store integrated into your AGROF agricultural mobile application! The store features modern UI, comprehensive product management, shopping cart functionality, and seamless backend integration.

Happy farming! 🌱

