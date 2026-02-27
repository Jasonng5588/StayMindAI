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
    return 'Hotel Stay';
  }

  void _showWriteReview() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _WriteReviewSheet(onSubmitted: _load),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Reviews', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showWriteReview,
        icon: const Icon(Icons.rate_review),
        label: const Text('Write Review'),
      ),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : _error != null
          ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.error_outline, size: 48, color: cs.error),
              const SizedBox(height: 12),
              Text('Failed to load reviews', style: TextStyle(color: cs.error)),
              const SizedBox(height: 12),
              FilledButton.icon(icon: const Icon(Icons.refresh), label: const Text('Retry'), onPressed: _load),
            ]))
          : _reviews.isEmpty
            ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(color: Colors.amber.withOpacity(0.1), shape: BoxShape.circle),
                  child: Icon(Icons.rate_review_outlined, size: 48, color: Colors.amber.shade600),
                ),
                const SizedBox(height: 16),
                const Text('No reviews yet', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                Text('Share your hotel experience!', style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant)),
                const SizedBox(height: 20),
                FilledButton.icon(
                  onPressed: _showWriteReview,
                  icon: const Icon(Icons.edit),
                  label: const Text('Write Your First Review'),
                ),
              ]))
            : RefreshIndicator(
                onRefresh: _load,
                child: ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                  itemCount: _reviews.length,
                  itemBuilder: (_, i) {
                    final r = _reviews[i];
                    final rating = ((r['rating'] ?? 0) as num).toInt();
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
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Row(children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(color: cs.primaryContainer.withOpacity(0.5), borderRadius: BorderRadius.circular(10)),
                              child: Icon(Icons.hotel, size: 20, color: cs.primary),
                            ),
                            const SizedBox(width: 12),
                            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(hotelName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                              const SizedBox(height: 2),
                              Text(date, style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
                            ])),
                          ]),
                          const SizedBox(height: 14),
                          Row(children: [
                            ...List.generate(5, (j) => Padding(
                              padding: const EdgeInsets.only(right: 3),
                              child: Icon(j < rating ? Icons.star_rounded : Icons.star_outline_rounded, size: 24, color: j < rating ? Colors.amber.shade600 : cs.outlineVariant),
                            )),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(color: Colors.amber.withOpacity(0.12), borderRadius: BorderRadius.circular(8)),
                              child: Text('$rating.0', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.amber.shade700)),
                            ),
                          ]),
                          if (comment.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Text(comment, style: TextStyle(color: cs.onSurfaceVariant, height: 1.5, fontSize: 14)),
                          ],
                        ]),
                      ),
                    );
                  },
                ),
              ),
    );
  }
}

// Write Review Bottom Sheet
class _WriteReviewSheet extends StatefulWidget {
  final VoidCallback onSubmitted;
  const _WriteReviewSheet({required this.onSubmitted});
  @override State<_WriteReviewSheet> createState() => _WriteReviewSheetState();
}

class _WriteReviewSheetState extends State<_WriteReviewSheet> {
  List<Map<String, dynamic>> _hotels = [];
  String? _selectedHotelId;
  String? _selectedHotelName;
  int _rating = 0;
  final _commentC = TextEditingController();
  bool _loading = true;
  bool _submitting = false;

  @override
  void initState() { super.initState(); _loadHotels(); }

  @override
  void dispose() { _commentC.dispose(); super.dispose(); }

  Future<void> _loadHotels() async {
    try {
      _hotels = await SupabaseService.getBookedHotels();
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _submit() async {
    if (_selectedHotelId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a hotel')));
      return;
    }
    if (_rating == 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a rating')));
      return;
    }
    if (_commentC.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please write a comment')));
      return;
    }

    setState(() => _submitting = true);
    try {
      await SupabaseService.submitReview(_selectedHotelId!, _rating, _commentC.text.trim());
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(children: [Icon(Icons.check_circle, color: Colors.white, size: 18), SizedBox(width: 8), Text('Review submitted! Thank you!')]),
            backgroundColor: Colors.green.shade600,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
        widget.onSubmitted();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(children: [const Icon(Icons.error, color: Colors.white, size: 18), const SizedBox(width: 8), Expanded(child: Text('Failed: ${e.toString().split(':').last.trim()}'))]),
            backgroundColor: Colors.red.shade600,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    }
    if (mounted) setState(() => _submitting = false);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: EdgeInsets.only(left: 24, right: 24, top: 8, bottom: MediaQuery.of(context).viewInsets.bottom + 24),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Center(child: Container(width: 40, height: 4, margin: const EdgeInsets.only(bottom: 16), decoration: BoxDecoration(color: cs.outlineVariant, borderRadius: BorderRadius.circular(2)))),
        Row(children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: Colors.amber.withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
            child: Icon(Icons.rate_review, color: Colors.amber.shade700, size: 20),
          ),
          const SizedBox(width: 12),
          const Text('Write a Review', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        ]),
        const SizedBox(height: 20),

        // Hotel selector
        _loading
          ? const Center(child: CircularProgressIndicator())
          : _hotels.isEmpty
            ? Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: cs.errorContainer, borderRadius: BorderRadius.circular(12)),
                child: Row(children: [
                  Icon(Icons.info_outline, color: cs.error, size: 20),
                  const SizedBox(width: 8),
                  Expanded(child: Text('No hotels to review. Book a stay first!', style: TextStyle(color: cs.error, fontSize: 13))),
                ]),
              )
            : DropdownButtonFormField<String>(
                value: _selectedHotelId,
                decoration: const InputDecoration(labelText: 'Select Hotel', prefixIcon: Icon(Icons.hotel)),
                items: _hotels.map((h) => DropdownMenuItem(value: h['id'] as String, child: Text(h['name'] as String))).toList(),
                onChanged: (v) => setState(() { _selectedHotelId = v; _selectedHotelName = _hotels.firstWhere((h) => h['id'] == v)['name']; }),
              ),
        const SizedBox(height: 20),

        // Star rating
        const Text('Rating', style: TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 10),
        Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(5, (i) => GestureDetector(
          onTap: () => setState(() => _rating = i + 1),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6),
            child: AnimatedScale(
              scale: i < _rating ? 1.2 : 1.0,
              duration: const Duration(milliseconds: 150),
              child: Icon(
                i < _rating ? Icons.star_rounded : Icons.star_outline_rounded,
                size: 40,
                color: i < _rating ? Colors.amber.shade600 : cs.outlineVariant,
              ),
            ),
          ),
        ))),
        if (_rating > 0) Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Center(child: Text(
            ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][_rating],
            style: TextStyle(fontWeight: FontWeight.w600, color: Colors.amber.shade700),
          )),
        ),
        const SizedBox(height: 16),

        // Comment
        TextField(
          controller: _commentC,
          maxLines: 4,
          decoration: const InputDecoration(
            labelText: 'Your review',
            hintText: 'Share your experience...',
            alignLabelWithHint: true,
            prefixIcon: Padding(padding: EdgeInsets.only(bottom: 60), child: Icon(Icons.edit)),
          ),
        ),
        const SizedBox(height: 20),

        SizedBox(
          height: 50,
          child: FilledButton(
            onPressed: _submitting || _hotels.isEmpty ? null : _submit,
            child: _submitting
              ? const Row(mainAxisSize: MainAxisSize.min, children: [SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)), SizedBox(width: 8), Text('Submitting...')])
              : const Text('Submit Review'),
          ),
        ),
      ]),
    );
  }
}
