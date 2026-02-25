import 'package:flutter/material.dart';
import '../../services/supabase_service.dart';

class RoomDetailScreen extends StatefulWidget {
  final String roomId;
  const RoomDetailScreen({super.key, required this.roomId});
  @override State<RoomDetailScreen> createState() => _RoomDetailScreenState();
}

class _RoomDetailScreenState extends State<RoomDetailScreen> {
  Map<String, dynamic>? _roomType;
  bool _loading = true;
  DateTime? _checkIn;
  DateTime? _checkOut;

  @override
  void initState() { super.initState(); _load(); }
  Future<void> _load() async { _roomType = await SupabaseService.getRoomType(widget.roomId); if (mounted) setState(() => _loading = false); }

  Future<void> _pickDate(bool isCheckIn) async {
    final date = await showDatePicker(context: context, initialDate: DateTime.now().add(const Duration(days: 1)), firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 365)));
    if (date != null) setState(() { if (isCheckIn) _checkIn = date; else _checkOut = date; });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    final cs = Theme.of(context).colorScheme;
    final amenities = (_roomType?['amenities'] as List?)?.cast<String>() ?? ['WiFi', 'AC', 'TV', 'Mini Bar'];

    return Scaffold(
      appBar: AppBar(title: Text(_roomType?['name'] ?? 'Room')),
      body: SingleChildScrollView(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(height: 200, decoration: BoxDecoration(color: cs.primaryContainer, borderRadius: BorderRadius.circular(16)), child: Center(child: Icon(Icons.bed, size: 64, color: cs.primary))),
        const SizedBox(height: 16),
        Text(_roomType?['name'] ?? '', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Text(_roomType?['description'] ?? 'A comfortable and well-appointed room.', style: TextStyle(color: cs.onSurfaceVariant, height: 1.5)),
        const SizedBox(height: 16),
        Row(children: [
          _Detail(icon: Icons.people, label: 'Max ${_roomType?['max_occupancy'] ?? 2} guests'),
          const SizedBox(width: 16),
          _Detail(icon: Icons.attach_money, label: '\$${_roomType?['base_price'] ?? 0}/night'),
        ]),
        const SizedBox(height: 20),
        const Text('Amenities', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Wrap(spacing: 8, runSpacing: 8, children: amenities.map((a) => Chip(label: Text(a, style: const TextStyle(fontSize: 12)))).toList()),
        const SizedBox(height: 20),
        const Text('Select Dates', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(child: OutlinedButton.icon(onPressed: () => _pickDate(true), icon: const Icon(Icons.calendar_today, size: 16), label: Text(_checkIn != null ? '${_checkIn!.month}/${_checkIn!.day}/${_checkIn!.year}' : 'Check-in'))),
          const SizedBox(width: 12),
          Expanded(child: OutlinedButton.icon(onPressed: () => _pickDate(false), icon: const Icon(Icons.calendar_today, size: 16), label: Text(_checkOut != null ? '${_checkOut!.month}/${_checkOut!.day}/${_checkOut!.year}' : 'Check-out'))),
        ]),
      ])),
      bottomNavigationBar: SafeArea(child: Padding(
        padding: const EdgeInsets.all(16),
        child: FilledButton(onPressed: _checkIn != null && _checkOut != null ? () {} : null, child: Text(_checkIn != null && _checkOut != null ? 'Book for \$${((_roomType?['base_price'] ?? 0) * (_checkOut!.difference(_checkIn!).inDays)).toStringAsFixed(0)}' : 'Select dates to book')),
      )),
    );
  }
}

class _Detail extends StatelessWidget {
  final IconData icon; final String label;
  const _Detail({required this.icon, required this.label});
  @override Widget build(BuildContext context) => Row(children: [Icon(icon, size: 18, color: Theme.of(context).colorScheme.primary), const SizedBox(width: 4), Text(label, style: const TextStyle(fontWeight: FontWeight.w500))]);
}

