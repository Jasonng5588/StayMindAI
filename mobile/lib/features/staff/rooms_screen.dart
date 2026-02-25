import 'package:flutter/material.dart';
import '../../services/supabase_service.dart';

class RoomsScreen extends StatefulWidget {
  const RoomsScreen({super.key});
  @override State<RoomsScreen> createState() => _RoomsScreenState();
}

class _RoomsScreenState extends State<RoomsScreen> {
  List<Map<String, dynamic>> _rooms = [];
  bool _loading = true;
  String? _hotelId;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final hotel = await SupabaseService.getStaffHotel();
      _hotelId = hotel?['id'];
      if (_hotelId != null) _rooms = await SupabaseService.getRoomStatuses(_hotelId!);
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Color _statusColor(String? s) => switch (s) { 'available' => Colors.green, 'occupied' => Colors.blue, 'maintenance' => Colors.red, 'cleaning' => Colors.amber, _ => Colors.grey };
  IconData _statusIcon(String? s) => switch (s) { 'available' => Icons.check_circle, 'occupied' => Icons.person, 'maintenance' => Icons.build, 'cleaning' => Icons.cleaning_services, _ => Icons.bed };

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Rooms')),
      body: _loading ? const Center(child: CircularProgressIndicator()) :
        RefreshIndicator(onRefresh: _load, child: GridView.builder(
          padding: const EdgeInsets.all(16), gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, mainAxisSpacing: 8, crossAxisSpacing: 8, childAspectRatio: 0.85),
          itemCount: _rooms.length, itemBuilder: (_, i) {
            final room = _rooms[i];
            final status = room['status'] ?? 'available';
            final color = _statusColor(status);
            return GestureDetector(
              onTap: () => showModalBottomSheet(context: context, builder: (_) => Padding(padding: const EdgeInsets.all(24), child: Column(mainAxisSize: MainAxisSize.min, children: [
                Text('Room ${room['room_number']}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                Text(room['room_types']?['name'] ?? '', style: TextStyle(color: cs.onSurfaceVariant)),
                const SizedBox(height: 16),
                Wrap(spacing: 8, children: ['available', 'occupied', 'maintenance', 'cleaning'].map((s) => ChoiceChip(label: Text(s), selected: status == s, onSelected: (_) async { await SupabaseService.updateRoomStatus(room['id'], s); Navigator.pop(context); _load(); })).toList()),
              ]))),
              child: Card(
                color: color.withOpacity(0.05),
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(_statusIcon(status), color: color, size: 28),
                  const SizedBox(height: 4),
                  Text('${room['room_number']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  Text(status, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w600)),
                ]),
              ),
            );
          },
        )),
    );
  }
}

