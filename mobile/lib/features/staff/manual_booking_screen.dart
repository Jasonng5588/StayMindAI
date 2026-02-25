import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ManualBookingScreen extends StatefulWidget {
  const ManualBookingScreen({super.key});
  @override State<ManualBookingScreen> createState() => _ManualBookingScreenState();
}

class _ManualBookingScreenState extends State<ManualBookingScreen> {
  final _nameC = TextEditingController();
  final _emailC = TextEditingController();
  final _phoneC = TextEditingController();
  final _notesC = TextEditingController();
  String? _roomType;
  DateTime _checkIn = DateTime.now();
  DateTime _checkOut = DateTime.now().add(const Duration(days: 1));
  int _guests = 1;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New Booking')),
      body: SingleChildScrollView(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        TextField(controller: _nameC, decoration: const InputDecoration(labelText: 'Guest Name', prefixIcon: Icon(Icons.person_outlined))),
        const SizedBox(height: 12),
        TextField(controller: _emailC, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined))),
        const SizedBox(height: 12),
        TextField(controller: _phoneC, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Phone', prefixIcon: Icon(Icons.phone_outlined))),
        const SizedBox(height: 16),
        DropdownButtonFormField<String>(value: _roomType, decoration: const InputDecoration(labelText: 'Room Type', prefixIcon: Icon(Icons.bed_outlined)),
          items: ['Deluxe King', 'Premium Suite', 'Standard Double', 'Family Room'].map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
          onChanged: (v) => setState(() => _roomType = v)),
        const SizedBox(height: 16),
        Row(children: [
          Expanded(child: ListTile(contentPadding: EdgeInsets.zero, title: const Text('Check-in', style: TextStyle(fontSize: 13)), subtitle: Text('${_checkIn.month}/${_checkIn.day}/${_checkIn.year}'), onTap: () async { final d = await showDatePicker(context: context, initialDate: _checkIn, firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 365))); if (d != null) setState(() => _checkIn = d); })),
          Expanded(child: ListTile(contentPadding: EdgeInsets.zero, title: const Text('Check-out', style: TextStyle(fontSize: 13)), subtitle: Text('${_checkOut.month}/${_checkOut.day}/${_checkOut.year}'), onTap: () async { final d = await showDatePicker(context: context, initialDate: _checkOut, firstDate: _checkIn.add(const Duration(days: 1)), lastDate: DateTime.now().add(const Duration(days: 365))); if (d != null) setState(() => _checkOut = d); })),
        ]),
        const SizedBox(height: 12),
        Row(children: [const Text('Guests: '), IconButton(onPressed: _guests > 1 ? () => setState(() => _guests--) : null, icon: const Icon(Icons.remove_circle_outline)), Text('$_guests', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)), IconButton(onPressed: () => setState(() => _guests++), icon: const Icon(Icons.add_circle_outline))]),
        const SizedBox(height: 12),
        TextField(controller: _notesC, maxLines: 3, decoration: const InputDecoration(labelText: 'Notes', alignLabelWithHint: true)),
        const SizedBox(height: 24),
        FilledButton.icon(icon: const Icon(Icons.check), label: const Text('Create Booking'), onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Booking created successfully!')));
          context.pop();
        }),
      ])),
    );
  }
}

