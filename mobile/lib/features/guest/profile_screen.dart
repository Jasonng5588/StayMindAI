import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';
import '../../services/supabase_service.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cs = Theme.of(context).colorScheme;
    final user = SupabaseService.currentUser;
    final isDark = ref.watch(themeProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        // Avatar card
        Card(child: Padding(padding: const EdgeInsets.all(20), child: Column(children: [
          CircleAvatar(radius: 40, backgroundColor: cs.primaryContainer, child: Text(user?.email?.substring(0, 1).toUpperCase() ?? 'U', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: cs.primary))),
          const SizedBox(height: 12),
          Text(user?.userMetadata?['full_name'] ?? 'User', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          Text(user?.email ?? '', style: TextStyle(color: cs.onSurfaceVariant)),
        ]))),
        const SizedBox(height: 16),
        // Settings
        Card(child: Column(children: [
          _Tile(icon: Icons.person_outline, title: 'Edit Profile', onTap: () {}),
          const Divider(height: 1),
          _Tile(icon: Icons.rate_review_outlined, title: 'My Reviews', onTap: () => context.push('/profile/reviews')),
          const Divider(height: 1),
          _Tile(icon: Icons.loyalty_outlined, title: 'Loyalty Program', onTap: () => context.push('/profile/loyalty')),
          const Divider(height: 1),
          _Tile(icon: Icons.support_agent_outlined, title: 'Support', onTap: () => context.push('/profile/support')),
          const Divider(height: 1),
          _Tile(icon: Icons.notifications_outlined, title: 'Notifications', onTap: () => context.push('/profile/notifications')),
          const Divider(height: 1),
          SwitchListTile(secondary: Icon(isDark ? Icons.dark_mode : Icons.light_mode), title: const Text('Dark Mode'), value: isDark, onChanged: (_) => ref.read(themeProvider.notifier).toggle()),
          const Divider(height: 1),
          _Tile(icon: Icons.info_outline, title: 'About', onTap: () => showAboutDialog(context: context, applicationName: 'StayMind AI', applicationVersion: '1.0.0')),
        ])),
        const SizedBox(height: 16),
        Card(child: _Tile(icon: Icons.logout, title: 'Sign Out', color: cs.error, onTap: () async { await SupabaseService.signOut(); if (context.mounted) context.go('/login'); })),
      ]),
    );
  }
}

class _Tile extends StatelessWidget {
  final IconData icon; final String title; final VoidCallback onTap; final Color? color;
  const _Tile({required this.icon, required this.title, required this.onTap, this.color});
  @override Widget build(BuildContext context) => ListTile(leading: Icon(icon, color: color), title: Text(title, style: TextStyle(color: color)), trailing: Icon(Icons.chevron_right, color: color ?? Theme.of(context).colorScheme.onSurfaceVariant), onTap: onTap);
}
