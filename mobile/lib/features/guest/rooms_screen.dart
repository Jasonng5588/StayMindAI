import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/supabase_service.dart';

class RoomsScreen extends StatefulWidget {
  const RoomsScreen({super.key});
  @override State<RoomsScreen> createState() => _RoomsScreenState();
}

class _RoomsScreenState extends State<RoomsScreen> {
  int _guests = 2;
  List<Map<String, dynamic>> _rooms = [];
  bool _loading = true;

  final _roomEmojis = <String, String>{
    'standard': '🏨', 'deluxe': '🌊', 'suite': '🌴', 'presidential': '👑',
  };

  @override
  void initState() {
    super.initState();
    _fetchRooms();
  }

  Future<void> _fetchRooms() async {
    try {
      // Search for available rooms at any active hotel
      final hotels = await SupabaseService.client.from('hotels').select('id').eq('is_active', true).limit(1);
      if (hotels.isNotEmpty) {
        final hotelId = hotels[0]['id'] as String;
        final rooms = await SupabaseService.client.from('rooms').select('*').eq('hotel_id', hotelId).eq('status', 'available').order('room_number');
        if (mounted) {
          setState(() {
            _rooms = List<Map<String, dynamic>>.from(rooms.map((r) {
              final roomType = (r['room_type'] as String?) ?? 'standard';
              return {
                'id': r['id'],
                'name': r['name'] ?? 'Room ${r['room_number']}',
                'desc': '${roomType[0].toUpperCase()}${roomType.substring(1)} room on floor ${r['floor'] ?? 1}',
                'price': (r['base_price'] as num?)?.toInt() ?? 179,
                'originalPrice': ((r['base_price'] as num?)?.toDouble() ?? 179.0 * 1.15).round(),
                'maxOcc': roomType.contains('suite') || roomType.contains('presidential') ? 4 : 2,
                'bed': roomType.contains('suite') || roomType.contains('presidential') ? 'King Bed' : roomType.contains('deluxe') ? 'King Bed' : 'Queen Bed',
                'size': roomType.contains('suite') ? '65m²' : roomType.contains('deluxe') ? '42m²' : '28m²',
                'available': 1,
                'emoji': _roomEmojis[roomType] ?? '🏨',
                'amenities': 'Free Wi-Fi, Smart TV, AC, Mini Bar, Room Service',
                'hotelId': r['hotel_id'],
              };
            }));
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching rooms: $e');
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final filteredRooms = _rooms.where((r) => (r['maxOcc'] as int) >= _guests).toList();

    return Scaffold(
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : CustomScrollView(slivers: [
        SliverAppBar.large(title: const Text('Book a Room')),

        // Guest selector
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Card(child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(children: [
                Icon(Icons.people, color: cs.primary),
                const SizedBox(width: 12),
                const Text('Guests:', style: TextStyle(fontWeight: FontWeight.w500)),
                const Spacer(),
                IconButton(onPressed: _guests > 1 ? () => setState(() => _guests--) : null, icon: const Icon(Icons.remove_circle_outline)),
                Text('$_guests', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                IconButton(onPressed: _guests < 6 ? () => setState(() => _guests++) : null, icon: const Icon(Icons.add_circle_outline)),
              ]),
            )),
          ),
        ),

        // Room cards
        if (filteredRooms.isEmpty)
          const SliverFillRemaining(child: Center(child: Text('No rooms available for this guest count.')))
        else
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            sliver: SliverList.separated(
              itemCount: filteredRooms.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (_, i) {
                final room = filteredRooms[i];
                final price = room['price'] as int;
                final originalPrice = room['originalPrice'] as int;
                final available = room['available'] as int;

                return Card(
                  clipBehavior: Clip.antiAlias,
                  child: InkWell(
                    onTap: () => context.push('/rooms/book', extra: room),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      // Room header with emoji
                      Container(
                        height: 100,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(colors: [cs.primaryContainer, cs.primaryContainer.withOpacity(0.5)]),
                        ),
                        child: Center(child: Text(room['emoji'] as String, style: const TextStyle(fontSize: 48))),
                      ),
                      Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(children: [
                          Expanded(child: Text(room['name'] as String, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold))),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(color: available > 0 ? Colors.green.shade50 : Colors.red.shade50, borderRadius: BorderRadius.circular(8)),
                            child: Text('$available left', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: available > 0 ? Colors.green.shade700 : Colors.red.shade700)),
                          ),
                        ]),
                        const SizedBox(height: 4),
                        Text(room['desc'] as String, style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13)),
                        const SizedBox(height: 8),
                        Row(children: [
                          Icon(Icons.bed, size: 14, color: cs.onSurfaceVariant),
                          const SizedBox(width: 4),
                          Text(room['bed'] as String, style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
                          const SizedBox(width: 12),
                          Icon(Icons.people, size: 14, color: cs.onSurfaceVariant),
                          const SizedBox(width: 4),
                          Text('Max ${room['maxOcc']}', style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
                          const SizedBox(width: 12),
                          Text(room['size'] as String, style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
                        ]),
                        const SizedBox(height: 12),
                        Row(children: [
                          if (originalPrice > price) Text('RM$originalPrice', style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant, decoration: TextDecoration.lineThrough)),
                          if (originalPrice > price) const SizedBox(width: 8),
                          Text('RM$price', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: cs.primary)),
                          const Text(' /night', style: TextStyle(fontSize: 12)),
                          const Spacer(),
                          FilledButton(onPressed: () => context.push('/rooms/book', extra: room), child: const Text('Book Now')),
                        ]),
                      ])),
                    ]),
                  ),
                );
              },
            ),
          ),
        const SliverPadding(padding: EdgeInsets.only(bottom: 24)),
      ]),
    );
  }
}

