import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class BookingFlowScreen extends StatefulWidget {
  final Map<String, dynamic>? roomData;
  const BookingFlowScreen({super.key, this.roomData});
  @override State<BookingFlowScreen> createState() => _BookingFlowScreenState();
}

class _BookingFlowScreenState extends State<BookingFlowScreen> {
  int _step = 0; // 0=Dates, 1=Guest Info, 2=Payment, 3=Success
  DateTime _checkIn = DateTime.now().add(const Duration(days: 1));
  DateTime _checkOut = DateTime.now().add(const Duration(days: 3));
  int _guests = 2;
  final _nameC = TextEditingController();
  final _emailC = TextEditingController();
  final _specialC = TextEditingController();

  // Payment
  final _cardNumC = TextEditingController();
  final _cardNameC = TextEditingController();
  final _expiryC = TextEditingController();
  final _cvvC = TextEditingController();
  String _paymentMethod = 'card'; // card, tng, duitnow, fpx
  bool _paymentProcessing = false;
  String? _paymentError;

  String get _roomName => (widget.roomData?['name'] as String?) ?? 'Standard Room';
  int get _roomPrice => (widget.roomData?['price'] as int?) ?? 179;
  String get _roomEmoji => (widget.roomData?['emoji'] as String?) ?? 'ðŸ¨';
  int get _nights => _checkOut.difference(_checkIn).inDays;
  int get _total => _roomPrice * _nights;

  String _formatDate(DateTime d) => '${d.day}/${d.month}/${d.year}';

