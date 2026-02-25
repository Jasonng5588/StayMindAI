import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  static SupabaseClient get client => Supabase.instance.client;

  // --- Auth ---
  static Future<AuthResponse> signUp(String email, String password, String name, {String role = 'guest'}) {
    return client.auth.signUp(email: email, password: password, data: {'full_name': name, 'role': role});
  }

  static Future<AuthResponse> signIn(String email, String password) {
    return client.auth.signInWithPassword(email: email, password: password);
  }

  static Future<bool> signInWithGoogle() async {
    return client.auth.signInWithOAuth(OAuthProvider.google, redirectTo: 'io.supabase.staymind://login-callback');
  }

  static Future<void> signOut() => client.auth.signOut();
  static Future<void> resetPassword(String email) => client.auth.resetPasswordForEmail(email);
  static User? get currentUser => client.auth.currentUser;
  static Session? get currentSession => client.auth.currentSession;

  static String? get _userId => currentUser?.id;

  // --- Hotels ---
  static Future<List<Map<String, dynamic>>> searchHotels({String? query, String? city, double? minPrice, double? maxPrice, int? minRating}) async {
    try {
      var q = client.from('hotels').select('*, room_types(name, base_price)').eq('is_active', true);
      if (query != null && query.isNotEmpty) q = q.ilike('name', '%$query%');
      if (city != null) q = q.ilike('city', '%$city%');
      if (minRating != null) q = q.gte('star_rating', minRating);
      final data = await q.order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      print('searchHotels error: $e');
      return [];
    }
  }

  static Future<Map<String, dynamic>?> getHotel(String id) async {
    try {
      return await client.from('hotels').select('*, room_types(*, rooms(*)), services_addons(*), reviews(*)').eq('id', id).maybeSingle();
    } catch (e) {
      print('getHotel error: $e');
      return null;
    }
  }

  // --- Rooms ---
  static Future<Map<String, dynamic>?> getRoomType(String id) async {
    try {
      return await client.from('room_types').select('*, rooms(*)').eq('id', id).maybeSingle();
    } catch (e) {
      print('getRoomType error: $e');
      return null;
    }
  }

  static Future<List<Map<String, dynamic>>> checkAvailability(String hotelId, String checkIn, String checkOut, {String? roomTypeId}) async {
    try {
      var q = client.from('rooms').select('*').eq('hotel_id', hotelId).eq('status', 'available');
      if (roomTypeId != null) q = q.eq('room_type', roomTypeId);
      final allRooms = await q;

      final booked = await client.from('bookings').select('room_id')
        .eq('hotel_id', hotelId)
        .inFilter('status', ['confirmed', 'checked_in'])
        .lte('check_in', checkOut)
        .gte('check_out', checkIn);

      final bookedIds = (booked as List).map((b) => b['room_id']).toSet();
      return (allRooms as List).where((r) => !bookedIds.contains(r['id'])).cast<Map<String, dynamic>>().toList();
    } catch (e) {
      print('checkAvailability error: $e');
      return [];
    }
  }

  // --- Bookings ---
  static Future<Map<String, dynamic>> createBooking({required String hotelId, required String roomId, String? roomTypeId, required String checkIn, required String checkOut, int guests = 1, required double totalAmount, String? specialRequests, String? promoCode}) async {
    final code = 'BK-${DateTime.now().millisecondsSinceEpoch.toRadixString(36).toUpperCase()}';
    return await client.from('bookings').insert({
      'hotel_id': hotelId, 'user_id': _userId, 'room_id': roomId,
      'room_type': roomTypeId, 'check_in': checkIn, 'check_out': checkOut,
      'guests': guests, 'total_amount': totalAmount, 'status': 'confirmed',
      'source': 'mobile_app', 'special_requests': specialRequests, 'booking_number': code,
    }).select().single();
  }

  static Future<List<Map<String, dynamic>>> getMyBookings() async {
    if (_userId == null) return [];
    try {
      // Try with joins first, fallback to simple query
      try {
        return List<Map<String, dynamic>>.from(await client.from('bookings')
          .select('*, hotels(name, city), rooms(room_number)')
          .eq('user_id', _userId!).order('created_at', ascending: false));
      } catch (_) {
        // If join fails, try without joins
        return List<Map<String, dynamic>>.from(await client.from('bookings')
          .select('*')
          .eq('user_id', _userId!).order('created_at', ascending: false));
      }
    } catch (e) {
      print('getMyBookings error: $e');
      return [];
    }
  }

  static Future<void> cancelBooking(String bookingId) => client.from('bookings').update({'status': 'cancelled'}).eq('id', bookingId);

  // --- Reviews ---
  static Future<void> submitReview(String hotelId, int rating, String comment, {String? bookingId}) {
    return client.from('reviews').insert({'hotel_id': hotelId, 'user_id': _userId, 'rating': rating, 'comment': comment, 'booking_id': bookingId});
  }

  static Future<List<Map<String, dynamic>>> getMyReviews() async {
    if (_userId == null) return [];
    try {
      try {
        return List<Map<String, dynamic>>.from(await client.from('reviews')
          .select('*, hotels(name)').eq('user_id', _userId!).order('created_at', ascending: false));
      } catch (_) {
        return List<Map<String, dynamic>>.from(await client.from('reviews')
          .select('*').eq('user_id', _userId!).order('created_at', ascending: false));
      }
    } catch (e) {
      print('getMyReviews error: $e');
      return [];
    }
  }

  // --- Notifications ---
  static Future<List<Map<String, dynamic>>> getNotifications() async {
    if (_userId == null) return [];
    try {
      return List<Map<String, dynamic>>.from(await client.from('notifications')
        .select('*').eq('user_id', _userId!).order('created_at', ascending: false).limit(50));
    } catch (e) {
      print('getNotifications error: $e');
      return [];
    }
  }

  static Future<void> markNotificationRead(String id) => client.from('notifications').update({'is_read': true}).eq('id', id);

  // --- Staff Functions ---
  static Future<Map<String, dynamic>?> getStaffHotel() async {
    try {
      final staff = await client.from('hotel_staff').select('hotel_id').eq('user_id', _userId!).eq('is_active', true).maybeSingle();
      if (staff == null) return null;
      return await client.from('hotels').select('*').eq('id', staff['hotel_id']).maybeSingle();
    } catch (e) {
      print('getStaffHotel error: $e');
      return null;
    }
  }

  static Future<List<Map<String, dynamic>>> getHousekeepingTasks(String hotelId) async {
    try {
      return List<Map<String, dynamic>>.from(await client.from('housekeeping_tasks')
        .select('*, rooms(room_number)').eq('hotel_id', hotelId).order('created_at', ascending: false));
    } catch (e) {
      print('getHousekeepingTasks error: $e');
      return [];
    }
  }

  static Future<void> updateTaskStatus(String taskId, String status) => client.from('housekeeping_tasks').update({'status': status}).eq('id', taskId);

  static Future<List<Map<String, dynamic>>> getMaintenanceTasks(String hotelId) async {
    try {
      return List<Map<String, dynamic>>.from(await client.from('maintenance_tasks')
        .select('*, rooms(room_number)').eq('hotel_id', hotelId).order('created_at', ascending: false));
    } catch (e) {
      print('getMaintenanceTasks error: $e');
      return [];
    }
  }

  static Future<List<Map<String, dynamic>>> getTodayArrivals(String hotelId) async {
    try {
      final today = DateTime.now().toIso8601String().split('T')[0];
      return List<Map<String, dynamic>>.from(await client.from('bookings')
        .select('*, rooms(room_number)').eq('hotel_id', hotelId).eq('check_in', today).inFilter('status', ['confirmed']));
    } catch (e) {
      return [];
    }
  }

  static Future<List<Map<String, dynamic>>> getTodayDepartures(String hotelId) async {
    try {
      final today = DateTime.now().toIso8601String().split('T')[0];
      return List<Map<String, dynamic>>.from(await client.from('bookings')
        .select('*, rooms(room_number)').eq('hotel_id', hotelId).eq('check_out', today).inFilter('status', ['checked_in']));
    } catch (e) {
      return [];
    }
  }

  static Future<void> checkInGuest(String bookingId) => client.from('bookings').update({'status': 'checked_in'}).eq('id', bookingId);
  static Future<void> checkOutGuest(String bookingId) => client.from('bookings').update({'status': 'checked_out'}).eq('id', bookingId);

  static Future<List<Map<String, dynamic>>> getRoomStatuses(String hotelId) async {
    try {
      return List<Map<String, dynamic>>.from(await client.from('rooms')
        .select('*, room_types(name)').eq('hotel_id', hotelId).order('room_number'));
    } catch (e) {
      return [];
    }
  }

  static Future<void> updateRoomStatus(String roomId, String status) => client.from('rooms').update({'status': status}).eq('id', roomId);

  // --- Loyalty ---
  static Future<List<Map<String, dynamic>>> getLoyaltyPoints() async {
    if (_userId == null) return [];
    try {
      return List<Map<String, dynamic>>.from(await client.from('loyalty_points')
        .select('*').eq('user_id', _userId!).order('created_at', ascending: false));
    } catch (e) {
      print('getLoyaltyPoints error: $e');
      return [];
    }
  }

  static Future<List<Map<String, dynamic>>> getLoyaltyTiers() async {
    try {
      return List<Map<String, dynamic>>.from(await client.from('loyalty_tiers')
        .select('*').order('sort_order', ascending: true));
    } catch (e) {
      return [];
    }
  }

  static Future<List<Map<String, dynamic>>> getLoyaltyRewards() async {
    try {
      return List<Map<String, dynamic>>.from(await client.from('loyalty_rewards')
        .select('*').eq('is_active', true).order('points_cost', ascending: true));
    } catch (e) {
      return [];
    }
  }

  // --- Support ---
  static Future<List<Map<String, dynamic>>> getSupportTickets() async {
    if (_userId == null) return [];
    try {
      return List<Map<String, dynamic>>.from(await client.from('support_tickets')
        .select('*').eq('user_id', _userId!).order('created_at', ascending: false));
    } catch (e) {
      print('getSupportTickets error: $e');
      return [];
    }
  }

  static Future<List<Map<String, dynamic>>> getTicketMessages(String ticketId) async {
    try {
      return List<Map<String, dynamic>>.from(await client.from('ticket_messages')
        .select('*').eq('ticket_id', ticketId).order('created_at', ascending: true));
    } catch (e) {
      return [];
    }
  }

  static Future<void> sendTicketMessage(String ticketId, String message) async {
    await client.from('ticket_messages').insert({
      'ticket_id': ticketId,
      'sender_id': _userId,
      'role': 'guest',
      'message': message,
    });
  }

  static Future<void> createSupportTicket({required String subject, required String description, String category = 'general', String priority = 'medium'}) async {
    final ticket = await client.from('support_tickets').insert({
      'user_id': _userId,
      'subject': subject,
      'description': description,
      'category': category,
      'priority': priority,
      'status': 'open',
    }).select().single();

    await client.from('ticket_messages').insert({
      'ticket_id': ticket['id'],
      'sender_id': _userId,
      'role': 'guest',
      'message': description,
    });
  }

  // --- AI Chatbot ---
  static Future<String> chatWithAI(String hotelId, String message, List<Map<String, String>> history) async {
    try {
      final res = await client.functions.invoke('chatbot', body: {'hotel_id': hotelId, 'message': message, 'conversation_history': history});
      return res.data?['reply'] ?? 'Sorry, I could not process your request.';
    } catch (_) {
      return 'I\'m having trouble connecting right now. Please try again or contact the front desk.';
    }
  }
}
