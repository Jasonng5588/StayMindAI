import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
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
    try { _bookings = await SupabaseService.getMyBookings(); }
    catch (e) { _error = e.toString(); }
    if (mounted) setState(() => _loading = false);
  }

  List<Map<String, dynamic>> _filtered(String type) {
    if (type == 'upcoming') return _bookings.where((b) => ['confirmed', 'pending'].contains(b['status'])).toList();
    if (type == 'active') return _bookings.where((b) => b['status'] == 'checked_in').toList();
    return _bookings.where((b) => ['checked_out', 'cancelled', 'completed'].contains(b['status'])).toList();
  }

  Color _statusColor(String status) => switch (status) {
    'confirmed' => const Color(0xFF22C55E),
    'pending' => const Color(0xFFF59E0B),
    'checked_in' => const Color(0xFF3B82F6),
    'checked_out' || 'completed' => const Color(0xFF8B5CF6),
    'cancelled' => const Color(0xFFEF4444),
    _ => Colors.grey,
  };

  IconData _statusIcon(String status) => switch (status) {
    'confirmed' => Icons.check_circle_outline,
    'pending' => Icons.schedule,
    'checked_in' => Icons.login,
    'checked_out' || 'completed' => Icons.logout,
    'cancelled' => Icons.cancel_outlined,
    _ => Icons.help_outline,
  };

  String _getHotelName(Map<String, dynamic> b) {
    if (b['hotels'] is Map) return b['hotels']['name'] ?? 'Hotel';
    return 'Hotel Booking';
  }

  String _getRoomInfo(Map<String, dynamic> b) {
    if (b['rooms'] is Map) return 'Room ${(b['rooms'] as Map)['room_number'] ?? ''}';
    return 'Room';
  }

  void _openDetail(Map<String, dynamic> booking) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _BookingDetailSheet(
        booking: booking,
        statusColor: _statusColor(booking['status'] ?? ''),
        statusIcon: _statusIcon(booking['status'] ?? ''),
        onCancelled: _load,
      ),
    );
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
          ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.error_outline, size: 48, color: cs.error),
              const SizedBox(height: 12),
              Text('Failed to load bookings', style: TextStyle(fontSize: 16, color: cs.error)),
              const SizedBox(height: 12),
              FilledButton.icon(icon: const Icon(Icons.refresh), label: const Text('Retry'), onPressed: _load),
            ]))
          : TabBarView(
              controller: _tabC,
              children: ['upcoming', 'active', 'past'].map((type) {
                final list = _filtered(type);
                return list.isEmpty
                  ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(color: cs.primaryContainer.withOpacity(0.3), shape: BoxShape.circle),
                        child: Icon(Icons.calendar_today, size: 40, color: cs.primary),
                      ),
                      const SizedBox(height: 16),
                      Text('No $type bookings', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
                      const SizedBox(height: 4),
                      Text('Your $type bookings will appear here', style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant)),
                    ]))
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: list.length,
                        itemBuilder: (_, i) {
                          final b = list[i];
                          final status = b['status'] ?? 'pending';
                          final statusCol = _statusColor(status);
                          return GestureDetector(
                            onTap: () => _openDetail(b),
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: cs.outlineVariant.withOpacity(0.5)),
                                color: cs.surface,
                              ),
                              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                // Header
                                Container(
                                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
                                  decoration: BoxDecoration(
                                    color: statusCol.withOpacity(0.06),
                                    borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                                  ),
                                  child: Row(children: [
                                    Icon(Icons.hotel, size: 20, color: statusCol),
                                    const SizedBox(width: 8),
                                    Expanded(child: Text(_getHotelName(b), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15), maxLines: 1, overflow: TextOverflow.ellipsis)),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(color: statusCol.withOpacity(0.15), borderRadius: BorderRadius.circular(20)),
                                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                                        Icon(_statusIcon(status), size: 14, color: statusCol),
                                        const SizedBox(width: 4),
                                        Text(status.replaceAll('_', ' ').toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: statusCol, letterSpacing: 0.5)),
                                      ]),
                                    ),
                                  ]),
                                ),
                                // Body
                                Padding(
                                  padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
                                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                    Row(children: [
                                      Icon(Icons.bed_outlined, size: 16, color: cs.onSurfaceVariant),
                                      const SizedBox(width: 6),
                                      Text(_getRoomInfo(b), style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13)),
                                    ]),
                                    const SizedBox(height: 10),
                                    Row(children: [
                                      Icon(Icons.calendar_today, size: 14, color: cs.onSurfaceVariant),
                                      const SizedBox(width: 6),
                                      Text('${b['check_in'] ?? '?'} → ${b['check_out'] ?? '?'}', style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant)),
                                    ]),
                                    const SizedBox(height: 10),
                                    Row(children: [
                                      if (b['booking_number'] != null) Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(color: cs.surfaceVariant.withOpacity(0.5), borderRadius: BorderRadius.circular(6)),
                                        child: Text('#${b['booking_number']}', style: TextStyle(fontSize: 11, fontFamily: 'monospace', color: cs.onSurfaceVariant, fontWeight: FontWeight.w600)),
                                      ),
                                      const Spacer(),
                                      Text('RM ${(b['total_amount'] ?? 0).toStringAsFixed(0)}', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: cs.primary)),
                                    ]),
                                    const SizedBox(height: 8),
                                    // Tap hint
                                    Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                                      Icon(Icons.qr_code, size: 14, color: cs.onSurfaceVariant.withOpacity(0.6)),
                                      const SizedBox(width: 4),
                                      Text('Tap to view details & QR', style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant.withOpacity(0.6))),
                                    ]),
                                  ]),
                                ),
                              ]),
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

