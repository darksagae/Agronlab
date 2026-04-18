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
  FlatList,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeTranslation } from '../i18n';
import { useUser } from '../contexts/UserContext';
import usersService from '../services/usersService';

const { width, height } = Dimensions.get('window');

// Price history: stub / future Amplify Data
// For now, empty until real data exists

const ProductTradingScreen = ({ route, navigation }) => {
  const { product, p2pProduct, fromP2PMarket } = route.params;
  
  // Use p2pProduct if coming from P2P Market, otherwise use product
  const displayProduct = p2pProduct || product;
  
  const [activeTab, setActiveTab] = useState('sellers'); // Default to sellers for P2P
  const [selectedTrader, setSelectedTrader] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  
  // Get current user from UserContext (Cognito + local profile)
  const { user: currentUser, isAuthenticated, refreshUserData } = useUser();
  const [realBuyers, setRealBuyers] = useState([]);
  const [realSellers, setRealSellers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Load real users on component mount and when currentUser changes
  useEffect(() => {
    loadRealUsers();
  }, [currentUser]); // Re-load when user data updates
  
  const loadRealUsers = async () => {
    setLoadingUsers(true);

    try {
      console.log('👥 ProductTradingScreen: Loading users from local profiles (no Supabase)...');

      const isP2PFiltered = fromP2PMarket && p2pProduct;

      const { success, users } = await usersService.getAllUsers();
      const list = success && Array.isArray(users) ? users : [];

      const buyers = list
        .filter((u) => u.user_type === 'buyer' || u.user_type === 'both')
        .map((u) => ({
          id: u.uid,
          name: u.fullName || u.username || u.email,
          location: u.buyerProfile?.shipping_address?.city || 'Uganda',
          price: 0,
          quantity: 0,
          rating: 0,
          avatar: u.profilePhoto,
          phone: u.phone,
          email: u.email,
          uid: u.uid,
          isCurrentUser: u.uid === currentUser?.uid,
          userType: 'buyer',
        }));

      const sellersWithListings = list
        .filter((u) => u.user_type === 'seller' || u.user_type === 'both')
        .map((u) => ({
          id: u.uid,
          name: u.businessName || u.fullName || u.username || u.email,
          location: u.location || 'Uganda',
          price: 0,
          quantity: 0,
          rating: 0,
          avatar: u.profilePhoto,
          phone: u.phone,
          email: u.email,
          uid: u.uid,
          isCurrentUser: u.uid === currentUser?.uid,
          userType: 'seller',
          totalSales: 0,
          listings: [],
          listingCount: 0,
          productName: 'No P2P listings (cloud disabled)',
          unit: '',
        }));

      const sellers = isP2PFiltered
        ? sellersWithListings.filter((s) => s.listingCount > 0)
        : sellersWithListings;

      setRealBuyers(buyers);
      setRealSellers(sellers);
      console.log('✅ Marketplace data:', buyers.length, 'buyers,', sellers.length, 'sellers');
    } catch (error) {
      console.error('❌ Error loading marketplace users:', error);
      setRealBuyers([]);
      setRealSellers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const tradingInfo = {
    buyers: realBuyers,
    sellers: realSellers
  };


  const renderTraderCard = (trader, type) => (
    <View key={trader.id} style={styles.traderCard}>
      <View style={styles.traderHeader}>
        {/* Profile Photo - URI or emoji fallback */}
        {trader.avatar && (trader.avatar.startsWith('http') || trader.avatar.startsWith('data:')) ? (
          <Image 
            source={{ uri: trader.avatar }}
            style={styles.traderAvatarImage}
          />
        ) : (
          <Text style={styles.traderAvatar}>{trader.avatar || '👤'}</Text>
        )}
        <View style={styles.traderInfo}>
          <Text style={styles.traderName}>{trader.name}</Text>
          <Text style={styles.traderLocation}>{trader.location}</Text>
          {trader.phone && (
            <View style={styles.contactRow}>
              <MaterialIcons name="phone" size={12} color="#4CAF50" />
              <Text style={styles.contactText}>{trader.phone}</Text>
            </View>
          )}
          <View style={styles.ratingContainer}>
            <MaterialIcons name="star" size={14} color="#fbbf24" />
            <Text style={styles.rating}>{trader.rating.toFixed(1)}</Text>
            {trader.uid && (
              <MaterialIcons name="verified" size={14} color="#4CAF50" style={{ marginLeft: 5 }} />
            )}
          </View>
        </View>
      </View>
      <View style={styles.traderDetails}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.priceValue}>
            UGX {parseInt(trader.price || 0).toLocaleString()}
          </Text>
          {trader.unit && (
            <Text style={styles.unitText}>{trader.unit}</Text>
          )}
        </View>
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityLabel}>Available</Text>
          <Text style={styles.quantityValue}>
            {trader.quantity || 0} {trader.unit ? trader.unit.replace('per ', '') : 'units'}
          </Text>
        </View>
      </View>
      
      {/* Show product name for sellers with listings */}
      {type === 'seller' && trader.listingCount > 0 && (
        <View style={styles.productBadge}>
          <MaterialIcons name="local-offer" size={14} color="#4CAF50" />
          <Text style={styles.productBadgeText}>
            {trader.productName}
            {trader.listingCount > 1 && ` +${trader.listingCount - 1} more`}
          </Text>
        </View>
      )}
      
      {/* Contact Buttons with Registration Gate */}
      {!trader.isCurrentUser && trader.uid && (
        <View style={styles.contactButtons}>
          <TouchableOpacity 
            style={styles.messageButton}
            onPress={() => {
              // Check if user is logged in and registered as buyer/seller
              if (!currentUser || !currentUser.uid) {
                Alert.alert(
                  '🔒 Login Required',
                  'Please sign in to contact sellers',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Sign In', 
                      onPress: () => navigation.navigate('Login')
                    }
                  ]
                );
                return;
              }

              const userType = currentUser.userType || 'none';
              if (!['buyer', 'seller', 'both'].includes(userType)) {
                Alert.alert(
                  '📋 Registration Required',
                  'To contact sellers, please register as a buyer or seller',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Register', 
                      onPress: () => navigation.navigate('Account')
                    }
                  ]
                );
                return;
              }

              // If coming from P2P Market with a specific product, navigate to inquiry form
              if (fromP2PMarket && p2pProduct) {
                // Find the seller's listing for this product
                const listing = trader.listings?.[0];
                
                navigation.navigate('InquiryForm', {
                  seller: {
                    uid: trader.uid,
                    fullName: trader.name,
                    phone: trader.phone,
                    email: trader.email,
                    p2p_rating: trader.rating,
                    p2p_total_trades: trader.totalSales || 0
                  },
                  listing: listing,
                  p2pProduct: p2pProduct
                });
              } else {
                // Fallback to chat for non-P2P flows
                navigation.navigate('chat', {
                  otherUser: {
                    uid: trader.uid,
                    name: trader.name,
                    email: trader.email,
                    phone: trader.phone,
                    avatar: trader.avatar
                  }
                });
              }
            }}
          >
            <MaterialIcons name="message" size={18} color="#4CAF50" />
            <Text style={styles.messageButtonText}>Contact</Text>
          </TouchableOpacity>
          
          {trader.phone && currentUser && ['buyer', 'seller', 'both'].includes(currentUser.userType) && (
            <TouchableOpacity 
              style={styles.callButton}
              onPress={() => {
                // Open phone dialer (only for registered users)
                const phoneNumber = trader.phone.replace(/[^0-9+]/g, '');
                if (Platform.OS === 'android' || Platform.OS === 'ios') {
                  Linking.openURL(`tel:${phoneNumber}`);
                }
              }}
            >
              <MaterialIcons name="phone" size={18} color="#fff" />
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {trader.isCurrentUser && (
        <View style={styles.yourListingBadge}>
          <MaterialIcons name="person" size={16} color="#4CAF50" />
          <Text style={styles.yourListingText}>Your Listing</Text>
        </View>
      )}
    </View>
  );

  const renderChatModal = () => {
    if (!selectedTrader) return null;

    return (
      <View style={styles.chatModal}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedTrader(null)}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.chatTitle}>
            Chat with {selectedTrader.name}
          </Text>
          <View style={styles.traderType}>
            <Text style={styles.traderTypeText}>
              {selectedTrader.type === 'buyer' ? 'Buyer' : 'Seller'}
            </Text>
          </View>
        </View>

        <ScrollView style={styles.chatMessages}>
          {chatMessages.map((msg, index) => (
            <View key={index} style={[
              styles.message,
              msg.sender === 'me' ? styles.myMessage : styles.theirMessage
            ]}>
              <Text style={styles.messageText}>{msg.text}</Text>
              <Text style={styles.messageTime}>{msg.time}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.chatInput}>
          <TextInput
            style={styles.messageInput}
            placeholder={t('search.messagePlaceholder')}
            value={chatMessage}
            onChangeText={setChatMessage}
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => {
              if (chatMessage.trim()) {
                setChatMessages([...chatMessages, {
                  text: chatMessage,
                  sender: 'me',
                  time: new Date().toLocaleTimeString()
                }]);
                setChatMessage('');
              }
            }}
          >
            <MaterialIcons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{displayProduct?.name || 'Product'} Trading</Text>
        <View style={styles.headerRight}>
          <MaterialIcons name="notifications" size={24} color="#333" />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'buyers' && styles.activeTab]}
          onPress={() => setActiveTab('buyers')}
        >
          <MaterialIcons name="shopping-cart" size={20} color={activeTab === 'buyers' ? '#4CAF50' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'buyers' && styles.activeTabText]}>Buyers</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sellers' && styles.activeTab]}
          onPress={() => setActiveTab('sellers')}
        >
          <MaterialIcons name="sell" size={20} color={activeTab === 'sellers' ? '#4CAF50' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'sellers' && styles.activeTabText]}>Sellers</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        
        {activeTab === 'buyers' && (
          <View style={styles.tradersContainer}>
            <Text style={styles.sectionTitle}>Buyers ({tradingInfo.buyers.length})</Text>
            {loadingUsers ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.emptyText}>Loading buyers...</Text>
              </View>
            ) : tradingInfo.buyers.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="people-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No buyers available yet</Text>
                <Text style={styles.emptySubtext}>Be the first buyer to request this product!</Text>
              </View>
            ) : (
              tradingInfo.buyers.map(trader => renderTraderCard(trader, 'buyer'))
            )}
          </View>
        )}
        
        {activeTab === 'sellers' && (
          <View style={styles.tradersContainer}>
            <Text style={styles.sectionTitle}>Sellers ({tradingInfo.sellers.length})</Text>
            {loadingUsers ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.emptyText}>Loading sellers...</Text>
              </View>
            ) : tradingInfo.sellers.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="store" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No sellers available yet</Text>
                <Text style={styles.emptySubtext}>Be the first seller to list this product!</Text>
              </View>
            ) : (
              tradingInfo.sellers.map(trader => renderTraderCard(trader, 'seller'))
            )}
          </View>
        )}
      </ScrollView>

      {/* Chat Modal */}
      {renderChatModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerRight: {
    width: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4CAF50',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tradingViewContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  chartTitleSection: {
    flex: 1,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
  chartControls: {
    flexDirection: 'row',
  },
  timeframeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
    backgroundColor: '#333',
    borderRadius: 6,
  },
  timeframeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  priceChartContainer: {
    flexDirection: 'row',
    height: 200,
  },
  yAxis: {
    width: 60,
    paddingVertical: 10,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  yAxisLabel: {
    fontSize: 10,
    color: '#888',
    textAlign: 'right',
  },
  chartArea: {
    flex: 1,
    position: 'relative',
    paddingVertical: 10,
  },
  candlestickContainer: {
    position: 'absolute',
    width: 12,
    height: 180,
    alignItems: 'center',
  },
  wick: {
    position: 'absolute',
    left: 5.5,
    width: 1,
  },
  candlestickBody: {
    position: 'absolute',
    left: 2,
    borderRadius: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
  trendLineContainer: {
    position: 'absolute',
    width: 12,
    height: 180,
  },
  trendLine: {
    position: 'absolute',
    width: 2,
    backgroundColor: '#888',
    opacity: 0.6,
  },
  volumeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  volumeTitle: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  volumeChart: {
    height: 40,
    position: 'relative',
  },
  volumeBar: {
    position: 'absolute',
    bottom: 0,
  },
  chartFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  priceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  priceLabel: {
    fontSize: 10,
    color: '#888',
    marginBottom: 4,
  },
  tradersContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  traderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  traderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  traderAvatar: {
    fontSize: 24,
    marginRight: 12,
  },
  traderAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  contactText: {
    fontSize: 11,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
  contactButtons: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 10,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f5e9',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  messageButtonText: {
    marginLeft: 6,
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  callButtonText: {
    marginLeft: 6,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  yourListingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  yourListingText: {
    marginLeft: 6,
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '600',
  },
  traderInfo: {
    flex: 1,
  },
  traderName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  traderLocation: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  traderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  quantityContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  quantityLabel: {
    fontSize: 12,
    color: '#666',
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  traderAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  actionText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 8,
    fontWeight: '500',
  },
  chatModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 1000,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  chatTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 16,
  },
  traderType: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  traderTypeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  chatMessages: {
    flex: 1,
    padding: 16,
  },
  message: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#1f2937',
  },
  messageTime: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  chatInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  unitText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '400',
  },
  productBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
    gap: 5,
  },
  productBadgeText: {
    fontSize: 12,
    color: '#2c5530',
    fontWeight: '500',
  },
});

export default ProductTradingScreen;










