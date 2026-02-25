import 'package:flutter/material.dart';
import '../../services/supabase_service.dart';

class ReviewsScreen extends StatefulWidget {
  const ReviewsScreen({super.key});
  @override State<ReviewsScreen> createState() => _ReviewsScreenState();
}

class _ReviewsScreenState extends State<ReviewsScreen> {
  List<Map<String, dynamic>> _reviews = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      _reviews = await SupabaseService.getMyReviews();
    } catch (e) {
      _error = e.toString();
    }
    if (mounted) setState(() => _loading = false);
  }

  String _getHotelName(Map<String, dynamic> r) {
    if (r['hotels'] is Map) return (r['hotels'] as Map)['name'] ?? 'Hotel';
    return r['hotel_id']?.toString().substring(0, 8) ?? 'Hotel';
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('My Reviews', style: TextStyle(fontWeight: FontWeight.bold))),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : _error != null
          ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.error_outline, size: 48, color: cs.error),
              const SizedBox(height: 12),
              Text('Failed to load reviews', style: TextStyle(color: cs.error)),
              const SizedBox(height: 4),
              Text('Check your connection and try again', style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant)),
              const SizedBox(height: 12),
              FilledButton.icon(icon: const Icon(Icons.refresh), label: const Text('Retry'), onPressed: _load),
            ]))
          : _reviews.isEmpty
            ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.amber.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.rate_review_outlined, size: 48, color: Colors.amber.shade600),
                ),
                const SizedBox(height: 16),
                const Text('No reviews yet', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
                const SizedBox(height: 4),
                Text('Your hotel reviews will appear here', style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant)),
              ]))
            : RefreshIndicator(
                onRefresh: _load,
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _reviews.length,
                  itemBuilder: (_, i) {
                    final r = _reviews[i];
                    final rating = (r['rating'] ?? 0) is int ? r['rating'] as int : (r['rating'] as num?)?.toInt() ?? 0;
                    final hotelName = _getHotelName(r);
                    final comment = r['comment']?.toString() ?? '';
                    final date = r['created_at']?.toString().split('T')[0] ?? '';

                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: cs.outlineVariant.withOpacity(0.5)),
                        color: cs.surface,
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: cs.primaryContainer.withOpacity(0.5),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(Icons.hotel, size: 20, color: cs.primary),
                              ),
                              const SizedBox(width: 12),
                              Expanded(child: Text(hotelName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15))),
                            ]),
                            const SizedBox(height: 12),
                            Row(children: [
                              ...List.generate(5, (j) => Padding(
                                padding: const EdgeInsets.only(right: 2),
                                child: Icon(
                                  j < rating ? Icons.star_rounded : Icons.star_outline_rounded,
                                  size: 22,
                                  color: j < rating ? Colors.amber.shade600 : cs.outlineVariant,
                                ),
                              )),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: Colors.amber.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text('$rating/5', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.amber.shade700)),
                              ),
                            ]),
                            if (comment.isNotEmpty) ...[
                              const SizedBox(height: 12),
                              Text(comment, style: TextStyle(color: cs.onSurfaceVariant, height: 1.5, fontSize: 14)),
                            ],
                            const SizedBox(height: 10),
                            Row(children: [
                              Icon(Icons.calendar_today, size: 13, color: cs.outlineVariant),
                              const SizedBox(width: 4),
                              Text(date, style: TextStyle(fontSize: 12, color: cs.outlineVariant)),
                            ]),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
    );
  }
}