  void _processPayment() async {
    // Validate based on method
    if (_paymentMethod == 'card') {
      final digits = _cardNumC.text.replaceAll(' ', '');
      if (digits.length < 13) { setState(() => _paymentError = 'Enter a valid card number'); return; }
      if (_cardNameC.text.trim().isEmpty) { setState(() => _paymentError = 'Enter cardholder name'); return; }
      if (_expiryC.text.length < 5) { setState(() => _paymentError = 'Enter valid expiry (MM/YY)'); return; }
      if (_cvvC.text.length < 3) { setState(() => _paymentError = 'Enter valid CVV'); return; }
    }

    setState(() { _paymentProcessing = true; _paymentError = null; });
    await Future.delayed(const Duration(seconds: 2));
    setState(() { _paymentProcessing = false; _step = 3; });
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final steps = ['Dates', 'Info', 'Payment', 'Done'];

    // Success screen
    if (_step == 3) {
      return Scaffold(
        body: SafeArea(
          child: Center(child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(Icons.check_circle, size: 80, color: Colors.green.shade500),
              const SizedBox(height: 16),
              const Text('Booking Confirmed!', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text('Payment of \$$_total successful', style: TextStyle(fontSize: 16, color: cs.primary, fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),
              Text('$_roomName â€¢ $_nights night${_nights > 1 ? 's' : ''}', style: TextStyle(color: cs.onSurfaceVariant)),
              Text('${_formatDate(_checkIn)} â†’ ${_formatDate(_checkOut)} â€¢ $_guests guest${_guests > 1 ? 's' : ''}', style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13)),
              const SizedBox(height: 16),
              Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(children: [
                _InfoRow('Booking ID', 'BK-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}'),
                _InfoRow('Payment', _paymentMethod == 'card' ? 'Card â€¢â€¢â€¢â€¢ ${_cardNumC.text.replaceAll(' ', '').length >= 4 ? _cardNumC.text.replaceAll(' ', '').substring(_cardNumC.text.replaceAll(' ', '').length - 4) : '0000'}' : _paymentMethod.toUpperCase()),
                _InfoRow('Amount', '\$$_total'),
              ]))),
              const SizedBox(height: 24),
              FilledButton(onPressed: () => context.go('/bookings'), child: const Text('View My Bookings')),
              const SizedBox(height: 8),
              OutlinedButton(onPressed: () => context.go('/rooms'), child: const Text('Book Another Room')),
            ]),
          )),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text('Book $_roomName')),
      body: Column(children: [
        // Stepper
        Padding(padding: const EdgeInsets.all(16), child: Row(
          children: List.generate(steps.length - 1, (i) => Expanded(child: Row(children: [
            Container(width: 28, height: 28, decoration: BoxDecoration(shape: BoxShape.circle, color: i <= _step ? cs.primary : cs.surfaceVariant),
              child: Center(child: Text('${i + 1}', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: i <= _step ? cs.onPrimary : cs.onSurfaceVariant)))),
            if (i < 2) Expanded(child: Container(height: 2, color: i < _step ? cs.primary : cs.surfaceVariant)),
          ]))),
        )),

        // Room summary
        Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: Card(child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(children: [
            Text(_roomEmoji, style: const TextStyle(fontSize: 28)),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(_roomName, style: const TextStyle(fontWeight: FontWeight.bold)),
              Text('\$$_roomPrice/night', style: TextStyle(color: cs.primary, fontWeight: FontWeight.w600, fontSize: 13)),
            ])),
            if (_step > 0) Text('\$$_total total', style: TextStyle(fontWeight: FontWeight.bold, color: cs.primary)),
          ]),
        ))),

        Expanded(child: SingleChildScrollView(padding: const EdgeInsets.all(16), child: [
          // Step 0: Dates
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Select Dates', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            ListTile(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: cs.outline)),
              leading: const Icon(Icons.calendar_today), title: const Text('Check-in'), subtitle: Text(_formatDate(_checkIn)),
              onTap: () async { final d = await showDatePicker(context: context, initialDate: _checkIn, firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 365))); if (d != null) setState(() => _checkIn = d); }),
            const SizedBox(height: 12),
            ListTile(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: cs.outline)),
              leading: const Icon(Icons.calendar_today), title: const Text('Check-out'), subtitle: Text(_formatDate(_checkOut)),
              onTap: () async { final d = await showDatePicker(context: context, initialDate: _checkOut, firstDate: _checkIn.add(const Duration(days: 1)), lastDate: DateTime.now().add(const Duration(days: 365))); if (d != null) setState(() => _checkOut = d); }),
            const SizedBox(height: 16),
            Row(children: [
              const Text('Guests:', style: TextStyle(fontWeight: FontWeight.w500)),
              const Spacer(),
              IconButton(onPressed: _guests > 1 ? () => setState(() => _guests--) : null, icon: const Icon(Icons.remove_circle_outline)),
              Text('$_guests', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              IconButton(onPressed: _guests < 6 ? () => setState(() => _guests++) : null, icon: const Icon(Icons.add_circle_outline)),
            ]),
            const SizedBox(height: 12),
            Card(child: Padding(padding: const EdgeInsets.all(16), child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('$_nights night${_nights > 1 ? 's' : ''}', style: const TextStyle(fontWeight: FontWeight.w600)),
              Text('Total: \$$_total', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: cs.primary)),
            ]))),
          ]),
          // Step 1: Guest Info
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Guest Information', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            TextField(controller: _nameC, decoration: const InputDecoration(labelText: 'Full Name', prefixIcon: Icon(Icons.person_outlined))),
            const SizedBox(height: 12),
            TextField(controller: _emailC, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined))),
            const SizedBox(height: 12),
            TextField(controller: _specialC, maxLines: 3, decoration: const InputDecoration(labelText: 'Special Requests (optional)', alignLabelWithHint: true)),
          ]),
          // Step 2: Payment
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Payment', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),

            // Payment method selector
            const Text('Payment Method', style: TextStyle(fontWeight: FontWeight.w500)),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 8, children: [
              _PaymentChip('Credit Card', 'card', Icons.credit_card),
              _PaymentChip('TNG eWallet', 'tng', Icons.account_balance_wallet),
              _PaymentChip('DuitNow QR', 'duitnow', Icons.qr_code),
              _PaymentChip('FPX', 'fpx', Icons.account_balance),
            ]),
            const SizedBox(height: 16),

            if (_paymentError != null) Container(margin: const EdgeInsets.only(bottom: 12), padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: cs.errorContainer, borderRadius: BorderRadius.circular(12)), child: Text(_paymentError!, style: TextStyle(color: cs.error, fontSize: 13))),

            // Card form
            if (_paymentMethod == 'card') ...[
              TextField(controller: _cardNumC, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Card Number', prefixIcon: Icon(Icons.credit_card), hintText: '1234 5678 9012 3456'),
                onChanged: (v) { final digits = v.replaceAll(' ', '').replaceAll(RegExp(r'\D'), ''); final buf = StringBuffer(); for (int i = 0; i < digits.length && i < 16; i++) { if (i > 0 && i % 4 == 0) buf.write(' '); buf.write(digits[i]); } _cardNumC.value = TextEditingValue(text: buf.toString(), selection: TextSelection.collapsed(offset: buf.length)); }),
              const SizedBox(height: 12),
              TextField(controller: _cardNameC, textCapitalization: TextCapitalization.characters, decoration: const InputDecoration(labelText: 'Cardholder Name', prefixIcon: Icon(Icons.person))),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: TextField(controller: _expiryC, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Expiry', hintText: 'MM/YY'),
                  onChanged: (v) { final digits = v.replaceAll('/', '').replaceAll(RegExp(r'\D'), ''); String result = digits.length > 4 ? digits.substring(0, 4) : digits; if (result.length > 2) result = '${result.substring(0, 2)}/${result.substring(2)}'; _expiryC.value = TextEditingValue(text: result, selection: TextSelection.collapsed(offset: result.length)); })),
                const SizedBox(width: 12),
                Expanded(child: TextField(controller: _cvvC, obscureText: true, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'CVV', prefixIcon: Icon(Icons.lock)), maxLength: 4)),
              ]),
            ],

            // TNG / DuitNow / FPX
            if (_paymentMethod == 'tng') Card(child: Padding(padding: const EdgeInsets.all(20), child: Column(children: [
              Icon(Icons.account_balance_wallet, size: 48, color: cs.primary),
              const SizedBox(height: 12),
              const Text('Touch \'n Go eWallet', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 8),
              Text('You will be redirected to TNG eWallet to complete payment of \$$_total', textAlign: TextAlign.center, style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13)),
            ]))),

            if (_paymentMethod == 'duitnow') Card(child: Padding(padding: const EdgeInsets.all(20), child: Column(children: [
              Icon(Icons.qr_code, size: 48, color: cs.primary),
              const SizedBox(height: 12),
              const Text('DuitNow QR', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 8),
              Text('Scan the QR code with your banking app to pay \$$_total', textAlign: TextAlign.center, style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13)),
              const SizedBox(height: 16),
              Container(width: 150, height: 150, decoration: BoxDecoration(color: cs.surfaceVariant, borderRadius: BorderRadius.circular(12)), child: Icon(Icons.qr_code_2, size: 100, color: cs.primary)),
            ]))),

            if (_paymentMethod == 'fpx') Card(child: Padding(padding: const EdgeInsets.all(20), child: Column(children: [
              Icon(Icons.account_balance, size: 48, color: cs.primary),
              const SizedBox(height: 12),
              const Text('FPX Online Banking', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 8),
              Text('You will be redirected to your bank to complete payment of \$$_total', textAlign: TextAlign.center, style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13)),
            ]))),

            const SizedBox(height: 16),
            // Order summary
            Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(children: [
              _InfoRow('Room', _roomName),
              _InfoRow('Check-in', _formatDate(_checkIn)),
              _InfoRow('Check-out', _formatDate(_checkOut)),
              _InfoRow('Nights', '$_nights'),
              _InfoRow('Guests', '$_guests'),
              const Divider(height: 24),
              _InfoRow('\$$_roomPrice Ã— $_nights night${_nights > 1 ? 's' : ''}', '\$$_total'),
              _InfoRow('Taxes & fees', 'Included'),
              const Divider(height: 24),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                const Text('Total', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Text('\$$_total', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: cs.primary)),
              ]),
            ]))),
          ]),
        ][_step])),
      ]),

      bottomNavigationBar: SafeArea(child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(children: [
          if (_step > 0) Expanded(child: OutlinedButton(onPressed: () => setState(() => _step--), child: const Text('Back'))),
          if (_step > 0) const SizedBox(width: 12),
          Expanded(child: FilledButton(
            onPressed: _paymentProcessing ? null : () {
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
            child: _paymentProcessing
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : Text(_step == 2 ? 'Pay \$$_total' : 'Continue'),
          )),
        ]),
      )),
    );
  }

  Widget _PaymentChip(String label, String method, IconData icon) {
    final cs = Theme.of(context).colorScheme;
    final selected = _paymentMethod == method;
    return GestureDetector(
      onTap: () => setState(() => _paymentMethod = method),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? cs.primaryContainer : cs.surfaceVariant,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: selected ? cs.primary : Colors.transparent, width: 2),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 16, color: selected ? cs.primary : cs.onSurfaceVariant),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: selected ? cs.primary : cs.onSurfaceVariant)),
        ]),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label, value;
  const _InfoRow(this.label, this.value);
  @override Widget build(BuildContext context) => Padding(padding: const EdgeInsets.symmetric(vertical: 4), child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text(label, style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)), Text(value, style: const TextStyle(fontWeight: FontWeight.w500))]));
}