class _BookingDetailSheet extends StatefulWidget {
  final Map<String, dynamic> booking;
  final Color statusColor;
  final IconData statusIcon;
  final VoidCallback onCancelled;

  const _BookingDetailSheet({required this.booking, required this.statusColor, required this.statusIcon, required this.onCancelled});

  @override
  State<_BookingDetailSheet> createState() => _BookingDetailSheetState();
}

class _BookingDetailSheetState extends State<_BookingDetailSheet> {
  bool _cancelling = false;

  String get _bookingNumber => widget.booking['booking_number']?.toString() ?? widget.booking['id']?.toString().substring(0, 8).toUpperCase() ?? 'N/A';
  String get _hotelName {
    if (widget.booking['hotels'] is Map) return (widget.booking['hotels'] as Map)['name']?.toString() ?? 'Hotel';
    return 'Hotel Booking';
  }
  String get _roomInfo {
    if (widget.booking['rooms'] is Map) return 'Room ${(widget.booking['rooms'] as Map)['room_number'] ?? ''}';
    return 'Room';
  }

  Future<void> _cancelBooking() async {
    final confirmed = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(
      title: const Text('Cancel Booking'),
      content: const Text('Are you sure you want to cancel this booking? Refunds will be processed according to the hotel policy.'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('No, Keep It')),
        FilledButton(onPressed: () => Navigator.pop(ctx, true), style: FilledButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.error), child: const Text('Yes, Cancel')),
      ],
    ));

    if (confirmed == true) {
      if (!mounted) return;
      setState(() => _cancelling = true);
      try {
        await SupabaseService.cancelBooking(widget.booking['id'] as String);
        if (mounted) {
          Navigator.pop(context); // close sheet
          widget.onCancelled(); // refresh list
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: const Text('Booking cancelled successfully'),
            backgroundColor: Theme.of(context).colorScheme.error,
            behavior: SnackBarBehavior.floating,
          ));
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to cancel: $e'), backgroundColor: Theme.of(context).colorScheme.error, behavior: SnackBarBehavior.floating));
        }
      }
      if (mounted) setState(() => _cancelling = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final status = widget.booking['status'] ?? 'pending';
    final qrData = 'STAYMIND:${_bookingNumber}:${widget.booking['id'] ?? ''}';

    return DraggableScrollableSheet(
      initialChildSize: 0.82,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (_, scrollController) => Container(
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(children: [
          // Drag handle
          Container(margin: const EdgeInsets.only(top: 12), width: 40, height: 4, decoration: BoxDecoration(color: cs.outlineVariant, borderRadius: BorderRadius.circular(2))),
          Expanded(
            child: SingleChildScrollView(
              controller: scrollController,
              padding: const EdgeInsets.all(24),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                // ── Header ─────────────────────────────────────────────
                Row(children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: widget.statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                    child: Icon(Icons.hotel, color: widget.statusColor, size: 24),
                  ),
                  const SizedBox(width: 14),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(_hotelName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    const SizedBox(height: 2),
                    Row(children: [
                      Icon(widget.statusIcon, size: 14, color: widget.statusColor),
                      const SizedBox(width: 4),
                      Text(status.replaceAll('_', ' ').toUpperCase(), style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: widget.statusColor)),
                    ]),
                  ])),
                  IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close)),
                ]),

                const SizedBox(height: 24),
                const Divider(),
                const SizedBox(height: 16),

                // ── QR Code ────────────────────────────────────────────
                Center(child: Column(children: [
                  Text('Booking QR Code', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: cs.onSurfaceVariant)),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 16, offset: const Offset(0, 4))],
                    ),
                    child: QrImageView(data: qrData, version: QrVersions.auto, size: 180),
                  ),
                  const SizedBox(height: 10),
                  GestureDetector(
                    onTap: () {
                      Clipboard.setData(ClipboardData(text: _bookingNumber));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Booking number copied!'), behavior: SnackBarBehavior.floating, duration: Duration(seconds: 2)),
                      );
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(color: cs.surfaceVariant.withOpacity(0.5), borderRadius: BorderRadius.circular(8)),
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        Text('#$_bookingNumber', style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold, fontSize: 16, letterSpacing: 1.5)),
                        const SizedBox(width: 8),
                        Icon(Icons.copy, size: 14, color: cs.onSurfaceVariant),
                      ]),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text('Show this QR code at check-in', style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
                ])),

                const SizedBox(height: 24),
                const Divider(),
                const SizedBox(height: 16),

                // ── Booking Details ────────────────────────────────────
                Text('Booking Details', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: cs.onSurface)),
                const SizedBox(height: 12),

                _DetailRow(icon: Icons.bed_outlined, label: 'Room', value: _roomInfo),
                _DetailRow(icon: Icons.people_outline, label: 'Guests', value: '${widget.booking['guests'] ?? 1} Guest${(widget.booking['guests'] ?? 1) > 1 ? 's' : ''}'),
                _DetailRow(icon: Icons.login, label: 'Check In', value: widget.booking['check_in']?.toString() ?? '—'),
                _DetailRow(icon: Icons.logout, label: 'Check Out', value: widget.booking['check_out']?.toString() ?? '—'),

                if (widget.booking['special_requests'] != null && widget.booking['special_requests'].toString().isNotEmpty)
                  _DetailRow(icon: Icons.notes, label: 'Special Requests', value: widget.booking['special_requests'].toString()),

                const SizedBox(height: 16),
                const Divider(),
                const SizedBox(height: 16),

                // ── Payment ────────────────────────────────────────────
                Text('Payment Summary', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: cs.onSurface)),
                const SizedBox(height: 12),

                if (widget.booking['voucher_code'] != null) ...[
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Text('Subtotal', style: TextStyle(color: cs.onSurfaceVariant, fontSize: 14)),
                    Text('RM ${((widget.booking['total_amount'] ?? 0) + (widget.booking['discount_amount'] ?? 0)).toStringAsFixed(0)}', style: TextStyle(color: cs.onSurfaceVariant, fontSize: 14)),
                  ]),
                  const SizedBox(height: 6),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Row(children: [
                      const Icon(Icons.local_offer, size: 14, color: Colors.green),
                      const SizedBox(width: 4),
                      Text('Voucher (${widget.booking['voucher_code']})', style: const TextStyle(color: Colors.green, fontSize: 13)),
                    ]),
                    Text('-RM ${(widget.booking['discount_amount'] ?? 0).toStringAsFixed(0)}', style: const TextStyle(color: Colors.green, fontSize: 13, fontWeight: FontWeight.bold)),
                  ]),
                  const Divider(height: 16),
                ],

                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  const Text('Total Paid', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  Text('RM ${(widget.booking['total_amount'] ?? 0).toStringAsFixed(0)}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: cs.primary)),
                ]),

                const SizedBox(height: 24),

                if (status == 'confirmed' || status == 'pending') ...[
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: _cancelling ? null : _cancelBooking,
                      icon: _cancelling ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : Icon(Icons.cancel_outlined, color: cs.error),
                      label: Text('Cancel My Booking', style: TextStyle(color: cs.error)),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: cs.error.withOpacity(0.5)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],

                // ── Footer ────────────────────────────────────────────
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: cs.primaryContainer.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: cs.primary.withOpacity(0.15)),
                  ),
                  child: Row(children: [
                    Icon(Icons.info_outline, size: 16, color: cs.primary),
                    const SizedBox(width: 8),
                    Expanded(child: Text('Present this QR code to hotel staff at check-in for a seamless experience.', style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant))),
                  ]),
                ),

                const SizedBox(height: 24),
              ]),
            ),
          ),
        ]),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _DetailRow({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(icon, size: 16, color: cs.onSurfaceVariant),
        const SizedBox(width: 10),
        SizedBox(width: 100, child: Text(label, style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13))),
        Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13))),
      ]),
    );
  }
}
