import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/supabase_service.dart';

class BookingFlowScreen extends StatefulWidget {
  final Map<String, dynamic>? roomData;
  const BookingFlowScreen({super.key, this.roomData});
  @override State<BookingFlowScreen> createState() => _BookingFlowScreenState();
}

class _BookingFlowScreenState extends State<BookingFlowScreen> {
  int _step = 0;
  DateTime _checkIn = DateTime.now().add(const Duration(days: 1));
  DateTime _checkOut = DateTime.now().add(const Duration(days: 3));
  int _guests = 2;
  final _nameC = TextEditingController();
  final _emailC = TextEditingController();
  final _specialC = TextEditingController();
  final _cardNumC = TextEditingController();
  final _cardNameC = TextEditingController();
  final _expiryC = TextEditingController();
  final _cvvC = TextEditingController();
  String _paymentMethod = 'card';
  bool _processing = false;
  String? _error;
  Map<String, dynamic>? _bookingResult;

  String get _roomName => (widget.roomData?['name'] as String?) ?? 'Standard Room';
  int get _roomPrice => (widget.roomData?['price'] as int?) ?? 179;
  int get _nights => _checkOut.difference(_checkIn).inDays;
  int get _total => _roomPrice * _nights;
  String _fmtDate(DateTime d) => '${d.day}/${d.month}/${d.year}';

  @override
  void initState() {
    super.initState();
    final user = SupabaseService.currentUser;
    if (user != null) {
      _nameC.text = user.userMetadata?['full_name'] ?? '';
      _emailC.text = user.email ?? '';
    }
  }

  @override
  void dispose() {
    _nameC.dispose(); _emailC.dispose(); _specialC.dispose();
    _cardNumC.dispose(); _cardNameC.dispose(); _expiryC.dispose(); _cvvC.dispose();
    super.dispose();
  }

