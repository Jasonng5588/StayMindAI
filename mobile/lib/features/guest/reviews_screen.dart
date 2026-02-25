import 'package:flutter/material.dart';
import '../../services/supabase_service.dart';

class ReviewsScreen extends StatefulWidget {
  const ReviewsScreen({super.key});
  @override State<ReviewsScreen> createState() => _ReviewsScreenState();
}

class _ReviewsScreenState extends State<ReviewsScreen> {
  List<Map<String, dynamic>> _reviews = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }
  Future<void> _load() async { try { _reviews = await SupabaseService.getMyReviews(); } catch (_) {} if (mounted) setState(() => _loading = false); }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('My Reviews')),
      body: _loading ? const Center(child: CircularProgressIndicator()) : _reviews.isEmpty
        ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.rate_review, size: 48, color: cs.onSurfaceVariant), const SizedBox(height: 8), const Text('No reviews yet')]))
        : ListView.separated(padding: const EdgeInsets.all(16), itemCount: _reviews.length, separatorBuilder: (_, __) => const SizedBox(height: 12), itemBuilder: (_, i) {
          final r = _reviews[i];
          return Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [Expanded(child: Text(r['hotels']?['name'] ?? 'Hotel', style: const TextStyle(fontWeight: FontWeight.bold))), Row(children: List.generate(5, (j) => Icon(j < (r['rating'] ?? 0) ? Icons.star : Icons.star_border, size: 16, color: Colors.amber.shade600)))]),
            const SizedBox(height: 8),
            Text(r['comment'] ?? '', style: TextStyle(color: cs.onSurfaceVariant, height: 1.4)),
            const SizedBox(height: 8),
            Text(r['created_at']?.toString().split('T')[0] ?? '', style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
          ])));
        }),
    );
  }
}

