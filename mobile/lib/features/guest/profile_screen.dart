import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../services/supabase_service.dart';
import '../../core/theme.dart';
import '../../core/animations.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cs = Theme.of(context).colorScheme;
    final isDark = ref.watch(themeProvider);
    final user = SupabaseService.currentUser;
    final name = user?.userMetadata?['full_name'] ?? user?.email?.split('@')[0] ?? 'Guest';
    final email = user?.email ?? '';

    return Scaffold(
      body: CustomScrollView(slivers: [
        SliverAppBar(
          expandedHeight: 180,
          pinned: true,
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isDark
                    ? [const Color(0xFF162032), const Color(0xFF0B1120)]
                    : [cs.primary, cs.primary.withOpacity(0.7)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: SafeArea(
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  const SizedBox(height: 16),
                  CircleAvatar(
                    radius: 36,
                    backgroundColor: Colors.white.withOpacity(0.2),
                    child: Text(name.isNotEmpty ? name[0].toUpperCase() : 'G', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
                  ),
                  const SizedBox(height: 10),
                  Text(name, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                  Text(email, style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 13)),
                ]),
              ),
            ),
          ),
        ),

        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(children: [
              // Account section
              AnimatedEntrance(delayMs: 100, child: _SectionHeader(title: 'Account')),
              AnimatedEntrance(delayMs: 150, child: TapBounce(child: _ProfileTile(icon: Icons.person_outline, iconColor: const Color(0xFF3B82F6), title: 'Edit Profile', onTap: () => context.push('/profile/edit')))),
              AnimatedEntrance(delayMs: 200, child: TapBounce(child: _ProfileTile(icon: Icons.notifications_outlined, iconColor: const Color(0xFFF59E0B), title: 'Notifications', onTap: () => context.push('/profile/notifications')))),
              AnimatedEntrance(delayMs: 250, child: TapBounce(child: _ProfileTile(
                icon: isDark ? Icons.dark_mode : Icons.light_mode,
                iconColor: const Color(0xFF8B5CF6),
                title: 'Dark Mode',
                trailing: Switch.adaptive(value: isDark, onChanged: (_) => ref.read(themeProvider.notifier).toggle()),
                onTap: () => ref.read(themeProvider.notifier).toggle(),
              ))),
              const SizedBox(height: 16),

              // Activity section
              AnimatedEntrance(delayMs: 300, child: _SectionHeader(title: 'Activity')),
              AnimatedEntrance(delayMs: 350, child: TapBounce(child: _ProfileTile(icon: Icons.calendar_today, iconColor: const Color(0xFF0EA5E9), title: 'My Bookings', onTap: () => context.go('/bookings')))),
              AnimatedEntrance(delayMs: 400, child: TapBounce(child: _ProfileTile(icon: Icons.rate_review_outlined, iconColor: const Color(0xFFF97316), title: 'My Reviews', onTap: () => context.push('/profile/reviews')))),
              AnimatedEntrance(delayMs: 450, child: TapBounce(child: _ProfileTile(icon: Icons.loyalty, iconColor: const Color(0xFFD4A853), title: 'Loyalty Program', onTap: () => context.push('/profile/loyalty')))),
              AnimatedEntrance(delayMs: 500, child: TapBounce(child: _ProfileTile(icon: Icons.card_giftcard, iconColor: const Color(0xFF7C3AED), title: 'My Rewards', onTap: () => context.push('/profile/rewards')))),
              AnimatedEntrance(delayMs: 550, child: TapBounce(child: _ProfileTile(icon: Icons.local_offer, iconColor: const Color(0xFFEF4444), title: 'My Vouchers', onTap: () => context.push('/profile/vouchers')))),
              const SizedBox(height: 16),

              // Help section
              AnimatedEntrance(delayMs: 600, child: _SectionHeader(title: 'Help & Support')),
              AnimatedEntrance(delayMs: 650, child: TapBounce(child: _ProfileTile(icon: Icons.support_agent, iconColor: const Color(0xFF22C55E), title: 'Support Tickets', onTap: () => context.push('/profile/support')))),
              AnimatedEntrance(delayMs: 700, child: TapBounce(child: _ProfileTile(icon: Icons.smart_toy, iconColor: const Color(0xFF7C3AED), title: 'AI Concierge', onTap: () => context.go('/chat')))),
              AnimatedEntrance(delayMs: 750, child: TapBounce(child: _ProfileTile(icon: Icons.info_outline, iconColor: const Color(0xFF6B7280), title: 'About StayMind', onTap: () {
                showAboutDialog(
                  context: context,
                  applicationName: 'StayMind AI',
                  applicationVersion: '1.0.0',
                  applicationLegalese: '\u00A9 2024 StayMind AI. All rights reserved.',
                );
              }))),
              const SizedBox(height: 24),

              // Sign out
              AnimatedEntrance(
                delayMs: 800,
                child: TapBounce(
                  child: SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        final confirmed = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          title: const Text('Sign Out'),
                          content: const Text('Are you sure you want to sign out?'),
                          actions: [
                            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                            FilledButton(onPressed: () => Navigator.pop(ctx, true), style: FilledButton.styleFrom(backgroundColor: cs.error), child: const Text('Sign Out')),
                          ],
                        ));
                        if (confirmed == true) {
                          await SupabaseService.signOut();
                          if (context.mounted) context.go('/login');
                        }
                      },
                      icon: Icon(Icons.logout, color: cs.error),
                      label: Text('Sign Out', style: TextStyle(color: cs.error)),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: cs.error.withOpacity(0.5)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 32),
            ]),
          ),
        ),
      ]),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});
  @override Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Align(alignment: Alignment.centerLeft, child: Text(title, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.onSurfaceVariant, letterSpacing: 0.5))),
  );
}

class _ProfileTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final VoidCallback onTap;
  final Widget? trailing;
  const _ProfileTile({required this.icon, required this.iconColor, required this.title, required this.onTap, this.trailing});

  @override Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      child: Material(
        borderRadius: BorderRadius.circular(12),
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            child: Row(children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: iconColor.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                child: Icon(icon, size: 20, color: iconColor),
              ),
              const SizedBox(width: 14),
              Expanded(child: Text(title, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14))),
              trailing ?? Icon(Icons.chevron_right, size: 20, color: cs.onSurfaceVariant),
            ]),
          ),
        ),
      ),
    );
  }
}
