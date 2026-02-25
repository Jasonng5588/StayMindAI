import 'package:flutter/material.dart';
import '../../services/supabase_service.dart';

class MaintenanceScreen extends StatefulWidget {
  const MaintenanceScreen({super.key});
  @override State<MaintenanceScreen> createState() => _MaintenanceScreenState();
}

class _MaintenanceScreenState extends State<MaintenanceScreen> {
  List<Map<String, dynamic>> _tasks = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final hotel = await SupabaseService.getStaffHotel();
      if (hotel != null) _tasks = await SupabaseService.getMaintenanceTasks(hotel['id']);
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Color _priorityColor(String? p) => switch (p) { 'urgent' => Colors.red, 'high' => Colors.orange, 'medium' => Colors.amber, _ => Colors.green };

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Maintenance')),
      body: _loading ? const Center(child: CircularProgressIndicator()) : _tasks.isEmpty
        ? const Center(child: Text('No maintenance tasks'))
        : RefreshIndicator(onRefresh: _load, child: ListView.separated(padding: const EdgeInsets.all(16), itemCount: _tasks.length, separatorBuilder: (_, __) => const SizedBox(height: 8), itemBuilder: (_, i) {
          final t = _tasks[i];
          return Card(child: Padding(padding: const EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2), decoration: BoxDecoration(color: _priorityColor(t['priority']).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                child: Text(t['priority'] ?? 'normal', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: _priorityColor(t['priority'])))),
              const SizedBox(width: 8),
              Text('Room ${t['rooms']?['room_number'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.w600)),
              const Spacer(),
              Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2), decoration: BoxDecoration(color: cs.surfaceVariant, borderRadius: BorderRadius.circular(12)),
                child: Text(t['status'] ?? '', style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant))),
            ]),
            if (t['description'] != null) ...[const SizedBox(height: 8), Text(t['description'], style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13))],
          ])));
        })),
    );
  }
}

