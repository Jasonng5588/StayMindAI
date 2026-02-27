import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/supabase_service.dart';

class LoyaltyScreen extends StatefulWidget {
  const LoyaltyScreen({super.key});
  @override State<LoyaltyScreen> createState() => _LoyaltyScreenState();
}

class _LoyaltyScreenState extends State<LoyaltyScreen> {
  bool _loading = true;
  int _totalPoints = 0;
  List<Map<String, dynamic>> _tiers = [];
  List<Map<String, dynamic>> _history = [];
  String _currentTier = 'Bronze';

  @override
  void initState() { super.initState(); _loadData(); }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        SupabaseService.getLoyaltyPoints(),
        SupabaseService.getLoyaltyTiers(),
      ]);

      final points = results[0] as List<Map<String, dynamic>>;
      final total = points.fold<int>(0, (sum, p) => sum + ((p['points'] as num?)?.toInt() ?? 0));

      final tiers = (results[1] as List<Map<String, dynamic>>)..sort((a, b) => ((a['min_points'] ?? 0) as num).compareTo((b['min_points'] ?? 0) as num));
      String tier = 'Bronze';
      for (final t in tiers) {
        if (total >= ((t['min_points'] ?? 0) as num).toInt()) tier = t['name'] ?? 'Bronze';
      }

      setState(() {
        _totalPoints = total;
        _history = points;
        _tiers = tiers;
        _currentTier = tier;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Color _tierColor(String tier) => switch (tier.toLowerCase()) {
    'gold' => const Color(0xFFD4A853),
    'silver' => const Color(0xFF78909C),
    'platinum' => const Color(0xFF7C3AED),
    _ => const Color(0xFFCD7F32),
  };

  IconData _tierIcon(String tier) => switch (tier.toLowerCase()) {
    'gold' => Icons.emoji_events,
    'silver' => Icons.workspace_premium,
    'platinum' => Icons.diamond,
    _ => Icons.shield,
  };


  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Loyalty Program', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [IconButton(icon: const Icon(Icons.refresh), onPressed: _loadData)],
      ),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : RefreshIndicator(
            onRefresh: _loadData,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Points card
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [_tierColor(_currentTier), _tierColor(_currentTier).withOpacity(0.6)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [BoxShadow(color: _tierColor(_currentTier).withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 4))],
                  ),
                  child: Column(children: [
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      Row(children: [
                        Icon(_tierIcon(_currentTier), size: 28, color: Colors.white),
                        const SizedBox(width: 8),
                        Text('$_currentTier Member', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
                      ]),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(20)),
                        child: const Text('ACTIVE', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1)),
                      ),
                    ]),
                    const SizedBox(height: 20),
                    Text('$_totalPoints', style: const TextStyle(color: Colors.white, fontSize: 42, fontWeight: FontWeight.bold, height: 1)),
                    const Text('Total Points', style: TextStyle(color: Colors.white70, fontSize: 14)),
                    // Progress to next tier
                    if (_tiers.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Builder(builder: (_) {
                        final nextTier = _tiers.where((t) => ((t['min_points'] ?? 0) as num).toInt() > _totalPoints).toList();
                        if (nextTier.isEmpty) return const Text('Top Tier!', style: TextStyle(color: Colors.white70, fontSize: 12));
                        final next = nextTier.first;
                        final nextPts = ((next['min_points'] ?? 0) as num).toInt();
                        final prevTier = _tiers.lastWhere((t) => ((t['min_points'] ?? 0) as num).toInt() <= _totalPoints, orElse: () => {'min_points': 0});
                        final prevPts = ((prevTier['min_points'] ?? 0) as num).toInt();
                        final progress = (nextPts - prevPts) > 0 ? (_totalPoints - prevPts) / (nextPts - prevPts) : 0.0;
                        return Column(children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(value: progress.clamp(0.0, 1.0), backgroundColor: Colors.white24, valueColor: const AlwaysStoppedAnimation(Colors.white), minHeight: 6),
                          ),
                          const SizedBox(height: 6),
                          Text('${nextPts - _totalPoints} pts to ${next['name']}', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                        ]);
                      }),
                    ],
                    const SizedBox(height: 12),
                    ElevatedButton.icon(
                      onPressed: () => context.push('/profile/rewards'),
                      icon: const Icon(Icons.card_giftcard, size: 18),
                      label: const Text('My Rewards'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: _tierColor(_currentTier),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                      ),
                    ),
                  ]),
                ),
                const SizedBox(height: 24),

                // Tiers
                if (_tiers.isNotEmpty) ...[
                  const Text('Membership Tiers', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 90,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _tiers.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 10),
                      itemBuilder: (_, i) {
                        final t = _tiers[i];
                        final name = t['name'] ?? 'Tier';
                        final isCurrent = name == _currentTier;
                        final tc = _tierColor(name);
                        return Container(
                          width: 110,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isCurrent ? tc.withOpacity(0.15) : cs.surfaceVariant.withOpacity(0.3),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: isCurrent ? tc : Colors.transparent, width: 2),
                          ),
                          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                            Icon(_tierIcon(name), size: 24, color: tc),
                            const SizedBox(height: 6),
                            Text(name, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: isCurrent ? tc : null)),
                            Text('${((t['min_points'] ?? 0) as num).toInt()}+', style: TextStyle(fontSize: 10, color: cs.onSurfaceVariant)),
                          ]),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 24),
                ],

                // History
                if (_history.isNotEmpty) ...[
                  const Text('Points History', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  ..._history.take(20).map((h) {
                    final pts = ((h['points'] ?? 0) as num).toInt();
                    final isPositive = pts >= 0;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 6),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        color: cs.surfaceVariant.withOpacity(0.2),
                      ),
                      child: Row(children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: (isPositive ? Colors.green : Colors.red).withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(isPositive ? Icons.add : Icons.remove, size: 16, color: isPositive ? Colors.green : Colors.red),
                        ),
                        const SizedBox(width: 12),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(h['description'] ?? h['type'] ?? 'Points', style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
                          Text(_fmtDate(h['created_at'] ?? ''), style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
                        ])),
                        Text('${isPositive ? '+' : ''}$pts', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: isPositive ? Colors.green : Colors.red)),
                      ]),
                    );
                  }),
                ],

                if (_tiers.isEmpty && _history.isEmpty)
                  Center(child: Padding(
                    padding: const EdgeInsets.all(48),
                    child: Column(children: [
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(color: cs.primaryContainer.withOpacity(0.3), shape: BoxShape.circle),
                        child: Icon(Icons.loyalty, size: 48, color: cs.primary),
                      ),
                      const SizedBox(height: 16),
                      const Text('No loyalty data yet', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 6),
                      Text('Start earning points by booking stays!', style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant)),
                    ]),
                  )),
              ],
            ),
          ),
    );
  }

  String _fmtDate(String iso) { try { final d = DateTime.parse(iso); return '${d.day}/${d.month}/${d.year}'; } catch (_) { return iso; } }
}
