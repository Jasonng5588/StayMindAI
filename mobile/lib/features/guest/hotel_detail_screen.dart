import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/supabase_service.dart';

class HotelDetailScreen extends StatefulWidget {
  final String hotelId;
  const HotelDetailScreen({super.key, required this.hotelId});
  @override State<HotelDetailScreen> createState() => _HotelDetailScreenState();
}

class _HotelDetailScreenState extends State<HotelDetailScreen> {
  Map<String, dynamic>? _hotel;
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    _hotel = await SupabaseService.getHotel(widget.hotelId);
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_hotel == null) return Scaffold(appBar: AppBar(), body: const Center(child: Text('Hotel not found')));

    final cs = Theme.of(context).colorScheme;
    final roomTypes = (_hotel!['room_types'] as List?) ?? [];
    final reviews = (_hotel!['reviews'] as List?) ?? [];
    final services = (_hotel!['services_addons'] as List?) ?? [];
    final avgRating = reviews.isNotEmpty ? reviews.map((r) => (r['rating'] as num).toDouble()).reduce((a, b) => a + b) / reviews.length : 0.0;

    return Scaffold(
      body: CustomScrollView(slivers: [
        SliverAppBar.large(title: Text(_hotel!['name'] ?? '')),
        SliverToBoxAdapter(child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Gallery placeholder
          Container(height: 200, decoration: BoxDecoration(color: cs.primaryContainer, borderRadius: BorderRadius.circular(16)), child: Center(child: Icon(Icons.photo_library, size: 48, color: cs.primary))),
          const SizedBox(height: 16),
          // Info
          Row(children: [Icon(Icons.star, color: Colors.amber.shade600, size: 20), const SizedBox(width: 4), Text('${avgRating.toStringAsFixed(1)} (${reviews.length} reviews)', style: const TextStyle(fontWeight: FontWeight.w600))]),
          const SizedBox(height: 8),
          Row(children: [Icon(Icons.location_on, size: 16, color: cs.onSurfaceVariant), const SizedBox(width: 4), Expanded(child: Text('${_hotel!['address'] ?? ''}, ${_hotel!['city'] ?? ''}', style: TextStyle(color: cs.onSurfaceVariant)))]),
          const SizedBox(height: 12),
          Text(_hotel!['description'] ?? '', style: TextStyle(color: cs.onSurfaceVariant, height: 1.5)),
          const SizedBox(height: 8),
          Row(children: [
            _InfoChip(icon: Icons.access_time, label: 'Check-in: ${_hotel!['check_in_time'] ?? '15:00'}'),
            const SizedBox(width: 8),
            _InfoChip(icon: Icons.access_time, label: 'Check-out: ${_hotel!['check_out_time'] ?? '11:00'}'),
          ]),
          const SizedBox(height: 24),
          // Room Types
          Text('Room Types', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          ...roomTypes.map((rt) => Card(margin: const EdgeInsets.only(bottom: 12), child: ListTile(
            title: Text(rt['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text('Max ${rt['max_occupancy']} guests', style: TextStyle(color: cs.onSurfaceVariant)),
            trailing: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Text('\$${rt['base_price']}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: cs.primary)),
              const Text('/night', style: TextStyle(fontSize: 11)),
            ]),
            onTap: () => context.push('/hotel/${widget.hotelId}/room/${rt['id']}'),
          ))),
          if (services.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text('Services & Amenities', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 8, children: services.map((s) => Chip(avatar: const Icon(Icons.check_circle, size: 16), label: Text(s['name'] ?? '', style: const TextStyle(fontSize: 12)))).toList()),
          ],
        ]))),
      ]),
      bottomNavigationBar: SafeArea(child: Padding(
        padding: const EdgeInsets.all(16),
        child: FilledButton(onPressed: () => context.push('/bookings/new'), child: const Text('Book Now')),
      )),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _InfoChip({required this.icon, required this.label});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
    decoration: BoxDecoration(color: Theme.of(context).colorScheme.surfaceVariant, borderRadius: BorderRadius.circular(8)),
    child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(icon, size: 14), const SizedBox(width: 4), Text(label, style: const TextStyle(fontSize: 12))]),
  );
}

