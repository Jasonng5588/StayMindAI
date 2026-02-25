import 'package:flutter/material.dart';
import '../../services/supabase_service.dart';

class HousekeepingScreen extends StatefulWidget {
  const HousekeepingScreen({super.key});
  @override State<HousekeepingScreen> createState() => _HousekeepingScreenState();
}

class _HousekeepingScreenState extends State<HousekeepingScreen> {
  List<Map<String, dynamic>> _tasks = [];
  bool _loading = true;
  String? _hotelId;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final hotel = await SupabaseService.getStaffHotel();
      _hotelId = hotel?['id'];
      if (_hotelId != null) _tasks = await SupabaseService.getHousekeepingTasks(_hotelId!);
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Color _statusColor(String? s) => switch (s) { 'pending' => Colors.amber, 'in_progress' => Colors.blue, 'completed' => Colors.green, _ => Colors.grey };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Housekeeping')),
      body: _loading ? const Center(child: CircularProgressIndicator()) : _tasks.isEmpty
        ? const Center(child: Text('No tasks'))
        : RefreshIndicator(onRefresh: _load, child: ListView.separated(padding: const EdgeInsets.all(16), itemCount: _tasks.length, separatorBuilder: (_, __) => const SizedBox(height: 8), itemBuilder: (_, i) {
          final t = _tasks[i];
          return Card(child: ListTile(
            leading: CircleAvatar(backgroundColor: _statusColor(t['status']).withOpacity(0.1), child: Icon(Icons.cleaning_services, color: _statusColor(t['status']))),
            title: Text('Room ${t['rooms']?['room_number'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text('${t['task_type'] ?? 'General'} â€¢ ${t['priority'] ?? 'normal'}', style: const TextStyle(fontSize: 12)),
            trailing: PopupMenuButton<String>(onSelected: (status) async { await SupabaseService.updateTaskStatus(t['id'], status); _load(); }, itemBuilder: (_) => ['pending', 'in_progress', 'completed'].map((s) => PopupMenuItem(value: s, child: Text(s.replaceAll('_', ' ')))).toList()),
          ));
        })),
    );
  }
}

