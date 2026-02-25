import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/supabase_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _userName = 'Guest';

  @override
  void initState() {
    super.initState();
    final user = SupabaseService.currentUser;
    if (user != null) {
      _userName = user.userMetadata?['full_name'] ?? user.email?.split('@')[0] ?? 'Guest';
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    final amenities = [
      {'icon': Icons.pool, 'name': 'Infinity Pool'},
      {'icon': Icons.spa, 'name': 'Full-Service Spa'},
      {'icon': Icons.restaurant, 'name': 'Fine Dining'},
      {'icon': Icons.fitness_center, 'name': 'Fitness Center'},
      {'icon': Icons.wifi, 'name': 'Free Wi-Fi'},
      {'icon': Icons.local_bar, 'name': 'Rooftop Bar'},
      {'icon': Icons.beach_access, 'name': 'Private Beach'},
      {'icon': Icons.room_service, 'name': '24/7 Room Service'},
    ];

    return Scaffold(
      body: CustomScrollView(slivers: [
        SliverAppBar.large(
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Hello, $_userName', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.normal)),
              const Text('Grand Azure Resort & Spa'),
            ],
          ),
        ),

        // Hero Card
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Card(
              clipBehavior: Clip.antiAlias,
              child: Column(children: [
                Container(
                  height: 160,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [cs.primary, cs.primary.withOpacity(0.7)]),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        const Text('Grand Azure Resort & Spa', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Row(children: [
                          const Icon(Icons.location_on, color: Colors.white70, size: 14),
                          const SizedBox(width: 4),
                          const Text('Miami Beach, Florida', style: TextStyle(color: Colors.white70, fontSize: 13)),
                          const Spacer(),
                          Row(children: [
                            Icon(Icons.star, color: Colors.amber.shade300, size: 16),
                            const SizedBox(width: 2),
                            const Text('4.8', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          ]),
                        ]),
                      ],
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(children: [
                    Expanded(
                      child: FilledButton.icon(
                        onPressed: () => context.go('/rooms'),
                        icon: const Icon(Icons.bed_outlined, size: 18),
                        label: const Text('Book a Room'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: FilledButton.tonalIcon(
                        onPressed: () => context.go('/chat'),
                        icon: const Icon(Icons.chat_bubble_outline, size: 18),
                        label: const Text('AI Concierge'),
                      ),
                    ),
                  ]),
                ),
              ]),
            ),
          ),
        ),

        // Check-in / Check-out times
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(children: [
              Expanded(child: Card(child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(children: [
                  Icon(Icons.login, color: cs.primary),
                  const SizedBox(height: 8),
                  const Text('Check-in', style: TextStyle(fontSize: 12)),
                  const Text('3:00 PM', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ]),
              ))),
              const SizedBox(width: 12),
              Expanded(child: Card(child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(children: [
                  Icon(Icons.logout, color: cs.primary),
                  const SizedBox(height: 8),
                  const Text('Check-out', style: TextStyle(fontSize: 12)),
                  const Text('11:00 AM', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ]),
              ))),
              const SizedBox(width: 12),
              Expanded(child: Card(child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(children: [
                  Icon(Icons.phone, color: cs.primary),
                  const SizedBox(height: 8),
                  const Text('Front Desk', style: TextStyle(fontSize: 12)),
                  const Text('555-0100', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                ]),
              ))),
            ]),
          ),
        ),

        // Amenities
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
            child: Text('Hotel Amenities', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          sliver: SliverGrid.count(
            crossAxisCount: 4,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
            children: amenities.map((a) => Card(
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(a['icon'] as IconData, color: cs.primary, size: 24),
                const SizedBox(height: 6),
                Text(a['name'] as String, textAlign: TextAlign.center, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w500)),
              ]),
            )).toList(),
          ),
        ),

        // Quick Actions
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
            child: Text('Quick Actions', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(children: [
              Card(child: ListTile(
                leading: Icon(Icons.bed_outlined, color: cs.primary),
                title: const Text('Book a Room'),
                subtitle: const Text('Browse rooms and make a reservation'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.go('/rooms'),
              )),
              const SizedBox(height: 8),
              Card(child: ListTile(
                leading: Icon(Icons.calendar_today, color: cs.primary),
                title: const Text('My Bookings'),
                subtitle: const Text('View your current and past bookings'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.go('/bookings'),
              )),
              const SizedBox(height: 8),
              Card(child: ListTile(
                leading: Icon(Icons.chat_bubble_outline, color: cs.primary),
                title: const Text('AI Concierge'),
                subtitle: const Text('Ask about dining, spa, activities'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.go('/chat'),
              )),
              const SizedBox(height: 8),
              Card(child: ListTile(
                leading: Icon(Icons.rate_review_outlined, color: cs.primary),
                title: const Text('Write a Review'),
                subtitle: const Text('Share your experience'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.push('/profile/reviews'),
              )),
            ]),
          ),
        ),

        const SliverPadding(padding: EdgeInsets.only(bottom: 24)),
      ]),
    );
  }
}

