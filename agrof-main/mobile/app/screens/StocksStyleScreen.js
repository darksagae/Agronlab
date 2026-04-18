import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated,
  PanResponder,
  Vibration,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

// Function to get crop image based on product name
const getCropImage = (productName) => {
  const imageMap = {
    'Maize': require('../assets/crops/maize.png'),
    'Coffee': require('../assets/crops/coffee.png'),
    'Rice': require('../assets/crops/rice.png'),
    'Bananas': require('../assets/crops/banana.png'),
    'Tomatoes': require('../assets/crops/tomatoes.png'),
    'Beans': require('../assets/crops/beans.png'),
    'Avocados': require('../assets/crops/avocados.png'),
    'Pineapples': require('../assets/crops/pineapple.png'),
    'Oranges': require('../assets/crops/orangoes.png'),
    'Mangoes': require('../assets/crops/mangoes.png'),
    'Cotton': require('../assets/crops/cotton.png'),
    'Groundnuts': require('../assets/crops/groundnuts.png'),
    'Sugarcane': require('../assets/crops/sugarcane.png'),
    'Soya Beans': require('../assets/crops/soyabeans.png'),
    'Cabbage': require('../assets/crops/cabbage.png'),
    'Carrots': require('../assets/crops/carrot.png'),
    'Onions': require('../assets/crops/onions.png'),
    'Spinach': require('../assets/crops/spinach.png'),
    'Millet': require('../assets/crops/millet.png'),
  };
  
  return imageMap[productName] || require('../assets/crops/maize.png'); // Default fallback
};