  Future<void> _processPayment() async {
    if (_paymentMethod == 'card') {
      final digits = _cardNumC.text.replaceAll(' ', '');
      if (digits.length < 13) { setState(() => _error = 'Enter a valid card number'); return; }
      if (_cardNameC.text.trim().isEmpty) { setState(() => _error = 'Enter cardholder name'); return; }
      if (_expiryC.text.length < 5) { setState(() => _error = 'Enter valid expiry (MM/YY)'); return; }
      if (_cvvC.text.length < 3) { setState(() => _error = 'Enter valid CVV'); return; }
    }

    setState(() { _processing = true; _error = null; });

    try {
      // Simulate payment processing
      await Future.delayed(const Duration(seconds: 2));

      // Actually create the booking in Supabase
      final result = await SupabaseService.createBooking(
        hotelId: widget.roomData?['hotelId'] ?? '11111111-1111-1111-1111-111111111111',
        roomId: widget.roomData?['id'] ?? '11111111-1111-1111-1111-111111111111',
        checkIn: _checkIn.toIso8601String().split('T')[0],
        checkOut: _checkOut.toIso8601String().split('T')[0],
        guests: _guests,
        totalAmount: _total.toDouble(),
        specialRequests: _specialC.text.trim().isNotEmpty ? _specialC.text.trim() : null,
      );

      setState(() { _processing = false; _bookingResult = result; _step = 3; });
    } catch (e) {
      String msg = e.toString();
      // Extract readable message from PostgrestException
      if (msg.contains('message')) {
        final match = RegExp(r'message: ([^\n,}]+)').firstMatch(msg);
        if (match != null) msg = match.group(1)?.trim() ?? msg;
      } else if (msg.contains('Exception: ')) {
        msg = msg.replaceFirst('Exception: ', '');
      }
      setState(() { _processing = false; _error = 'Booking failed: $msg'; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    // Success screen
    if (_step == 3) {
      final bookingNum = _bookingResult?['booking_number'] ?? 'BK-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
      return Scaffold(
        body: SafeArea(
          child: Center(child: SingleChildScrollView(
            padding: const EdgeInsets.all(32),
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: [Colors.green.shade400, Colors.green.shade600]),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check, size: 48, color: Colors.white),
              ),
              const SizedBox(height: 24),
              const Text('Booking Confirmed!', style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                decoration: BoxDecoration(
                  color: cs.primaryContainer,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(bookingNum, style: TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.w700, color: cs.primary, fontSize: 16)),
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  color: cs.surfaceVariant.withOpacity(0.3),
                  border: Border.all(color: cs.outlineVariant.withOpacity(0.5)),
                ),
                child: Column(children: [
                  _InfoRow(Icons.hotel, 'Room', _roomName),
                  const SizedBox(height: 12),
                  _InfoRow(Icons.calendar_today, 'Check-in', _fmtDate(_checkIn)),
                  const SizedBox(height: 12),
                  _InfoRow(Icons.calendar_today, 'Check-out', _fmtDate(_checkOut)),
                  const SizedBox(height: 12),
                  _InfoRow(Icons.people, 'Guests', '$_guests'),
                  const Divider(height: 24),
                  _InfoRow(Icons.payment, 'Payment', _paymentMethod == 'card' ? 'Card \u2022\u2022\u2022\u2022 ${_cardNumC.text.replaceAll(' ', '').length >= 4 ? _cardNumC.text.replaceAll(' ', '').substring(_cardNumC.text.replaceAll(' ', '').length - 4) : '0000'}' : _paymentMethod.toUpperCase()),
                  const SizedBox(height: 12),
                  Row(children: [
                    Icon(Icons.attach_money, size: 20, color: cs.primary),
                    const SizedBox(width: 8),
                    const Text('Total', style: TextStyle(fontWeight: FontWeight.w500)),
                    const Spacer(),
                    Text('RM $_total', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: cs.primary)),
                  ]),
                ]),
              ),
              const SizedBox(height: 28),
              SizedBox(width: double.infinity, child: FilledButton.icon(
                onPressed: () => context.go('/bookings'),
                icon: const Icon(Icons.calendar_today),
                label: const Text('View My Bookings'),
              )),
              const SizedBox(height: 10),
              SizedBox(width: double.infinity, child: OutlinedButton.icon(
                onPressed: () => context.go('/'),
                icon: const Icon(Icons.home),
                label: const Text('Back to Home'),
              )),
            ]),
          )),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text('Book $_roomName')),
      body: Column(children: [
        // Stepper
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 12, 24, 8),
          child: Row(
            children: List.generate(3, (i) => Expanded(child: Row(children: [
              Container(
                width: 32, height: 32,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: i <= _step ? LinearGradient(colors: [cs.primary, cs.primary.withOpacity(0.7)]) : null,
                  color: i > _step ? cs.surfaceVariant : null,
                ),
                child: Center(child: i < _step
                  ? Icon(Icons.check, size: 16, color: cs.onPrimary)
                  : Text('${i + 1}', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: i <= _step ? cs.onPrimary : cs.onSurfaceVariant)),
                ),
              ),
              if (i < 2) Expanded(child: Container(height: 2, margin: const EdgeInsets.symmetric(horizontal: 4), color: i < _step ? cs.primary : cs.surfaceVariant)),
            ]))),
          ),
        ),
        // Step labels
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: ['Dates', 'Info', 'Payment'].map((s) => Text(s, style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant))).toList(),
          ),
        ),

        // Room summary card
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [cs.primaryContainer.withOpacity(0.4), cs.primaryContainer.withOpacity(0.15)]),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: cs.primary.withOpacity(0.2)),
            ),
            child: Row(children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: cs.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(Icons.hotel, color: cs.primary),
              ),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(_roomName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                Text('$_nights night${_nights > 1 ? 's' : ''} \u2022 $_guests guest${_guests > 1 ? 's' : ''}', style: TextStyle(color: cs.onSurfaceVariant, fontSize: 12)),
              ])),
              Text('RM $_total', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: cs.primary)),
            ]),
          ),
        ),

        Expanded(child: SingleChildScrollView(padding: const EdgeInsets.all(16), child: [
          // Step 0: Dates
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Select Your Dates', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: cs.onSurface)),
            const SizedBox(height: 16),
            _DateTile(icon: Icons.login, label: 'Check-in', value: _fmtDate(_checkIn), onTap: () async {
              final d = await showDatePicker(context: context, initialDate: _checkIn, firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 365)));
              if (d != null) setState(() { _checkIn = d; if (_checkOut.isBefore(d.add(const Duration(days: 1)))) _checkOut = d.add(const Duration(days: 1)); });
            }),
            const SizedBox(height: 12),
            _DateTile(icon: Icons.logout, label: 'Check-out', value: _fmtDate(_checkOut), onTap: () async {
              final d = await showDatePicker(context: context, initialDate: _checkOut, firstDate: _checkIn.add(const Duration(days: 1)), lastDate: DateTime.now().add(const Duration(days: 365)));
              if (d != null) setState(() => _checkOut = d);
            }),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                color: cs.surfaceVariant.withOpacity(0.3),
              ),
              child: Row(children: [
                Icon(Icons.people, color: cs.primary),
                const SizedBox(width: 12),
                const Text('Guests', style: TextStyle(fontWeight: FontWeight.w600)),
                const Spacer(),
                _CounterBtn(icon: Icons.remove, onTap: _guests > 1 ? () => setState(() => _guests--) : null),
                Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: Text('$_guests', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold))),
                _CounterBtn(icon: Icons.add, onTap: _guests < 6 ? () => setState(() => _guests++) : null),
              ]),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [cs.primary.withOpacity(0.05), cs.primary.withOpacity(0.02)]),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: cs.primary.withOpacity(0.2)),
              ),
              child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('$_nights night${_nights > 1 ? 's' : ''} \u00D7 RM $_roomPrice', style: TextStyle(color: cs.onSurfaceVariant)),
                Text('RM $_total', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 22, color: cs.primary)),
              ]),
            ),
          ]),
          // Step 1: Guest Info
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Guest Information', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: cs.onSurface)),
            const SizedBox(height: 16),
            TextField(controller: _nameC, decoration: const InputDecoration(labelText: 'Full Name', prefixIcon: Icon(Icons.person_outlined))),
            const SizedBox(height: 14),
            TextField(controller: _emailC, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined))),
            const SizedBox(height: 14),
            TextField(controller: _specialC, maxLines: 3, decoration: const InputDecoration(labelText: 'Special Requests (optional)', alignLabelWithHint: true, prefixIcon: Padding(padding: EdgeInsets.only(bottom: 40), child: Icon(Icons.note_outlined)))),
          ]),
          // Step 2: Payment
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Payment', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: cs.onSurface)),
            const SizedBox(height: 16),
            Text('Payment Method', style: TextStyle(fontWeight: FontWeight.w600, color: cs.onSurfaceVariant, fontSize: 13)),
            const SizedBox(height: 10),
            Wrap(spacing: 8, runSpacing: 8, children: [
              _pmChip('Credit Card', 'card', Icons.credit_card, cs),
              _pmChip('TNG eWallet', 'tng', Icons.account_balance_wallet, cs),
              _pmChip('DuitNow QR', 'duitnow', Icons.qr_code, cs),
              _pmChip('FPX', 'fpx', Icons.account_balance, cs),
            ]),
            const SizedBox(height: 16),
            if (_error != null) Container(
              margin: const EdgeInsets.only(bottom: 14),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: cs.errorContainer, borderRadius: BorderRadius.circular(12)),
              child: Row(children: [
                Icon(Icons.error_outline, size: 18, color: cs.error),
                const SizedBox(width: 8),
                Expanded(child: Text(_error!, style: TextStyle(color: cs.error, fontSize: 13))),
              ]),
            ),
            if (_paymentMethod == 'card') ...[
              TextField(controller: _cardNumC, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Card Number', prefixIcon: Icon(Icons.credit_card), hintText: '1234 5678 9012 3456'),
                onChanged: (v) { final digits = v.replaceAll(RegExp(r'\D'), ''); final buf = StringBuffer(); for (int i = 0; i < digits.length && i < 16; i++) { if (i > 0 && i % 4 == 0) buf.write(' '); buf.write(digits[i]); } _cardNumC.value = TextEditingValue(text: buf.toString(), selection: TextSelection.collapsed(offset: buf.length)); }),
              const SizedBox(height: 14),
              TextField(controller: _cardNameC, textCapitalization: TextCapitalization.characters, decoration: const InputDecoration(labelText: 'Cardholder Name', prefixIcon: Icon(Icons.person))),
              const SizedBox(height: 14),
              Row(children: [
                Expanded(child: TextField(controller: _expiryC, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Expiry', hintText: 'MM/YY'),
                  onChanged: (v) { final digits = v.replaceAll(RegExp(r'\D'), ''); String result = digits.length > 4 ? digits.substring(0, 4) : digits; if (result.length > 2) result = '${result.substring(0, 2)}/${result.substring(2)}'; _expiryC.value = TextEditingValue(text: result, selection: TextSelection.collapsed(offset: result.length)); })),
                const SizedBox(width: 14),
                Expanded(child: TextField(controller: _cvvC, obscureText: true, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'CVV', prefixIcon: Icon(Icons.lock)), maxLength: 4)),
              ]),
            ],
            if (_paymentMethod != 'card') Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                color: cs.surfaceVariant.withOpacity(0.3),
              ),
              child: Column(children: [
                Icon(_paymentMethod == 'tng' ? Icons.account_balance_wallet : _paymentMethod == 'duitnow' ? Icons.qr_code_2 : Icons.account_balance, size: 48, color: cs.primary),
                const SizedBox(height: 12),
                Text(_paymentMethod == 'tng' ? 'Touch \'n Go eWallet' : _paymentMethod == 'duitnow' ? 'DuitNow QR' : 'FPX Online Banking', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 8),
                Text('You will be redirected to complete payment of RM $_total', textAlign: TextAlign.center, style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13)),
              ]),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                color: cs.surfaceVariant.withOpacity(0.3),
              ),
              child: Column(children: [
                _SummaryRow('Room', _roomName),
                _SummaryRow('Dates', '${_fmtDate(_checkIn)} \u2192 ${_fmtDate(_checkOut)}'),
                _SummaryRow('$_nights night${_nights > 1 ? 's' : ''} \u00D7 RM $_roomPrice', 'RM $_total'),
                const Divider(height: 20),
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  const Text('Total', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  Text('RM $_total', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: cs.primary)),
                ]),
              ]),
            ),
          ]),
        ][_step])),
      ]),

      bottomNavigationBar: SafeArea(child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(children: [
          if (_step > 0) Expanded(child: OutlinedButton(onPressed: () => setState(() => _step--), child: const Text('Back'))),
          if (_step > 0) const SizedBox(width: 12),
          Expanded(flex: 2, child: FilledButton(
            onPressed: _processing ? null : () {
              if (_step == 0) { setState(() => _step = 1); }
              else if (_step == 1) {
                if (_nameC.text.trim().isEmpty || _emailC.text.trim().isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill in your name and email')));
                  return;
                }
                setState(() => _step = 2);
              }
              else if (_step == 2) { _processPayment(); }
            },
            child: _processing
              ? const Row(mainAxisSize: MainAxisSize.min, children: [
                  SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)),
                  SizedBox(width: 8),
                  Text('Processing...'),
                ])
              : Text(_step == 2 ? 'Pay RM $_total' : 'Continue'),
          )),
        ]),
      )),
    );
  }

  Widget _pmChip(String label, String method, IconData icon, ColorScheme cs) {
    final selected = _paymentMethod == method;
    return GestureDetector(
      onTap: () => setState(() => _paymentMethod = method),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: selected ? cs.primaryContainer : cs.surfaceVariant.withOpacity(0.4),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: selected ? cs.primary : Colors.transparent, width: 2),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 18, color: selected ? cs.primary : cs.onSurfaceVariant),
          const SizedBox(width: 8),
          Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: selected ? cs.primary : cs.onSurfaceVariant)),
        ]),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label, value;
  const _InfoRow(this.icon, this.label, this.value);
  @override Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Row(children: [
      Icon(icon, size: 20, color: cs.primary),
      const SizedBox(width: 8),
      Text(label, style: TextStyle(color: cs.onSurfaceVariant)),
      const Spacer(),
      Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
    ]);
  }
}

class _SummaryRow extends StatelessWidget {
  final String label, value;
  const _SummaryRow(this.label, this.value);
  @override Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 4),
    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(label, style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant, fontSize: 13)),
      Text(value, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
    ]),
  );
}

class _DateTile extends StatelessWidget {
  final IconData icon;
  final String label, value;
  final VoidCallback onTap;
  const _DateTile({required this.icon, required this.label, required this.value, required this.onTap});
  @override Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: cs.outlineVariant),
        ),
        child: Row(children: [
          Icon(icon, color: cs.primary),
          const SizedBox(width: 12),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label, style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
            const SizedBox(height: 2),
            Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          ]),
          const Spacer(),
          Icon(Icons.edit_calendar, color: cs.onSurfaceVariant),
        ]),
      ),
    );
  }
}

class _CounterBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  const _CounterBtn({required this.icon, this.onTap});
  @override Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          color: onTap != null ? cs.primaryContainer : cs.surfaceVariant,
        ),
        child: Icon(icon, size: 20, color: onTap != null ? cs.primary : cs.onSurfaceVariant),
      ),
    );
  }
}
