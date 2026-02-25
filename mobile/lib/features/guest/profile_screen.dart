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
    final name = user?.userMetadata?['full_name'] ?? 'User';
    final email = user?.email ?? '';
    final initial = (email.isNotEmpty ? email[0] : 'U').toUpperCase();

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Gradient app bar with avatar
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [cs.primary, cs.primary.withOpacity(0.7)],
                  ),
                ),
                child: SafeArea(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 20),
                      CircleAvatar(
                        radius: 40,
                        backgroundColor: Colors.white.withOpacity(0.2),
                        child: Text(initial, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
                      ),
                      const SizedBox(height: 10),
                      Text(name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                      Text(email, style: TextStyle(fontSize: 13, color: Colors.white.withOpacity(0.8))),
                    ],
                  ),
                ),
              ),
            ),
          ),

          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // Account section
                _SectionTitle(title: 'Account', cs: cs),
                const SizedBox(height: 8),
                _MenuCard(children: [
                  _Tile(icon: Icons.person_outline, title: 'Edit Profile', subtitle: 'Update your personal info', onTap: () => context.push('/profile/edit')),
                  _Tile(icon: Icons.rate_review_outlined, title: 'My Reviews', subtitle: 'View your hotel reviews', onTap: () => context.push('/profile/reviews')),
                  _Tile(icon: Icons.notifications_outlined, title: 'Notifications', subtitle: 'Alerts and updates', onTap: () => context.push('/profile/notifications')),
                ]),
                const SizedBox(height: 20),

                // Services section
                _SectionTitle(title: 'Services', cs: cs),
                const SizedBox(height: 8),
                _MenuCard(children: [
                  _Tile(icon: Icons.loyalty_outlined, title: 'Loyalty Program', subtitle: 'Points, tiers & rewards', iconColor: Colors.amber.shade600, onTap: () => context.push('/profile/loyalty')),
                  _Tile(icon: Icons.support_agent_outlined, title: 'Support Center', subtitle: 'Get help & support', iconColor: Colors.blue, onTap: () => context.push('/profile/support')),
                ]),
                const SizedBox(height: 20),

                // Preferences section
                _SectionTitle(title: 'Preferences', cs: cs),
                const SizedBox(height: 8),
                Card(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Column(children: [
                    SwitchListTile(
                      secondary: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: (isDark ? Colors.indigo : Colors.amber).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(isDark ? Icons.dark_mode : Icons.light_mode, color: isDark ? Colors.indigo : Colors.amber.shade700),
                      ),
                      title: const Text('Dark Mode'),
                      subtitle: Text(isDark ? 'Dark theme active' : 'Light theme active', style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
                      value: isDark,
                      onChanged: (_) => ref.read(themeProvider.notifier).toggle(),
                    ),
                    const Divider(height: 1, indent: 16, endIndent: 16),
                    _Tile(icon: Icons.info_outline, title: 'About', subtitle: 'Version 1.0.0', onTap: () => showAboutDialog(context: context, applicationName: 'StayMind AI', applicationVersion: '1.0.0', applicationLegalese: '\u00a9 2026 StayMind AI')),
                  ]),
                ),
                const SizedBox(height: 20),

                // Sign out
                Card(
                  color: cs.errorContainer.withOpacity(0.3),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: _Tile(
                    icon: Icons.logout,
                    title: 'Sign Out',
                    subtitle: 'Log out of your account',
                    iconColor: cs.error,
                    titleColor: cs.error,
                    onTap: () async {
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          title: const Text('Sign Out'),
                          content: const Text('Are you sure you want to sign out?'),
                          actions: [
                            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Sign Out')),
                          ],
                        ),
                      );
                      if (confirm == true && context.mounted) {
                        await SupabaseService.signOut();
                        if (context.mounted) context.go('/login');
                      }
                    },
                  ),
                ),
                const SizedBox(height: 32),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  final ColorScheme cs;
  const _SectionTitle({required this.title, required this.cs});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(left: 4),
    child: Text(title, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: cs.onSurfaceVariant, letterSpacing: 0.5)),
  );
}

class _MenuCard extends StatelessWidget {
  final List<Widget> children;
  const _MenuCard({required this.children});
  @override
  Widget build(BuildContext context) => Card(
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    child: Column(children: [
      for (int i = 0; i < children.length; i++) ...[
        children[i],
        if (i < children.length - 1) const Divider(height: 1, indent: 16, endIndent: 16),
      ],
    ]),
  );
}

class _Tile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;
  final Color? iconColor;
  final Color? titleColor;
  const _Tile({required this.icon, required this.title, this.subtitle, required this.onTap, this.iconColor, this.titleColor});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: (iconColor ?? cs.primary).withOpacity(0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: iconColor ?? cs.primary, size: 22),
      ),
      title: Text(title, style: TextStyle(fontWeight: FontWeight.w500, color: titleColor)),
      subtitle: subtitle != null ? Text(subtitle!, style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)) : null,
      trailing: Icon(Icons.chevron_right, color: cs.outlineVariant),
      onTap: onTap,
    );
  }
}
