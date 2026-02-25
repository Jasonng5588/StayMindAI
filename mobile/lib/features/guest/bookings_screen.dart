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
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabC = TabController(length: 3, vsync: this);
    _load();
  }

  @override
  void dispose() { _tabC.dispose(); super.dispose(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      _bookings = await SupabaseService.getMyBookings();
    } catch (e) {
      _error = e.toString();
    }
    if (mounted) setState(() => _loading = false);
  }

  List<Map<String, dynamic>> _filtered(String type) {
    if (type == 'upcoming') return _bookings.where((b) => ['confirmed', 'pending'].contains(b['status'])).toList();
    if (type == 'active') return _bookings.where((b) => b['status'] == 'checked_in').toList();
    return _bookings.where((b) => ['checked_out', 'cancelled', 'completed'].contains(b['status'])).toList();
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'confirmed': return const Color(0xFF22C55E);
      case 'pending': return const Color(0xFFF59E0B);
      case 'checked_in': return const Color(0xFF3B82F6);
      case 'checked_out': case 'completed': return const Color(0xFF8B5CF6);
      case 'cancelled': return const Color(0xFFEF4444);
      default: return Colors.grey;
    }
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case 'confirmed': return Icons.check_circle_outline;
      case 'pending': return Icons.schedule;
      case 'checked_in': return Icons.login;
      case 'checked_out': case 'completed': return Icons.logout;
      case 'cancelled': return Icons.cancel_outlined;
      default: return Icons.help_outline;
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Bookings', style: TextStyle(fontWeight: FontWeight.bold)),
        bottom: TabBar(
          controller: _tabC,
          indicatorColor: cs.primary,
          labelColor: cs.primary,
          unselectedLabelColor: cs.onSurfaceVariant,
          tabs: const [
            Tab(icon: Icon(Icons.upcoming, size: 20), text: 'Upcoming'),
            Tab(icon: Icon(Icons.hotel, size: 20), text: 'Active'),
            Tab(icon: Icon(Icons.history, size: 20), text: 'Past'),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    Icon(Icons.error_outline, size: 48, color: cs.error),
                    const SizedBox(height: 12),
                    Text('Failed to load bookings', style: TextStyle(fontSize: 16, color: cs.error)),
                    const SizedBox(height: 8),
                    TextButton.icon(icon: const Icon(Icons.refresh), label: const Text('Retry'), onPressed: _load),
                  ]),
                )
              : TabBarView(
                  controller: _tabC,
                  children: ['upcoming', 'active', 'past'].map((type) {
                    final list = _filtered(type);
                    return list.isEmpty
                        ? Center(
                            child: Column(mainAxisSize: MainAxisSize.min, children: [
                              Container(
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(
                                  color: cs.primaryContainer.withOpacity(0.3),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(Icons.calendar_today, size: 40, color: cs.primary),
                              ),
                              const SizedBox(height: 16),
                              Text('No $type bookings', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
                              const SizedBox(height: 4),
                              Text('Your $type bookings will appear here', style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant)),
                            ]),
                          )
                        : RefreshIndicator(
                            onRefresh: _load,
                            child: ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: list.length,
                              itemBuilder: (_, i) {
                                final b = list[i];
                                final status = b['status'] ?? 'pending';
                                final statusCol = _statusColor(status);

                                return Container(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: cs.outlineVariant.withOpacity(0.5)),
                                    color: cs.surface,
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      // Header with hotel name and status
                                      Container(
                                        padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
                                        decoration: BoxDecoration(
                                          color: statusCol.withOpacity(0.06),
                                          borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                                        ),
                                        child: Row(
                                          children: [
                                            Icon(Icons.hotel, size: 20, color: statusCol),
                                            const SizedBox(width: 8),
                                            Expanded(
                                              child: Text(
                                                b['hotels']?['name'] ?? 'Hotel',
                                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                                maxLines: 1, overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                              decoration: BoxDecoration(
                                                color: statusCol.withOpacity(0.15),
                                                borderRadius: BorderRadius.circular(20),
                                              ),
                                              child: Row(mainAxisSize: MainAxisSize.min, children: [
                                                Icon(_statusIcon(status), size: 14, color: statusCol),
                                                const SizedBox(width: 4),
                                                Text(
                                                  status.replaceAll('_', ' ').toUpperCase(),
                                                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: statusCol, letterSpacing: 0.5),
                                                ),
                                              ]),
                                            ),
                                          ],
                                        ),
                                      ),
                                      // Body
                                      Padding(
                                        padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            // Room info
                                            Row(children: [
                                              Icon(Icons.bed_outlined, size: 16, color: cs.onSurfaceVariant),
                                              const SizedBox(width: 6),
                                              Expanded(
                                                child: Text(
                                                  'Room ${b['rooms']?['room_number'] ?? ''} \u2022 ${b['rooms']?['name'] ?? 'Standard'}',
                                                  style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13),
                                                ),
                                              ),
                                            ]),
                                            const SizedBox(height: 10),
                                            // Dates
                                            Row(children: [
                                              _DateChip(label: 'Check-in', date: b['check_in'] ?? '', cs: cs),
                                              Padding(
                                                padding: const EdgeInsets.symmetric(horizontal: 8),
                                                child: Icon(Icons.arrow_forward, size: 16, color: cs.onSurfaceVariant),
                                              ),
                                              _DateChip(label: 'Check-out', date: b['check_out'] ?? '', cs: cs),
                                            ]),
                                            const SizedBox(height: 12),
                                            // Price and booking code
                                            Row(children: [
                                              if (b['booking_number'] != null) ...[
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                                  decoration: BoxDecoration(
                                                    color: cs.surfaceVariant.withOpacity(0.5),
                                                    borderRadius: BorderRadius.circular(6),
                                                  ),
                                                  child: Text(
                                                    '#${b['booking_number']}',
                                                    style: TextStyle(fontSize: 11, fontFamily: 'monospace', color: cs.onSurfaceVariant, fontWeight: FontWeight.w600),
                                                  ),
                                                ),
                                              ],
                                              const Spacer(),
                                              Text(
                                                'RM ${(b['total_amount'] ?? 0).toStringAsFixed(0)}',
                                                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: cs.primary),
                                              ),
                                            ]),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                          );
                  }).toList(),
                ),
    );
  }
}

class _DateChip extends StatelessWidget {
  final String label, date;
  final ColorScheme cs;
  const _DateChip({required this.label, required this.date, required this.cs});

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: TextStyle(fontSize: 10, color: cs.onSurfaceVariant, fontWeight: FontWeight.w600)),
      const SizedBox(height: 2),
      Text(date, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
    ]);
  }
}
