import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../config/supabaseConfig';

/**
 * P2P Market Panel - Personal Business Dashboard
 * Shows user's own listings, messages, and management tools
 * This is the PRIVATE interface for managing P2P business
 */
const P2PMarketPanel = ({ navigation }) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myListings, setMyListings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [myBuyRequests, setMyBuyRequests] = useState([]);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalValue: 0,
    unreadMessages: 0,
    activeBuyRequests: 0,
    totalResponses: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadMyListings(),
        loadMyMessages(),
        loadMyBuyRequests(),
      ]);
    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMyListings = async () => {
    if (!user?.uid) return;

    try {
      console.log('📦 Loading my P2P listings...');

      const { data, error } = await supabase
        .from('p2p_listings')
        .select(`
          id,
          asking_price,
          quantity_available,
          minimum_order_quantity,
          location,
          notes,
          is_active,
          created_at,
          updated_at,
          p2p_products (
            id,
            name,
            category,
            unit_of_measure,
            standard_unit_size
          )
        `)
        .eq('seller_id', user.uid)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('✅ Loaded', data?.length || 0, 'of my listings');
      setMyListings(data || []);

      // Calculate stats
      const activeListings = data?.filter(l => l.is_active) || [];
      const totalValue = activeListings.reduce((sum, l) => sum + (parseFloat(l.asking_price) * l.quantity_available), 0);

      setStats({
        totalListings: data?.length || 0,
        activeListings: activeListings.length,
        totalValue: totalValue,
        unreadMessages: 0, // TODO: Implement messages
      });

    } catch (error) {
      console.error('❌ Error loading listings:', error);
      setMyListings([]);
    }
  };

  const loadMyMessages = async () => {
    if (!user?.uid) return;

    try {
      console.log('💬 Loading my inquiries and messages...');

      // Get inquiries where I'm the seller (receiving inquiries)
      const { data: sellerInquiries, error: sellerError } = await supabase
        .from('p2p_inquiries')
        .select(`
          id,
          message,
          quantity_needed,
          buyer_location,
          status,
          created_at,
          buyer_id,
          p2p_products (
            name
          ),
          users!p2p_inquiries_buyer_id_fkey (
            id,
            full_name,
            phone,
            profile_photo
          )
        `)
        .eq('seller_id', user.uid)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get inquiries where I'm the buyer (my sent inquiries)
      const { data: buyerInquiries, error: buyerError } = await supabase
        .from('p2p_inquiries')
        .select(`
          id,
          message,
          quantity_needed,
          status,
          created_at,
          seller_id,
          p2p_products (
            name
          ),
          users!p2p_inquiries_seller_id_fkey (
            id,
            full_name,
            phone,
            profile_photo
          )
        `)
        .eq('buyer_id', user.uid)
        .order('created_at', { ascending: false })
        .limit(10);

      if (sellerError) console.error('Error loading seller inquiries:', sellerError);
      if (buyerError) console.error('Error loading buyer inquiries:', buyerError);

      // Combine and format
      const allInquiries = [
        ...(sellerInquiries || []).map(inq => ({
          ...inq,
          type: 'received', // I'm the seller
          otherUser: inq.users,
        })),
        ...(buyerInquiries || []).map(inq => ({
          ...inq,
          type: 'sent', // I'm the buyer
          otherUser: inq.users,
        }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setMessages(allInquiries);

      // Count unread (for now, just count pending received inquiries)
      const unread = (sellerInquiries || []).filter(inq => inq.status === 'pending').length;
      setStats(prev => ({ ...prev, unreadMessages: unread }));

      console.log('✅ Loaded', allInquiries.length, 'inquiries');
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      setMessages([]);
    }
  };

  const loadMyBuyRequests = async () => {
    if (!user?.uid) return;

    try {
      console.log('🛒 Loading my buy requests...');

      const { data, error } = await supabase
        .from('buy_requests')
        .select(`
          *,
          p2p_products(name, category),
          buy_request_responses(id, seller_id, status, offered_price, created_at)
        `)
        .eq('buyer_id', user.uid)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('✅ Loaded', data?.length || 0, 'buy requests');
      setMyBuyRequests(data || []);

      // Calculate buy request stats
      const active = data?.filter(r => r.status === 'active') || [];
      const totalResponses = data?.reduce((sum, req) => sum + (req.buy_request_responses?.length || 0), 0) || 0;

      setStats(prev => ({ 
        ...prev, 
        activeBuyRequests: active.length,
        totalResponses: totalResponses,
      }));

    } catch (error) {
      console.error('❌ Error loading buy requests:', error);
      setMyBuyRequests([]);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleEditListing = (listing) => {
    // Navigate to product selection to update
    navigation.navigate('ProductSelection');
  };

  const handleToggleActive = async (listing) => {
    try {
      const { error } = await supabase
        .from('p2p_listings')
        .update({ is_active: !listing.is_active })
        .eq('id', listing.id);

      if (error) throw error;

      Alert.alert('Success', listing.is_active ? 'Listing deactivated' : 'Listing activated');
      loadMyListings();
    } catch (error) {
      console.error('❌ Error toggling listing:', error);
      Alert.alert('Error', 'Failed to update listing');
    }
  };

  const handleDeleteListing = async (listing) => {
    Alert.alert(
      'Delete Listing',
      `Remove ${listing.p2p_products.name} from your listings?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('p2p_listings')
                .delete()
                .eq('id', listing.id);

              if (error) throw error;

              Alert.alert('Success', 'Listing deleted');
              loadMyListings();
            } catch (error) {
              console.error('❌ Error deleting listing:', error);
              Alert.alert('Error', 'Failed to delete listing');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading your P2P panel...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#2c5530" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My P2P Market</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <MaterialIcons name="refresh" size={24} color="#2c5530" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#4CAF50']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialIcons name="inventory" size={24} color="#4CAF50" />
            <Text style={styles.statValue}>{stats.activeListings}</Text>
            <Text style={styles.statLabel}>Active Listings</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="attach-money" size={24} color="#2196F3" />
            <Text style={styles.statValue}>
              {Math.round(stats.totalValue / 1000)}K
            </Text>
            <Text style={styles.statLabel}>Total Value</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="message" size={24} color="#FF9800" />
            <Text style={styles.statValue}>{stats.unreadMessages}</Text>
            <Text style={styles.statLabel}>Messages</Text>
          </View>
        </View>

        {/* Quick Actions - Only for sellers */}
        {(user?.userType === 'seller' || user?.userType === 'both') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('ProductSelection')}
            >
              <MaterialIcons name="add-circle" size={24} color="#4CAF50" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.actionTitle}>Add/Edit Products</Text>
                <Text style={styles.actionSubtitle}>Select products to sell and set prices</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        {/* My Listings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Active Listings</Text>
            <Text style={styles.listingCount}>({stats.activeListings})</Text>
          </View>

          {myListings.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialIcons name="inventory-2" size={48} color="#CCC" />
              <Text style={styles.emptyText}>No products listed yet</Text>
              <Text style={styles.emptySubtext}>
                Tap "Add/Edit Products" to start selling
              </Text>
            </View>
          ) : (
            myListings.map((listing) => (
              <View key={listing.id} style={styles.listingCard}>
                {/* Listing Header */}
                <View style={styles.listingHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listingProductName}>
                      {listing.p2p_products.name}
                    </Text>
                    <Text style={styles.listingCategory}>
                      {listing.p2p_products.category} • {listing.p2p_products.unit_of_measure}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: listing.is_active ? '#E8F5E8' : '#FFE8E8' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: listing.is_active ? '#4CAF50' : '#F44336' }
                    ]}>
                      {listing.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                {/* Price & Quantity */}
                <View style={styles.listingDetails}>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Your Price</Text>
                    <Text style={styles.detailValue}>
                      UGX {parseInt(listing.asking_price).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Available</Text>
                    <Text style={styles.detailValue}>
                      {listing.quantity_available}
                    </Text>
                  </View>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Min Order</Text>
                    <Text style={styles.detailValue}>
                      {listing.minimum_order_quantity}
                    </Text>
                  </View>
                </View>

                {/* Location */}
                <View style={styles.locationRow}>
                  <MaterialIcons name="location-on" size={14} color="#666" />
                  <Text style={styles.locationText}>{listing.location}</Text>
                </View>

                {/* Notes */}
                {listing.notes && (
                  <Text style={styles.listingNotes}>"{listing.notes}"</Text>
                )}

                {/* Action Buttons */}
                <View style={styles.listingActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleToggleActive(listing)}
                  >
                    <MaterialIcons 
                      name={listing.is_active ? 'pause' : 'play-arrow'} 
                      size={18} 
                      color="#2196F3" 
                    />
                    <Text style={styles.actionBtnText}>
                      {listing.is_active ? 'Pause' : 'Activate'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleEditListing(listing)}
                  >
                    <MaterialIcons name="edit" size={18} color="#FF9800" />
                    <Text style={styles.actionBtnText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDeleteListing(listing)}
                  >
                    <MaterialIcons name="delete" size={18} color="#F44336" />
                    <Text style={styles.actionBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Messages/Inquiries Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Inquiries</Text>
            {stats.unreadMessages > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{stats.unreadMessages} new</Text>
              </View>
            )}
          </View>

          {messages.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialIcons name="mail-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>No inquiries yet</Text>
              <Text style={styles.emptySubtext}>
                {user?.userType === 'seller' || user?.userType === 'both' 
                  ? 'Buyers will contact you about your listings' 
                  : 'Your sent inquiries will appear here'}
              </Text>
            </View>
          ) : (
            messages.map((inquiry) => (
              <View key={inquiry.id} style={styles.messageCard}>
                <View style={styles.messageHeader}>
                  {/* User Avatar */}
                  {inquiry.otherUser?.profile_photo ? (
                    <Image 
                      source={{ uri: inquiry.otherUser.profile_photo }}
                      style={styles.messageAvatar}
                    />
                  ) : (
                    <View style={styles.messageAvatarPlaceholder}>
                      <MaterialIcons name="person" size={20} color="#4CAF50" />
                    </View>
                  )}

                  {/* Message Info */}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.messageUserName}>
                        {inquiry.otherUser?.full_name || 'User'}
                      </Text>
                      <Text style={styles.messageTime}>
                        {new Date(inquiry.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.messageProduct}>
                      Re: {inquiry.p2p_products?.name || 'Product'}
                    </Text>
                    <Text style={styles.messageText} numberOfLines={2}>
                      {inquiry.message}
                    </Text>
                    <View style={styles.messageFooter}>
                      <Text style={styles.messageQuantity}>
                        Qty: {inquiry.quantity_needed} units
                      </Text>
                      <View style={[
                        styles.messageBadge,
                        { backgroundColor: inquiry.status === 'pending' ? '#FFE8E8' : '#E8F5E8' }
                      ]}>
                        <Text style={[
                          styles.messageBadgeText,
                          { color: inquiry.status === 'pending' ? '#F44336' : '#4CAF50' }
                        ]}>
                          {inquiry.type === 'received' ? '← Received' : '→ Sent'} • {inquiry.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Action: Open Conversation */}
                <TouchableOpacity 
                  style={styles.viewMessageBtn}
                  onPress={() => {
                    navigation.navigate('Conversation', { inquiryId: inquiry.id });
                  }}
                >
                  <MaterialIcons name="chat" size={18} color="#4CAF50" />
                  <Text style={styles.viewMessageBtnText}>View & Reply</Text>
                  <MaterialIcons name="chevron-right" size={18} color="#4CAF50" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* My Buy Requests Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Buy Requests</Text>
            <Text style={styles.listingCount}>({stats.activeBuyRequests})</Text>
          </View>

          {myBuyRequests.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialIcons name="shopping-cart" size={48} color="#CCC" />
              <Text style={styles.emptyText}>No buy requests yet</Text>
              <Text style={styles.emptySubtext}>
                Post what you want to buy and let sellers contact you
              </Text>
              <TouchableOpacity
                style={styles.createRequestButton}
                onPress={() => navigation.navigate('CreateBuyRequest')}
              >
                <MaterialIcons name="add" size={20} color="white" />
                <Text style={styles.createRequestButtonText}>Create Buy Request</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {myBuyRequests.map((request) => {
                const responseCount = request.buy_request_responses?.length || 0;
                const urgencyColor = request.urgency === 'urgent' ? '#F44336' : 
                                    request.urgency === 'high' ? '#FF9800' : '#4CAF50';
                
                return (
                  <TouchableOpacity
                    key={request.id}
                    style={styles.buyRequestCard}
                    onPress={() => navigation.navigate('BuyRequestDetails', {
                      requestId: request.id,
                      mode: 'buyer'
                    })}
                  >
                    {/* Request Header */}
                    <View style={styles.buyRequestHeader}>
                      <Text style={styles.buyRequestTitle} numberOfLines={2}>
                        {request.title}
                      </Text>
                      <View style={[styles.urgencyBadgeSmall, { backgroundColor: urgencyColor }]}>
                        <Text style={styles.urgencyTextSmall}>
                          {request.urgency.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {/* Product & Quantity */}
                    <View style={styles.buyRequestDetails}>
                      <Text style={styles.buyRequestProduct}>
                        {request.p2p_products?.name} • {request.quantity_needed} units
                      </Text>
                      {request.target_price && (
                        <Text style={styles.buyRequestPrice}>
                          Target: UGX {request.target_price.toLocaleString()}
                        </Text>
                      )}
                    </View>

                    {/* Footer */}
                    <View style={styles.buyRequestFooter}>
                      <View style={styles.buyRequestResponseCount}>
                        <MaterialIcons name="chat-bubble-outline" size={16} color="#4CAF50" />
                        <Text style={styles.responseCountText}>
                          {responseCount} {responseCount === 1 ? 'response' : 'responses'}
                        </Text>
                      </View>
                      <Text style={styles.buyRequestTime}>
                        {new Date(request.created_at).toLocaleDateString()}
                      </Text>
                    </View>

                    {/* New Responses Badge */}
                    {responseCount > 0 && (
                      <View style={styles.newResponsesBadge}>
                        <Text style={styles.newResponsesText}>NEW</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Add New Request Button */}
              <TouchableOpacity
                style={styles.addMoreRequestButton}
                onPress={() => navigation.navigate('CreateBuyRequest')}
              >
                <MaterialIcons name="add-circle-outline" size={20} color="#4CAF50" />
                <Text style={styles.addMoreRequestText}>Create Another Buy Request</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c5530',
  },
  content: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 15,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5530',
  },
  listingCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  actionButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  listingCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  listingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  listingProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  listingCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  listingDetails: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  detailBox: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 8,
  },
  detailLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
  },
  listingNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    backgroundColor: '#FFF9E6',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  listingActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    gap: 4,
  },
  actionBtnText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#FF5252',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  messageCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  messageAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  messageAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
  },
  messageProduct: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
    fontWeight: '500',
  },
  messageText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    lineHeight: 18,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  messageQuantity: {
    fontSize: 11,
    color: '#666',
  },
  messageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  messageBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  viewMessageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  viewMessageBtnText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
    marginRight: 4,
  },
  createRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 15,
    gap: 6,
  },
  createRequestButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  buyRequestCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
    position: 'relative',
  },
  buyRequestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  buyRequestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  urgencyBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgencyTextSmall: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  buyRequestDetails: {
    marginBottom: 10,
  },
  buyRequestProduct: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  buyRequestPrice: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  buyRequestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buyRequestResponseCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  responseCountText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
  },
  buyRequestTime: {
    fontSize: 12,
    color: '#999',
  },
  newResponsesBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF5252',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  newResponsesText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  addMoreRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    gap: 6,
    marginTop: 5,
  },
  addMoreRequestText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default P2PMarketPanel;