// Mock agricultural product data with price trends
const agriculturalProducts = [
  // Grains
  {
    id: 1,
    name: 'Maize',
    currentPrice: 1000,
    previousPrice: 950,
    trend: 'bullish',
    priceChange: 5.3,
    category: 'Grains',
    chartData: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        data: [2300, 2350, 2320, 2450, 2420, 2490, 2500],
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2
      }]
    }
  },
  {
    id: 2,
    name: 'Millet',
    currentPrice: 7000,
    previousPrice: 6800,
    trend: 'bullish',
    priceChange: 2.9,
    category: 'Grains',
    chartData: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        data: [3200, 3180, 3150, 3220, 3100, 3180, 3150],
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2
      }]
    }
  },
  {
    id: 3,
    name: 'Rice',
    currentPrice: 3800,
    previousPrice: 3700,
    trend: 'bullish',
    priceChange: 2.7,
    category: 'Grains',
    chartData: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        data: [4200, 4250, 4300, 4350, 4400, 4420, 4450],
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2
      }]
    }
  },
  // Legumes
  {
    id: 4,
    name: 'Beans',
    currentPrice: 2900,
    previousPrice: 3000,
    trend: 'bearish',
    priceChange: -3.3,
    category: 'Legumes',
    chartData: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        data: [3800, 3780, 3750, 3820, 3700, 3780, 3750],
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2
      }]
    }
  },
  {
    id: 5,
    name: 'Soya Beans',
    currentPrice: 5000,
    previousPrice: 4800,
    trend: 'bullish',
    priceChange: 4.2,
    category: 'Legumes',
    chartData: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        data: [4000, 4050, 4020, 4080, 4100, 4150, 4200],
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2
      }]
    }
  },
  {
    id: 6,
    name: 'Groundnuts',
    currentPrice: 4300,
    previousPrice: 4200,
    trend: 'bullish',
    priceChange: 2.4,
    category: 'Legumes',
    chartData: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        data: [5450, 5500, 5480, 5550, 5520, 5580, 5600],
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2
      }]
    }
  },
  // Cash Crops
  {
    id: 7,
    name: 'Coffee',
    currentPrice: 6000,
    previousPrice: 5800,
    trend: 'bullish',
    priceChange: 3.4,
    category: 'Cash Crops',
    chartData: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        data: [8450, 8500, 8480, 8550, 8600, 8650, 8700],
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2
      }]
    }
  },
  {
    id: 8,
    name: 'Cotton',
    currentPrice: 3300,
    previousPrice: 3150,
    trend: 'bullish',
    priceChange: 4.8,
    category: 'Cash Crops',
    chartData: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        data: [3150, 3200, 3180, 3250, 3220, 3280, 3300],
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2
      }]
    }
  },
  {
    id: 9,
    name: 'Sugarcane',
    currentPrice: 500,
    previousPrice: 480,
    trend: 'bullish',
    category: 'Cash Crops',
    chartData: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        data: [1800, 1780, 1750, 1820, 1700, 1780, 1750],
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2
      }]
    }
  },
  // Vegetables
  {
    id: 10,
    name: 'Tomatoes',
    currentPrice: 4450,
    previousPrice: 4500,
    trend: 'bearish',
    category: 'Vegetables',
    chartData: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        data: [4500, 4480, 4450, 4520, 4400, 4480, 4450],
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2
      }]
    }
  },
  {
    id: 11,
    name: 'Onions',
    currentPrice: 300,
    previousPrice: 320,
    trend: 'bearish',
    category: 'Vegetables',
    chartData: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        data: [3800, 3780, 3750, 3820, 3700, 3780, 3750],
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2
      }]
    }
  },
  {
    id: 12,
    name: 'Cabbage',
    currentPrice: 2900,
    previousPrice: 2750,
    trend: 'bullish',
    priceChange: 5.5,
    category: 'Vegetables',
    chartData: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        data: [2750, 2800, 2780, 2850, 2820, 2880, 2900],
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2
      }]
    }
  },
  {
    id: 13,
    name: 'Carrots',
    currentPrice: 100,
    previousPrice: 95,
    trend: 'bullish',
    priceChange: 5.3,
    category: 'Vegetables',
    chartData: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        data: [3150, 3200, 3180, 3250, 3220, 3280, 3300],
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2
      }]
    }
  },
  {
    id: 14,
    name: 'Spinach',
    currentPrice: 1450,
    previousPrice: 1500,
    trend: 'bearish',
    category: 'Vegetables',
    chartData: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        data: [1500, 1480, 1450, 1520, 1400, 1480, 1450],
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2
      }]
    }
  },
  // Fruits
  {
    id: 15,
    name: 'Bananas',
    currentPrice: 1000,
    previousPrice: 950,
    trend: 'bullish',
    category: 'Fruits',
    chartData: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        data: [2200, 2180, 2150, 2220, 2100, 2180, 2150],
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2
      }]
    }
  },
  {
    id: 16,
    name: 'Mangoes',
    currentPrice: 500,
    previousPrice: 480,
    trend: 'bullish',
    category: 'Fruits',
    chartData: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        data: [1800, 1780, 1750, 1820, 1700, 1780, 1750],
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2
      }]
    }
  },
  {
    id: 17,
    name: 'Oranges',
    currentPrice: 500,
    previousPrice: 480,
    trend: 'bullish',
    priceChange: 4.2,
    category: 'Fruits',
    chartData: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        data: [2450, 2500, 2480, 2550, 2520, 2580, 2600],
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2
      }]
    }
  },
  {
    id: 18,
    name: 'Pineapples',
    currentPrice: 3150,
    previousPrice: 3200,
    trend: 'bearish',
    category: 'Fruits',
    chartData: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        data: [3200, 3180, 3150, 3220, 3100, 3180, 3150],
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2
      }]
    }
  },
  {
    id: 19,
    name: 'Avocados',
    currentPrice: 4450,
    previousPrice: 4500,
    trend: 'bearish',
    category: 'Fruits',
    chartData: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        data: [4500, 4480, 4450, 4520, 4400, 4480, 4450],
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2
      }]
    }
  },
  {
    id: 20,
    name: 'Watermelons',
    currentPrice: 2750,
    previousPrice: 2800,
    trend: 'bearish',
    category: 'Fruits',
    chartData: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        data: [2800, 2780, 2750, 2820, 2700, 2780, 2750],
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2
      }]
    }
  }
];

