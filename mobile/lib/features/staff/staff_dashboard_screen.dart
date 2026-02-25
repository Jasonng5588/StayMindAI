import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/supabase_service.dart';

class StaffDashboardScreen extends StatefulWidget {
  const StaffDashboardScreen({super.key});
  @override State<StaffDashboardScreen> createState() => _StaffDashboardScreenState();
}

class _StaffDashboardScreenState extends State<StaffDashboardScreen> {
  Map<String, dynamic>? _hotel;
  List<Map<String, dynamic>> _arrivals = [];
  List<Map<String, dynamic>> _departures = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      _hotel = await SupabaseService.getStaffHotel();
      if (_hotel != null) {
        _arrivals = await SupabaseService.getTodayArrivals(_hotel!['id']);
        _departures = await SupabaseService.getTodayDepartures(_hotel!['id']);
      }
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_hotel == null) return Scaffold(appBar: AppBar(title: const Text('Staff')), body: const Center(child: Text('No hotel assigned')));

    return Scaffold(
      appBar: AppBar(title: Text(_hotel!['name'] ?? 'Dashboard'), actions: [
        IconButton(icon: const Icon(Icons.qr_code_scanner), onPressed: () => context.push('/staff/qr')),
        IconButton(icon: const Icon(Icons.chat_outlined), onPressed: () => context.push('/staff/chat')),
      ]),
      body: RefreshIndicator(onRefresh: _load, child: ListView(padding: const EdgeInsets.all(16), children: [
        // Quick stats
        Row(children: [
          Expanded(child: _StatCard(icon: Icons.login, label: 'Arrivals', value: '${_arrivals.length}', color: Colors.blue)),
          const SizedBox(width: 12),
          Expanded(child: _StatCard(icon: Icons.logout, label: 'Departures', value: '${_departures.length}', color: Colors.orange)),
        ]),
        const SizedBox(height: 16),
        // Quick actions
        Text('Quick Actions', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Row(children: [
          _ActionBtn(icon: Icons.add_circle_outline, label: 'New\nBooking', onTap: () => context.push('/staff/booking')),
          _ActionBtn(icon: Icons.qr_code_scanner, label: 'QR\nScanner', onTap: () => context.push('/staff/qr')),
          _ActionBtn(icon: Icons.cleaning_services, label: 'Assign\nTask', onTap: () => context.go('/staff/housekeeping')),
          _ActionBtn(icon: Icons.build, label: 'Report\nIssue', onTap: () => context.go('/staff/maintenance')),
        ]),
        const SizedBox(height: 20),
        // Today's arrivals
        if (_arrivals.isNotEmpty) ...[
          Text('Today\'s Arrivals', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ..._arrivals.map((a) => Card(margin: const EdgeInsets.only(bottom: 8), child: ListTile(
            leading: CircleAvatar(backgroundColor: cs.primaryContainer, child: Icon(Icons.person, color: cs.primary)),
            title: Text('Room ${a['rooms']?['room_number'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text(a['room_types']?['name'] ?? ''),
            trailing: FilledButton.tonal(onPressed: () async { await SupabaseService.checkInGuest(a['id']); _load(); }, child: const Text('Check In', style: TextStyle(fontSize: 12))),
          ))),
        ],
        if (_departures.isNotEmpty) ...[
          const SizedBox(height: 16),
          Text('Today\'s Departures', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ..._departures.map((d) => Card(margin: const EdgeInsets.only(bottom: 8), child: ListTile(
            leading: CircleAvatar(backgroundColor: Colors.orange.withOpacity(0.1), child: const Icon(Icons.exit_to_app, color: Colors.orange)),
            title: Text('Room ${d['rooms']?['room_number'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text(d['room_types']?['name'] ?? ''),
            trailing: FilledButton.tonal(onPressed: () async { await SupabaseService.checkOutGuest(d['id']); _load(); }, child: const Text('Check Out', style: TextStyle(fontSize: 12))),
          ))),
        ],
      ])),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon; final String label; final String value; final Color color;
  const _StatCard({required this.icon, required this.label, required this.value, required this.color});
  @override Widget build(BuildContext context) => Card(child: Padding(padding: const EdgeInsets.all(16), child: Row(children: [
    CircleAvatar(backgroundColor: color.withOpacity(0.1), child: Icon(icon, color: color, size: 20)),
    const SizedBox(width: 12),
    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)), Text(label, style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant))]),
  ])));
}

class _ActionBtn extends StatelessWidget {
  final IconData icon; final String label; final VoidCallback onTap;
  const _ActionBtn({required this.icon, required this.label, required this.onTap});
  @override Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Expanded(child: GestureDetector(onTap: onTap, child: Card(child: Padding(padding: const EdgeInsets.symmetric(vertical: 12), child: Column(children: [Icon(icon, color: cs.primary), const SizedBox(height: 4), Text(label, textAlign: TextAlign.center, style: const TextStyle(fontSize: 11))])))));
  }
}

