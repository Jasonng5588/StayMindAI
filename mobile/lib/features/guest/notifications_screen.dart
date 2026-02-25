import 'package:flutter/material.dart';
import '../../services/supabase_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<Map<String, dynamic>> _notifications = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try { _notifications = await SupabaseService.getNotifications(); } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  IconData _icon(String? type) => switch (type) { 'booking' => Icons.calendar_today, 'payment' => Icons.payment, 'review' => Icons.star, 'chat' => Icons.chat, _ => Icons.notifications };

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications'), actions: [TextButton(onPressed: () async { for (final n in _notifications) { await SupabaseService.markNotificationRead(n['id']); } _load(); }, child: const Text('Mark all read'))]),
      body: _loading ? const Center(child: CircularProgressIndicator()) : _notifications.isEmpty
        ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.notifications_off, size: 48, color: cs.onSurfaceVariant), const SizedBox(height: 8), const Text('No notifications')]))
        : RefreshIndicator(onRefresh: _load, child: ListView.separated(itemCount: _notifications.length, separatorBuilder: (_, __) => const Divider(height: 1),
          itemBuilder: (_, i) {
            final n = _notifications[i];
            final isRead = n['is_read'] == true;
            return ListTile(
              leading: CircleAvatar(backgroundColor: isRead ? cs.surfaceVariant : cs.primaryContainer, child: Icon(_icon(n['type']), size: 18, color: isRead ? cs.onSurfaceVariant : cs.primary)),
              title: Text(n['title'] ?? '', style: TextStyle(fontWeight: isRead ? FontWeight.normal : FontWeight.bold, fontSize: 14)),
              subtitle: Text(n['message'] ?? '', maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
              trailing: !isRead ? Container(width: 8, height: 8, decoration: BoxDecoration(shape: BoxShape.circle, color: cs.primary)) : null,
              onTap: () { if (!isRead) { SupabaseService.markNotificationRead(n['id']); setState(() => n['is_read'] = true); } },
            );
          },
        )),
    );
  }
}

