import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../services/supabase_service.dart';
import '../../core/animations.dart';

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
            child: AnimatedEntrance(
              delayMs: 100,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Row(children: [
                  Expanded(child: TapBounce(
                    child: _StatCard(
                      icon: Icons.calendar_today,
                      label: 'Active Bookings',
                      value: '$_bookingsCount',
                      color: const Color(0xFF3B82F6),
                      onTap: () => context.go('/bookings'),
                    ),
                  )),
                  const SizedBox(width: 10),
                  Expanded(child: TapBounce(
                    child: _StatCard(
                      icon: Icons.star,
                      label: 'Loyalty Points',
                      value: '$_points',
                      color: const Color(0xFFD4A853),
                      onTap: () => context.push('/profile/loyalty'),
                    ),
                  )),
                ]),
              ),
            ),
          ),

          // Quick Actions Section
          SliverToBoxAdapter(
            child: AnimatedEntrance(
              delayMs: 200,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                child: Text('Quick Actions', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: cs.onSurface)),
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: SizedBox(
              height: 100,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  AnimatedEntrance(delayMs: 250, slideFrom: const Offset(0.06, 0), child: _QuickAction(icon: Icons.bed, label: 'Book Room', color: const Color(0xFF0EA5E9), onTap: () => context.go('/rooms'))),
                  AnimatedEntrance(delayMs: 300, slideFrom: const Offset(0.06, 0), child: _QuickAction(icon: Icons.smart_toy, label: 'AI Concierge', color: const Color(0xFF8B5CF6), onTap: () => context.go('/chat'))),
                  AnimatedEntrance(delayMs: 350, slideFrom: const Offset(0.06, 0), child: _QuickAction(icon: Icons.support_agent, label: 'Support', color: const Color(0xFF22C55E), onTap: () => context.push('/profile/support'))),
                  AnimatedEntrance(delayMs: 400, slideFrom: const Offset(0.06, 0), child: _QuickAction(icon: Icons.loyalty, label: 'Loyalty', color: const Color(0xFFD4A853), onTap: () => context.push('/profile/loyalty'))),
                  AnimatedEntrance(delayMs: 450, slideFrom: const Offset(0.06, 0), child: _QuickAction(icon: Icons.rate_review, label: 'Reviews', color: const Color(0xFFF59E0B), onTap: () => context.push('/profile/reviews'))),
                ],
              ),
            ),
          ),

          // Services Section
          SliverToBoxAdapter(
            child: AnimatedEntrance(
              delayMs: 350,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
                child: Text('Hotel Services', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: cs.onSurface)),
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(children: [
                AnimatedEntrance(delayMs: 400, child: TapBounce(child: _ServiceTile(icon: Icons.restaurant, iconColor: const Color(0xFFF97316), title: 'Room Service', subtitle: 'Order food & beverages to your room', onTap: () {
                  context.push('/service-detail', extra: {
                    'title': 'Room Service', 'subtitle': 'Order food & beverages to your room', 'icon': Icons.restaurant, 'iconColor': const Color(0xFFF97316),
                    'image': 'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=1000',
                    'article': 'Experience the ultimate convenience and luxury with our 24/7 in-room dining service. Whether you are craving a midnight snack, a hearty breakfast in bed, or a romantic dinner for two, our expert chefs have curated a menu to satisfy every palate.\n\nOur extensive room service menu features a wide selection of international and local cuisines, prepared with the freshest ingredients. Simply browse the menu, place your order, and our dedicated staff will deliver your meal promptly, ensuring the highest standards of hygiene and presentation.\n\nEnjoy a private dining experience in the comfort of your room, complete with fine dining setup and personalized service. Special dietary requirements can also be accommodated upon request.'
                  });
                }))),
                AnimatedEntrance(delayMs: 450, child: TapBounce(child: _ServiceTile(icon: Icons.spa, iconColor: const Color(0xFFEC4899), title: 'Spa & Wellness', subtitle: 'Relax and rejuvenate with our spa treatments', onTap: () {
                  context.push('/service-detail', extra: {
                    'title': 'Spa & Wellness', 'subtitle': 'Relax and rejuvenate with our spa treatments', 'icon': Icons.spa, 'iconColor': const Color(0xFFEC4899),
                    'image': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=1000',
                    'article': 'Step into an oasis of tranquility and let your stress melt away at our premium Spa & Wellness center. Designed to restore balance to your mind, body, and spirit, we offer a comprehensive range of holistic treatments and therapeutic massages.\n\nOur certified therapists specialize in aromatherapy, deep tissue massage, hot stone therapy, and signature facials using organic, ethically sourced products. The facility is equipped with state-of-the-art steam rooms, saunas, and relaxation lounges where you can unwind before or after your session.\n\nWhether you need a quick 30-minute rejuvenation or a full-day pampering package, our wellness experts will tailor the experience to your exact needs.'
                  });
                }))),
                AnimatedEntrance(delayMs: 500, child: TapBounce(child: _ServiceTile(icon: Icons.pool, iconColor: const Color(0xFF06B6D4), title: 'Pool & Recreation', subtitle: 'Enjoy our pool facilities and activities', onTap: () {
                  context.push('/service-detail', extra: {
                    'title': 'Pool & Recreation', 'subtitle': 'Enjoy our pool facilities and activities', 'icon': Icons.pool, 'iconColor': const Color(0xFF06B6D4),
                    'image': 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=1000',
                    'article': 'Dive into relaxation at our stunning infinity pool, offering breathtaking panoramic views of the city skyline. Crystal-clear, temperature-controlled waters invite you for a refreshing morning swim or a relaxing evening dip under the stars.\n\nThe pool deck is lined with luxurious cabanas and comfortable sun loungers, perfect for soaking up the sun with a good book. Our poolside bar serves a delightful array of tropical cocktails, fresh juices, and light snacks throughout the day.\n\nFor those seeking more active recreation, we also offer a fully-equipped fitness center just steps away, along with weekly aqua-aerobics and yoga sessions by the water.'
                  });
                }))),
                AnimatedEntrance(delayMs: 550, child: TapBounce(child: _ServiceTile(icon: Icons.local_laundry_service, iconColor: const Color(0xFF8B5CF6), title: 'Laundry Service', subtitle: 'Professional laundry & dry cleaning', onTap: () {
                  context.push('/service-detail', extra: {
                    'title': 'Laundry Service', 'subtitle': 'Professional laundry & dry cleaning', 'icon': Icons.local_laundry_service, 'iconColor': const Color(0xFF8B5CF6),
                    'image': 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&q=80&w=1000',
                    'article': 'Travel light and stay fresh with our professional Laundry and Dry Cleaning services. We understand that your wardrobe requires the utmost care, which is why we use state-of-the-art equipment and eco-friendly cleaning agents to ensure your garments are impeccably cleaned and handled.\n\nWe offer both regular and express services. Our standard return time is within 24 hours, but for urgent needs, our express service guarantees your clothes back within 4 hours. From everyday items to delicate fabrics and formal wear, our experienced team provides meticulous care and precision pressing.\n\nSimply place your items in the laundry bag provided in your wardrobe, fill out the form, and notify housekeeping for a quick pickup.'
                  });
                }))),
                AnimatedEntrance(delayMs: 600, child: TapBounce(child: _ServiceTile(icon: Icons.local_taxi, iconColor: const Color(0xFF14B8A6), title: 'Airport Transfer', subtitle: 'Convenient airport pickup & drop-off', onTap: () {
                  context.push('/service-detail', extra: {
                    'title': 'Airport Transfer', 'subtitle': 'Convenient airport pickup & drop-off', 'icon': Icons.local_taxi, 'iconColor': const Color(0xFF14B8A6),
                    'image': 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=1000',
                    'article': 'Start and end your journey in absolute comfort and elegance. Our premium Airport Transfer service offers a seamless, hassle-free transition between the airport and the hotel. Say goodbye to waiting in taxi lines or navigating public transit with luggage.\n\nOur fleet includes luxury sedans, spacious SUVs, and executive vans to accommodate individuals, families, and larger groups. All our vehicles are driven by professional, courteous, and highly-trained chauffeurs who monitor your flight status in real-time to ensure they are there precisely when you arrive.\n\nComplimentary Wi-Fi, bottled water, and reading materials are provided in every vehicle. To book your ride, please contact the concierge at least 12 hours in advance with your flight details.'
                  });
                }))),
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
