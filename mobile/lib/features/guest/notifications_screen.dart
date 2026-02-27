import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../services/supabase_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<Map<String, dynamic>> _notifications = [];
  bool _loading = true;
  RealtimeChannel? _channel;

  @override
  void initState() {
    super.initState();
    _load();
    _subscribeRealtime();
  }

  @override
  void dispose() {
    if (_channel != null) SupabaseService.client.removeChannel(_channel!);
    super.dispose();
  }

  Future<void> _load() async {
    try { _notifications = await SupabaseService.getNotifications(); } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  void _subscribeRealtime() {
    _channel = SupabaseService.subscribeToNotifications((newNotif) {
      if (mounted) {
        setState(() => _notifications.insert(0, newNotif));
        // Show snackbar for live notification
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(children: [
              Text(_typeIcon(newNotif['type']?.toString()), style: const TextStyle(fontSize: 20)),
              const SizedBox(width: 10),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                Text(newNotif['title']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white)),
                Text(newNotif['message']?.toString() ?? '', style: const TextStyle(fontSize: 12, color: Colors.white70), maxLines: 1, overflow: TextOverflow.ellipsis),
              ])),
            ]),
            backgroundColor: _typeColor(newNotif['type']?.toString()),
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 4),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    });
  }

  IconData _icon(String? type) => switch (type) {
    'booking' => Icons.calendar_today,
    'payment' => Icons.payment,
    'review' => Icons.star,
    'support' => Icons.headset_mic,
    'loyalty' => Icons.stars,
    'voucher' => Icons.local_offer,
    'reward' => Icons.card_giftcard,
    _ => Icons.notifications,
  };

  String _typeIcon(String? type) => switch (type) {
    'booking' => '🏨', 'support' => '🎧', 'loyalty' => '⭐',
    'voucher' => '🎟️', 'reward' => '🎁', _ => '🔔',
  };

  Color _typeColor(String? type) => switch (type) {
    'support' => Colors.blue.shade600,
    'voucher' => Colors.orange.shade600,
    'reward' => Colors.purple.shade600,
    'loyalty' => Colors.amber.shade700,
    _ => Colors.grey.shade700,
  };

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final unread = _notifications.where((n) => n['is_read'] == false).length;

    return Scaffold(
      appBar: AppBar(
        title: Row(children: [
          const Text('Notifications'),
          if (unread > 0) ...[ const SizedBox(width: 8), Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2), decoration: BoxDecoration(color: cs.primary, borderRadius: BorderRadius.circular(10)), child: Text('$unread', style: TextStyle(color: cs.onPrimary, fontSize: 11, fontWeight: FontWeight.bold))) ],
        ]),
        actions: [
          if (_notifications.any((n) => n['is_read'] == false))
            TextButton.icon(
              onPressed: () async {
                await SupabaseService.markAllNotificationsRead();
                setState(() { for (final n in _notifications) n['is_read'] = true; });
              },
              icon: const Icon(Icons.done_all, size: 18),
              label: const Text('All read'),
            ),
        ],
      ),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : _notifications.isEmpty
          ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.notifications_none, size: 56, color: cs.onSurfaceVariant.withOpacity(0.4)),
              const SizedBox(height: 12),
              Text('No notifications yet', style: TextStyle(color: cs.onSurfaceVariant)),
              const SizedBox(height: 4),
              Text('Notifications about bookings, rewards, and support replies will appear here', style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant.withOpacity(0.7)), textAlign: TextAlign.center),
            ]))
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView.separated(
                itemCount: _notifications.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (_, i) {
                  final n = _notifications[i];
                  final isRead = n['is_read'] == true;
                  final type = n['type']?.toString();
                  return Dismissible(
                    key: Key(n['id']?.toString() ?? i.toString()),
                    direction: DismissDirection.endToStart,
                    background: Container(color: cs.errorContainer, alignment: Alignment.centerRight, padding: const EdgeInsets.only(right: 16), child: Icon(Icons.delete, color: cs.error)),
                    onDismissed: (_) async {
                      setState(() => _notifications.removeAt(i));
                    },
                    child: ListTile(
                      leading: AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: isRead ? cs.surfaceVariant : cs.primaryContainer,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(_icon(type), size: 20, color: isRead ? cs.onSurfaceVariant : cs.primary),
                      ),
                      title: Text(n['title'] ?? '', style: TextStyle(fontWeight: isRead ? FontWeight.normal : FontWeight.bold, fontSize: 14)),
                      subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(n['message'] ?? '', maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
                        const SizedBox(height: 2),
                        Text(_timeAgo(n['created_at']?.toString()), style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant.withOpacity(0.6))),
                      ]),
                      trailing: !isRead ? Container(width: 8, height: 8, decoration: BoxDecoration(shape: BoxShape.circle, color: cs.primary)) : null,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      onTap: () {
                        if (!isRead) {
                          SupabaseService.markNotificationRead(n['id']?.toString() ?? '');
                          setState(() => n['is_read'] = true);
                        }
                      },
                    ),
                  );
                },
              ),
            ),
    );
  }

  String _timeAgo(String? iso) {
    if (iso == null) return '';
    final dt = DateTime.tryParse(iso);
    if (dt == null) return '';
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inHours < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays < 1) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}