// Mock agricultural news data
const agriculturalNews = [
  {
    id: 1,
    title: 'Uganda Agricultural Sector Shows Strong Growth in Q4 2024',
    summary: 'The agricultural sector in Uganda has demonstrated remarkable resilience with a 15% increase in productivity compared to the previous quarter.',
    timestamp: '2 hours ago',
    source: 'AGRON News'
  },
  {
    id: 2,
    title: 'New Hybrid Seed Varieties Boost Crop Yields',
    summary: 'Farmers report 30% increase in yields after adopting new hybrid seed varieties available through AGRON platform.',
    timestamp: '4 hours ago',
    source: 'AGRON Research'
  },
  {
    id: 3,
    title: 'Organic Fertilizer Demand Surges in Eastern Uganda',
    summary: 'Growing demand for organic fertilizers as farmers shift towards sustainable farming practices.',
    timestamp: '6 hours ago',
    source: 'AGRON Market'
  },
  {
    id: 4,
    title: 'Maize Prices Hit Record High in Central Region',
    summary: 'Maize prices have reached UGX 1,200 per kilogram in the central region due to increased demand and supply constraints.',
    timestamp: '8 hours ago',
    source: 'AGRON Market'
  },
  {
    id: 5,
    title: 'Coffee Export Revenue Increases by 25%',
    summary: 'Uganda coffee exports have generated $1.2 billion in revenue this quarter, marking a significant improvement from last year.',
    timestamp: '10 hours ago',
    source: 'AGRON Export'
  },
  {
    id: 6,
    title: 'New Irrigation Technology Adopted by 500+ Farmers',
    summary: 'Smart irrigation systems are helping farmers reduce water usage by 40% while increasing crop yields by 20%.',
    timestamp: '12 hours ago',
    source: 'AGRON Tech'
  },
  {
    id: 7,
    title: 'Beans Production Up 18% in Northern Uganda',
    summary: 'Northern region farmers report excellent bean harvests with improved varieties showing drought resistance.',
    timestamp: '14 hours ago',
    source: 'AGRON Regional'
  },
  {
    id: 8,
    title: 'Government Announces New Agricultural Subsidies',
    summary: 'New subsidy program will provide 50% discount on fertilizers and seeds for small-scale farmers across Uganda.',
    timestamp: '16 hours ago',
    source: 'AGRON Policy'
  },
  {
    id: 9,
    title: 'Soya Beans Market Shows Bullish Trend',
    summary: 'Soya beans prices continue to rise with strong demand from both local and international markets.',
    timestamp: '18 hours ago',
    source: 'AGRON Trading'
  },
  {
    id: 10,
    title: 'Millet Harvest Exceeds Expectations',
    summary: 'Millet farmers in the eastern region report bumper harvests with yields 35% above projections.',
    timestamp: '20 hours ago',
    source: 'AGRON Harvest'
  },
  {
    id: 11,
    title: 'Digital Farming Tools Gain Popularity',
    summary: 'Mobile apps and digital platforms are helping farmers make data-driven decisions about planting and harvesting.',
    timestamp: '22 hours ago',
    source: 'AGRON Digital'
  },
  {
    id: 12,
    title: 'Climate-Smart Agriculture Practices Expand',
    summary: 'Over 1,000 farmers have adopted climate-smart techniques to combat changing weather patterns.',
    timestamp: '1 day ago',
    source: 'AGRON Climate'
  }
];

const StocksStyleScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(agriculturalProducts);
  const [newsPanelHeight, setNewsPanelHeight] = useState(0);
  const [showWidget, setShowWidget] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const widgetScale = useRef(new Animated.Value(0)).current;
  const widgetOpacity = useRef(new Animated.Value(0)).current;
  const marqueeAnimation = useRef(new Animated.Value(0)).current;

  // Filter products based on search query
  // Update date from internet/system settings every minute
  useEffect(() => {
    const updateDate = () => {
      setCurrentDate(new Date());
    };

    // Update immediately
    updateDate();

    // Update every minute
    const interval = setInterval(updateDate, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(agriculturalProducts);
    } else {
      const filtered = agriculturalProducts.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery]);

  // Marquee animation for product graphs
  // Continuous marquee animation for both active and inactive states
  useEffect(() => {
    let marqueeLoop;
    
    const startMarquee = () => {
      // Reset animation value
      marqueeAnimation.setValue(0);
      
      marqueeLoop = Animated.loop(
        Animated.timing(marqueeAnimation, {
          toValue: -width,
          duration: 12000, // Slower for better visibility
          useNativeDriver: true,
        })
      );
      marqueeLoop.start();
    };
    
    // Start marquee immediately and continuously
    startMarquee();
    
    // Cleanup function
    return () => {
      if (marqueeLoop) {
        marqueeLoop.stop();
      }
    };
  }, []);

  // Widget animation functions
  const showWidgetAnimation = () => {
    setShowWidget(true);
    Animated.parallel([
      Animated.spring(widgetScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(widgetOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideWidgetAnimation = () => {
    Animated.parallel([
      Animated.spring(widgetScale, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(widgetOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowWidget(false);
    });
  };

  const formatPrice = (price) => {
    return `UGX ${price.toLocaleString()}`;
  };

  const calculatePriceChange = (current, previous) => {
    const change = current - previous;
    const percentage = ((change / previous) * 100).toFixed(2);
    return { change, percentage };
  };

  const renderProductCard = (product) => {
    const { change, percentage } = calculatePriceChange(product.currentPrice, product.previousPrice);
    const isPositive = change >= 0;

    return (
      <TouchableOpacity 
        key={product.id} 
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductTrading', { product })}
      >
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={styles.productCategory}>{product.category}</Text>
        </View>
        
        <View style={styles.chartContainer}>
          <Image 
            source={getCropImage(product.name)} 
            style={styles.cropImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.priceInfo}>
          <Text style={styles.currentPrice}>
            {formatPrice(product.currentPrice)}
          </Text>
          <View style={[styles.priceChange, isPositive ? styles.positiveChange : styles.negativeChange]}>
            <MaterialIcons 
              name={isPositive ? 'trending-up' : 'trending-down'} 
              size={12} 
              color={isPositive ? '#22c55e' : '#ef4444'} 
            />
            <Text style={[styles.changeText, isPositive ? styles.positiveText : styles.negativeText]}>
              {isPositive ? '+' : ''}{percentage}%
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMarqueeProducts = () => {
    return (
      <Animated.View style={[styles.marqueeContainer, { transform: [{ translateX: marqueeAnimation }] }]}>
        {agriculturalProducts.map((product, index) => (
          <View key={`marquee-${product.id}`} style={styles.marqueeItem}>
            <Text style={styles.marqueeProductName}>{product.name}</Text>
            <View style={styles.marqueeChart}>
              <View style={styles.marqueeChartStyle}>
                {product.chartData.datasets[0].data.map((value, index) => {
                  const maxValue = Math.max(...product.chartData.datasets[0].data);
                  const minValue = Math.min(...product.chartData.datasets[0].data);
                  const height = ((value - minValue) / (maxValue - minValue)) * 15;
                  const isLast = index === product.chartData.datasets[0].data.length - 1;
                  
                  return (
                    <View
                      key={index}
                      style={[
                        styles.marqueeChartBar,
                        {
                          height: Math.max(height, 1),
                          backgroundColor: product.trend === 'bullish' ? '#22c55e' : '#ef4444',
                          marginRight: isLast ? 0 : 1,
                        }
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          </View>
        ))}
      </Animated.View>
    );
  };

  const renderNewsItem = (news) => (
    <View key={news.id} style={styles.newsItem}>
      <Text style={styles.newsTitle}>{news.title}</Text>
      <Text style={styles.newsSummary}>{news.summary}</Text>
      <View style={styles.newsMeta}>
        <Text style={styles.newsSource}>{news.source}</Text>
        <Text style={styles.newsTimestamp}>{news.timestamp}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.appName}>AGRON</Text>
          <Text style={styles.phoneNumber}>+256 705 223 777</Text>
          <Text style={styles.date}>
            {currentDate.toLocaleDateString('en-US', { 
              weekday: 'short', 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}
          </Text>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('search.placeholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666"
          />
        </View>
      </View>

      {/* Products List */}
      <ScrollView style={styles.productsContainer} showsVerticalScrollIndicator={false}>
        {filteredProducts.map(renderProductCard)}
      </ScrollView>

        {/* Simple Bottom Panel */}
        <View style={styles.bottomPanel}>
          <TouchableOpacity 
            style={styles.panelButton}
            onPress={() => {
              if (showWidget) {
                hideWidgetAnimation();
              } else {
                showWidgetAnimation();
              }
            }}
          >
            <View style={styles.panelButtonContent}>
              <MaterialIcons name="trending-up" size={20} color="#4CAF50" />
              <Text style={styles.panelButtonText}>Business News</Text>
              <MaterialIcons 
                name={showWidget ? "keyboard-arrow-down" : "keyboard-arrow-up"} 
                size={20} 
                color="#4CAF50" 
              />
            </View>
          </TouchableOpacity>
        {/* Market Data Widget */}
        {showWidget && (
          <Animated.View 
            style={[
              styles.marketWidget,
              {
                transform: [{ scale: widgetScale }],
                opacity: widgetOpacity,
              }
            ]}
          >
            <View style={styles.widgetHeader}>
              <Text style={styles.widgetTitle}>Business News</Text>
              <TouchableOpacity onPress={hideWidgetAnimation}>
                <MaterialIcons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            {/* Scrolling Marquee */}
            <View style={styles.widgetMarqueeContainer}>
              <Animated.View style={[
                styles.widgetMarqueeScroll,
                { transform: [{ translateX: marqueeAnimation }] }
              ]}>
                {agriculturalProducts.map((product, index) => (
                  <View key={index} style={styles.widgetMarqueeItem}>
                    <Text style={styles.widgetProductName}>{product.name}</Text>
                    <Image 
                      source={getCropImage(product.name)} 
                      style={styles.cropImage}
                      resizeMode="cover"
                    />
                    <Text style={[
                      styles.widgetPrice,
                      { color: product.trend === 'bullish' ? '#22c55e' : '#ef4444' }
                    ]}>
                      UGX {product.currentPrice.toLocaleString()}
                    </Text>
                  </View>
                ))}
                {/* Duplicate for seamless loop */}
                {agriculturalProducts.map((product, index) => (
                  <View key={`duplicate-${index}`} style={styles.widgetMarqueeItem}>
                    <Text style={styles.widgetProductName}>{product.name}</Text>
                    <Image 
                      source={getCropImage(product.name)} 
                      style={styles.cropImage}
                      resizeMode="cover"
                    />
                    <Text style={[
                      styles.widgetPrice,
                      { color: product.trend === 'bullish' ? '#22c55e' : '#ef4444' }
                    ]}>
                      UGX {product.currentPrice.toLocaleString()}
                    </Text>
                  </View>
                ))}
              </Animated.View>
            </View>
            
            {/* Business News Preview */}
            <View style={styles.widgetNewsSection}>
              <Text style={styles.widgetNewsTitle}>Latest News</Text>
              <ScrollView 
                style={styles.widgetNewsScroll}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                {agriculturalNews.map((news, index) => (
                  <View key={news.id} style={styles.widgetNewsItem}>
                    <Text style={styles.widgetNewsItemTitle}>{news.title}</Text>
                    <Text style={styles.widgetNewsSummary}>{news.summary}</Text>
                    <View style={styles.widgetNewsMeta}>
                      <Text style={styles.widgetNewsSource}>{news.source}</Text>
                      <Text style={styles.widgetNewsTimestamp}>{news.timestamp}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </Animated.View>
        )}
        
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  phoneNumber: {
    fontSize: 14,
    color: '#6b7280',
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1f2937',
  },
  productsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 12,
    color: '#6b7280',
  },
  chartContainer: {
    width: 80,
    height: 40,
    marginRight: 12,
  },
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
    justifyContent: 'space-between',
  },
  chartBar: {
    width: 8,
    borderRadius: 2,
    minHeight: 2,
  },
  lineChart: {
    position: 'relative',
    height: 40,
    width: 60,
  },
  miniLineChart: {
    position: 'relative',
    height: 30,
    width: 50,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  miniLineContainer: {
    position: 'absolute',
    width: 4,
    height: 30,
  },
  miniLine: {
    position: 'absolute',
    width: 1.5,
    borderRadius: 0.75,
  },
  miniDot: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  priceChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  positiveChange: {
    backgroundColor: '#dcfce7',
  },
  negativeChange: {
    backgroundColor: '#fef2f2',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 2,
  },
  positiveText: {
    color: '#16a34a',
  },
  negativeText: {
    color: '#dc2626',
  },
  newsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 15,
    zIndex: 1000,
    overflow: 'hidden',
    borderTopWidth: 3,
    borderTopColor: '#4CAF50',
  },
  newsPanelHandle: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    transition: 'all 0.2s ease',
  },
  newsPanelHandleDragging: {
    backgroundColor: '#f0fdf4',
    borderBottomColor: '#4CAF50',
  },
  handleBar: {
    width: 50,
    height: 5,
    backgroundColor: '#4CAF50',
    borderRadius: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
    transition: 'all 0.2s ease',
  },
  handleBarDragging: {
    width: 60,
    height: 6,
    backgroundColor: '#22c55e',
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  dragIndicator: {
    position: 'absolute',
    top: -30,
    left: '50%',
    transform: [{ translateX: -75 }],
    backgroundColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dragText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    minWidth: 150,
  },
  marqueeSection: {
    height: 50,
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  marqueeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
  },
  marqueeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 30,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  marqueeProductName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 8,
    maxWidth: 100,
  },
  marqueeChart: {
    width: 60,
    height: 20,
  },
  marqueeChartStyle: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 20,
    justifyContent: 'space-between',
  },
  marqueeChartBar: {
    width: 4,
    borderRadius: 1,
    minHeight: 1,
  },
  newsContent: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 20,
  },
  newsPreview: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  newsPreviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  newsPreviewText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  // Professional Marquee Styles
  marqueeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
  },
  marqueeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    backgroundColor: '#ffffff',
    borderRadius: 3,
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  // Professional News Header Styles
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  newsHeaderLeft: {
    flex: 1,
  },
  newsSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  newsHeaderRight: {
    alignItems: 'flex-end',
  },
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  refreshText: {
    fontSize: 10,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
  // Professional Preview Styles
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewBadge: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  previewBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  swipeHintText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
  newsItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  newsSummary: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  newsMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  newsSource: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '500',
  },
  newsTimestamp: {
    fontSize: 12,
    color: '#9ca3af',
  },
  inactivePanelContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  inactivePanelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  inactivePanelSubtext: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  inactiveMarqueeContainer: {
    flex: 1,
    overflow: 'hidden',
    width: '100%',
  },
  inactiveMarqueeScroll: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inactiveMarqueeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 2,
    minWidth: 200,
  },
  inactiveMarqueeContent: {
    flex: 1,
    marginRight: 8,
  },
  inactiveMarqueeName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  inactiveMarqueePriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inactiveMarqueePrice: {
    fontSize: 10,
    fontWeight: '600',
  },
  inactiveMarqueeChange: {
    fontSize: 9,
    fontWeight: '500',
  },
  previewNewsContainer: {
    marginVertical: 12,
  },
  previewNewsItem: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  previewNewsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  previewNewsSummary: {
    fontSize: 10,
    color: '#6b7280',
    lineHeight: 14,
  },
  // Widget Styles
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  panelButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  panelButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  panelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  marketWidget: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  widgetMarqueeContainer: {
    height: 60,
    overflow: 'hidden',
    marginBottom: 16,
  },
  widgetMarqueeScroll: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  widgetMarqueeItem: {
    alignItems: 'center',
    marginRight: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    minWidth: 80,
  },
  widgetProductName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
    textAlign: 'center',
  },
  widgetPrice: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  cropImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginTop: -8,
    marginBottom: 4,
  },
  widgetNewsSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  widgetNewsScroll: {
    maxHeight: 150,
  },
  widgetNewsItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  widgetNewsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  widgetNewsItemTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 3,
  },
  widgetNewsSummary: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 12,
  },
  widgetNewsMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  widgetNewsSource: {
    fontSize: 8,
    color: '#4CAF50',
    fontWeight: '500',
  },
  widgetNewsTimestamp: {
    fontSize: 8,
    color: '#9ca3af',
  },
});

export default StocksStyleScreen;
