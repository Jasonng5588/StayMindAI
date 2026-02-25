import 'package:flutter/material.dart';

class GuestChatScreen extends StatelessWidget {
  const GuestChatScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    // Mock guest conversations
    final chats = [
      {'name': 'James Wilson', 'room': '201', 'lastMsg': 'Can I get extra towels?', 'time': '2m ago', 'unread': 2},
      {'name': 'Sarah Chen', 'room': '305', 'lastMsg': 'Thank you for the great service!', 'time': '15m ago', 'unread': 0},
      {'name': 'Mike Johnson', 'room': '412', 'lastMsg': 'Is late checkout available?', 'time': '1h ago', 'unread': 1},
      {'name': 'Emma Davis', 'room': '108', 'lastMsg': 'The AC isn\'t working properly', 'time': '3h ago', 'unread': 0},
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Guest Messages')),
      body: ListView.separated(
        itemCount: chats.length,
        separatorBuilder: (_, __) => const Divider(height: 1),
        itemBuilder: (_, i) {
          final c = chats[i];
          return ListTile(
            leading: CircleAvatar(backgroundColor: cs.primaryContainer, child: Text((c['name'] as String)[0], style: TextStyle(fontWeight: FontWeight.bold, color: cs.primary))),
            title: Row(children: [Text(c['name'] as String, style: const TextStyle(fontWeight: FontWeight.w600)), const SizedBox(width: 8), Text('Room ${c['room']}', style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant))]),
            subtitle: Text(c['lastMsg'] as String, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant)),
            trailing: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Text(c['time'] as String, style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
              if ((c['unread'] as int) > 0) ...[const SizedBox(height: 4), Container(padding: const EdgeInsets.all(4), decoration: BoxDecoration(shape: BoxShape.circle, color: cs.primary), child: Text('${c['unread']}', style: TextStyle(fontSize: 10, color: cs.onPrimary, fontWeight: FontWeight.bold)))],
            ]),
          );
        },
      ),
    );
  }
}

