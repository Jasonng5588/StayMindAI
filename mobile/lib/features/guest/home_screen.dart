import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../services/supabase_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _greeting = 'Welcome';
  String _userName = 'Guest';
  int _bookingsCount = 0;
  int _points = 0;
  int _unreadNotifications = 0;
  RealtimeChannel? _notiChannel;

  @override
  void initState() {
    super.initState();
    _loadInfo();
    _loadUnreadCount();
    _subscribeToNotifications();
  }

  @override
  void dispose() {
    if (_notiChannel != null) {
      SupabaseService.client.removeChannel(_notiChannel!);
    }
    super.dispose();
  }

  Future<void> _loadUnreadCount() async {
    try {
      final userId = SupabaseService.currentUser?.id;
      if (userId == null) return;
      final res = await SupabaseService.client
          .from('notifications')
          .select('id')
          .eq('user_id', userId)
          .eq('is_read', false);
      if (mounted) setState(() => _unreadNotifications = res.length);
    } catch (_) {}
  }

  void _subscribeToNotifications() {
    final userId = SupabaseService.currentUser?.id;
    if (userId == null) return;
    _notiChannel = SupabaseService.client
        .channel('home-noti-$userId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'notifications',
          callback: (payload) {
            final row = payload.newRecord;
            if (row['user_id'] != userId) return;
            if (mounted) setState(() => _unreadNotifications++);
          },
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.update,
          schema: 'public',
          table: 'notifications',
          callback: (_) => _loadUnreadCount(),
        )
        .subscribe();
  }

  void _loadInfo() {
    final user = SupabaseService.currentUser;
    final hour = DateTime.now().hour;
    _greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    if (user != null) {
      _userName = user.userMetadata?['full_name'] ?? user.email?.split('@')[0] ?? 'Guest';
    }
    _loadStats();
  }

  Future<void> _loadStats() async {
    try {
      final bookings = await SupabaseService.getMyBookings();
      final points = await SupabaseService.getLoyaltyPoints();
      if (mounted) setState(() {
        _bookingsCount = bookings.where((b) => ['confirmed', 'pending', 'checked_in'].contains(b['status'])).length;
        _points = points.fold<int>(0, (sum, p) => sum + ((p['points'] as num?)?.toInt() ?? 0));
      });
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async => _loadInfo(),
        child: CustomScrollView(slivers: [
          // Hero App Bar
          SliverAppBar(
            expandedHeight: 200,
            floating: false,
            pinned: true,
            stretch: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isDark
                      ? [const Color(0xFF0B1120), const Color(0xFF162032)]
                      : [const Color(0xFF0EA5E9), const Color(0xFF06B6D4)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(Icons.hotel, color: Colors.white, size: 24),
                        ),
                        const Spacer(),
                        GestureDetector(
                          onTap: () {
                            context.push('/profile/notifications');
                            // Reset badge after opening
                            Future.delayed(const Duration(milliseconds: 500), () { if (mounted) setState(() => _unreadNotifications = 0); });
                          },
                          child: Stack(
                            clipBehavior: Clip.none,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: const Icon(Icons.notifications_outlined, color: Colors.white, size: 22),
                              ),
                              if (_unreadNotifications > 0)
                                Positioned(
                                  top: -4,
                                  right: -4,
                                  child: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: const BoxDecoration(
                                      color: Color(0xFFEF4444),
                                      shape: BoxShape.circle,
                                    ),
                                    constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                                    child: Text(
                                      _unreadNotifications > 99 ? '99+' : '$_unreadNotifications',
                                      style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold, height: 1),
                                      textAlign: TextAlign.center,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ]),
                      const SizedBox(height: 20),
                      Text(_greeting, style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 14)),
                      const SizedBox(height: 2),
                      Text(_userName, style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text('Your premium hotel experience', style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 13)),
                    ]),
                  ),
                ),
              ),
            ),
          ),

          // Quick Stats
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Row(children: [
                Expanded(child: _StatCard(
                  icon: Icons.calendar_today,
                  label: 'Active Bookings',
                  value: '$_bookingsCount',
                  color: const Color(0xFF3B82F6),
                  onTap: () => context.go('/bookings'),
                )),
                const SizedBox(width: 10),
                Expanded(child: _StatCard(
                  icon: Icons.star,
                  label: 'Loyalty Points',
                  value: '$_points',
                  color: const Color(0xFFD4A853),
                  onTap: () => context.push('/profile/loyalty'),
                )),
              ]),
            ),
          ),

          // Quick Actions Section
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Text('Quick Actions', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: cs.onSurface)),
            ),
          ),

          SliverToBoxAdapter(
            child: SizedBox(
              height: 100,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  _QuickAction(icon: Icons.bed, label: 'Book Room', color: const Color(0xFF0EA5E9), onTap: () => context.go('/rooms')),
                  _QuickAction(icon: Icons.smart_toy, label: 'AI Concierge', color: const Color(0xFF8B5CF6), onTap: () => context.go('/chat')),
                  _QuickAction(icon: Icons.support_agent, label: 'Support', color: const Color(0xFF22C55E), onTap: () => context.push('/profile/support')),
                  _QuickAction(icon: Icons.loyalty, label: 'Loyalty', color: const Color(0xFFD4A853), onTap: () => context.push('/profile/loyalty')),
                  _QuickAction(icon: Icons.rate_review, label: 'Reviews', color: const Color(0xFFF59E0B), onTap: () => context.push('/profile/reviews')),
                ],
              ),
            ),
          ),

          // Services Section
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
              child: Text('Hotel Services', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: cs.onSurface)),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(children: [
                _ServiceTile(icon: Icons.restaurant, iconColor: const Color(0xFFF97316), title: 'Room Service', subtitle: 'Order food & beverages to your room', onTap: () {}),
                _ServiceTile(icon: Icons.spa, iconColor: const Color(0xFFEC4899), title: 'Spa & Wellness', subtitle: 'Relax and rejuvenate with our spa treatments', onTap: () {}),
                _ServiceTile(icon: Icons.pool, iconColor: const Color(0xFF06B6D4), title: 'Pool & Recreation', subtitle: 'Enjoy our pool facilities and activities', onTap: () {}),
                _ServiceTile(icon: Icons.local_laundry_service, iconColor: const Color(0xFF8B5CF6), title: 'Laundry Service', subtitle: 'Professional laundry & dry cleaning', onTap: () {}),
                _ServiceTile(icon: Icons.local_taxi, iconColor: const Color(0xFF14B8A6), title: 'Airport Transfer', subtitle: 'Convenient airport pickup & drop-off', onTap: () {}),
              ]),
            ),
          ),

          const SliverPadding(padding: EdgeInsets.only(bottom: 24)),
        ]),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label, value;
  final Color color;
  final VoidCallback onTap;
  const _StatCard({required this.icon, required this.label, required this.value, required this.color, required this.onTap});

  @override Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: cs.outlineVariant.withOpacity(0.5)),
          color: cs.surface,
        ),
        child: Row(children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, size: 20, color: color),
          ),
          const SizedBox(width: 12),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color)),
            Text(label, style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
          ]),
        ]),
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _QuickAction({required this.icon, required this.label, required this.color, required this.onTap});

  @override Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          width: 80,
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            color: color.withOpacity(0.08),
            border: Border.all(color: color.withOpacity(0.2)),
          ),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: color.withOpacity(0.15), shape: BoxShape.circle),
              child: Icon(icon, size: 22, color: color),
            ),
            const SizedBox(height: 8),
            Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color), textAlign: TextAlign.center),
          ]),
        ),
      ),
    );
  }
}

class _ServiceTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title, subtitle;
  final VoidCallback onTap;
  const _ServiceTile({required this.icon, required this.iconColor, required this.title, required this.subtitle, required this.onTap});

  @override Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: Material(
        borderRadius: BorderRadius.circular(14),
        color: cs.surface,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: cs.outlineVariant.withOpacity(0.3)),
            ),
            child: Row(children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: iconColor.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                child: Icon(icon, size: 22, color: iconColor),
              ),
              const SizedBox(width: 14),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                const SizedBox(height: 2),
                Text(subtitle, style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant), maxLines: 1, overflow: TextOverflow.ellipsis),
              ])),
              Icon(Icons.chevron_right, color: cs.onSurfaceVariant, size: 20),
            ]),
          ),
        ),
      ),
    );
  }
}
