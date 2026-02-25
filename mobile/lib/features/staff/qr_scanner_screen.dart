import 'package:flutter/material.dart';

class QrScannerScreen extends StatelessWidget {
  const QrScannerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('QR Scanner')),
      body: Center(child: Padding(padding: const EdgeInsets.all(32), child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Container(
          width: 240, height: 240,
          decoration: BoxDecoration(
            border: Border.all(color: cs.primary, width: 3),
            borderRadius: BorderRadius.circular(24),
          ),
          child: Stack(children: [
            Center(child: Icon(Icons.qr_code_scanner, size: 80, color: cs.primary.withOpacity(0.3))),
            // Corner markers
            ...[
              const Positioned(top: 0, left: 0, child: _Corner(topLeft: true)),
              const Positioned(top: 0, right: 0, child: _Corner(topRight: true)),
              const Positioned(bottom: 0, left: 0, child: _Corner(bottomLeft: true)),
              const Positioned(bottom: 0, right: 0, child: _Corner(bottomRight: true)),
            ],
          ]),
        ),
        const SizedBox(height: 24),
        Text('Scan Booking QR Code', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Text('Point camera at guest\'s booking QR code for instant check-in', textAlign: TextAlign.center, style: TextStyle(color: cs.onSurfaceVariant)),
        const SizedBox(height: 32),
        OutlinedButton.icon(icon: const Icon(Icons.keyboard), label: const Text('Enter Code Manually'), onPressed: () {
          showDialog(context: context, builder: (_) {
            final ctrl = TextEditingController();
            return AlertDialog(title: const Text('Enter Code'), content: TextField(controller: ctrl, decoration: const InputDecoration(hintText: 'BK-XXXXXX')), actions: [
              TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
              FilledButton(onPressed: () { Navigator.pop(context); ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Checking code: ${ctrl.text}'))); }, child: const Text('Look Up')),
            ]);
          });
        }),
      ]))),
    );
  }
}

class _Corner extends StatelessWidget {
  final bool topLeft, topRight, bottomLeft, bottomRight;
  const _Corner({this.topLeft = false, this.topRight = false, this.bottomLeft = false, this.bottomRight = false});
  @override Widget build(BuildContext context) {
    return Container(width: 24, height: 24, decoration: BoxDecoration(
      border: Border(
        top: (topLeft || topRight) ? BorderSide(color: Theme.of(context).colorScheme.primary, width: 4) : BorderSide.none,
        bottom: (bottomLeft || bottomRight) ? BorderSide(color: Theme.of(context).colorScheme.primary, width: 4) : BorderSide.none,
        left: (topLeft || bottomLeft) ? BorderSide(color: Theme.of(context).colorScheme.primary, width: 4) : BorderSide.none,
        right: (topRight || bottomRight) ? BorderSide(color: Theme.of(context).colorScheme.primary, width: 4) : BorderSide.none,
      ),
      borderRadius: BorderRadius.only(
        topLeft: topLeft ? const Radius.circular(8) : Radius.zero,
        topRight: topRight ? const Radius.circular(8) : Radius.zero,
        bottomLeft: bottomLeft ? const Radius.circular(8) : Radius.zero,
        bottomRight: bottomRight ? const Radius.circular(8) : Radius.zero,
      ),
    ));
  }
}

