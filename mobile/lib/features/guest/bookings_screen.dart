import 'package:flutter/material.dart';
import '../../services/supabase_service.dart';

class BookingsScreen extends StatefulWidget {
  const BookingsScreen({super.key});
  @override State<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends State<BookingsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabC;
  List<Map<String, dynamic>> _bookings = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _tabC = TabController(length: 3, vsync: this); _load(); }

  Future<void> _load() async {
    try { _bookings = await SupabaseService.getMyBookings(); } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  List<Map<String, dynamic>> _filtered(String type) {
    if (type == 'upcoming') return _bookings.where((b) => b['status'] == 'confirmed').toList();
    if (type == 'active') return _bookings.where((b) => b['status'] == 'checked_in').toList();
    return _bookings.where((b) => ['checked_out', 'cancelled'].contains(b['status'])).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Bookings'), bottom: TabBar(controller: _tabC, tabs: const [Tab(text: 'Upcoming'), Tab(text: 'Active'), Tab(text: 'Past')])),
      body: _loading ? const Center(child: CircularProgressIndicator()) : TabBarView(controller: _tabC, children: ['upcoming', 'active', 'past'].map((type) {
        final list = _filtered(type);
        return list.isEmpty ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.calendar_today, size: 48, color: Theme.of(context).colorScheme.onSurfaceVariant), const SizedBox(height: 8), const Text('No bookings')])) :
        RefreshIndicator(onRefresh: _load, child: ListView.separated(padding: const EdgeInsets.all(16), itemCount: list.length, separatorBuilder: (_, __) => const SizedBox(height: 12), itemBuilder: (_, i) {
          final b = list[i];
          final cs = Theme.of(context).colorScheme;
          return Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [Expanded(child: Text(b['hotels']?['name'] ?? 'Hotel', style: const TextStyle(fontWeight: FontWeight.bold))), Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2), decoration: BoxDecoration(color: b['status'] == 'confirmed' ? Colors.green.withOpacity(0.1) : Colors.grey.withOpacity(0.1), borderRadius: BorderRadius.circular(12)), child: Text(b['status'] ?? '', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: b['status'] == 'confirmed' ? Colors.green : Colors.grey)))]),
            const SizedBox(height: 8),
            Text('Room ${b['rooms']?['room_number'] ?? ''} • ${b['rooms']?['name'] ?? ''}', style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13)),
            const SizedBox(height: 8),
            Row(children: [Icon(Icons.calendar_today, size: 14, color: cs.onSurfaceVariant), const SizedBox(width: 4), Text('${b['check_in']} â†’ ${b['check_out']}', style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant))]),
            const SizedBox(height: 4),
            Row(children: [const Spacer(), Text('\$${b['total_amount'] ?? 0}', style: TextStyle(fontWeight: FontWeight.bold, color: cs.primary))]),
            if (b['booking_number'] != null) ...[const SizedBox(height: 8), Text('Code: ${b['booking_number']}', style: TextStyle(fontSize: 11, fontFamily: 'monospace', color: cs.onSurfaceVariant))],
          ])));
        }));
      }).toList()),
    );
  }
}

