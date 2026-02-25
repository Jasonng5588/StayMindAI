import 'package:flutter/material.dart';
import '../../services/supabase_service.dart';

class LoyaltyScreen extends StatefulWidget {
  const LoyaltyScreen({super.key});
  @override
  State<LoyaltyScreen> createState() => _LoyaltyScreenState();
}

class _LoyaltyScreenState extends State<LoyaltyScreen> {
  bool _loading = true;
  int _totalPoints = 0;
  List<Map<String, dynamic>> _tiers = [];
  List<Map<String, dynamic>> _rewards = [];
  List<Map<String, dynamic>> _history = [];
  String _currentTier = 'Bronze';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        SupabaseService.getLoyaltyPoints(),
        SupabaseService.getLoyaltyTiers(),
        SupabaseService.getLoyaltyRewards(),
      ]);

      final points = results[0];
      final total = points.fold<int>(0, (sum, p) => sum + ((p['points'] as num?)?.toInt() ?? 0));

      final tiers = results[1]..sort((a, b) => ((a['min_points'] ?? 0) as num).compareTo((b['min_points'] ?? 0) as num));
      String tier = 'Bronze';
      for (final t in tiers) {
        if (total >= ((t['min_points'] ?? 0) as num).toInt()) tier = t['name'] ?? 'Bronze';
      }

      setState(() {
        _totalPoints = total;
        _history = points;
        _tiers = tiers;
        _rewards = results[2];
        _currentTier = tier;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Color _tierColor(String tier) {
    switch (tier.toLowerCase()) {
      case 'gold': return Colors.amber;
      case 'silver': return Colors.blueGrey;
      case 'platinum': return Colors.deepPurple;
      default: return Colors.brown;
    }
  }

  IconData _tierIcon(String tier) {
    switch (tier.toLowerCase()) {
      case 'gold': return Icons.emoji_events;
      case 'silver': return Icons.workspace_premium;
      case 'platinum': return Icons.diamond;
      default: return Icons.shield;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Loyalty Program')),
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
                        colors: [_tierColor(_currentTier), _tierColor(_currentTier).withAlpha(150)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Column(
                      children: [
                        Icon(_tierIcon(_currentTier), size: 48, color: Colors.white),
                        const SizedBox(height: 8),
                        Text(_currentTier, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text('$_totalPoints Points', style: const TextStyle(color: Colors.white70, fontSize: 28, fontWeight: FontWeight.w300)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Tiers
                  if (_tiers.isNotEmpty) ...[
                    Text('Membership Tiers', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    ..._tiers.map((t) {
                      final name = t['name'] ?? 'Tier';
                      final minPts = ((t['min_points'] ?? 0) as num).toInt();
                      final isCurrent = name == _currentTier;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isCurrent ? _tierColor(name).withAlpha(30) : theme.colorScheme.surfaceVariant,
                          border: isCurrent ? Border.all(color: _tierColor(name), width: 2) : null,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            Icon(_tierIcon(name), color: _tierColor(name)),
                            const SizedBox(width: 12),
                            Expanded(child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(name, style: TextStyle(fontWeight: FontWeight.bold, color: isCurrent ? _tierColor(name) : null)),
                                Text('$minPts+ points', style: theme.textTheme.bodySmall),
                              ],
                            )),
                            if (isCurrent) const Chip(label: Text('Current', style: TextStyle(fontSize: 11)), padding: EdgeInsets.zero, visualDensity: VisualDensity.compact),
                          ],
                        ),
                      );
                    }),
                    const SizedBox(height: 24),
                  ],

                  // Rewards
                  if (_rewards.isNotEmpty) ...[
                    Text('Available Rewards', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    ..._rewards.map((r) {
                      final cost = ((r['points_cost'] ?? 0) as num).toInt();
                      final canRedeem = _totalPoints >= cost;
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: canRedeem ? theme.colorScheme.primary : Colors.grey,
                            child: const Icon(Icons.card_giftcard, color: Colors.white),
                          ),
                          title: Text(r['name'] ?? 'Reward'),
                          subtitle: Text(r['description'] ?? ''),
                          trailing: TextButton(
                            onPressed: canRedeem ? () => _showRedeemDialog(r) : null,
                            child: Text('$cost pts'),
                          ),
                        ),
                      );
                    }),
                    const SizedBox(height: 24),
                  ],

                  // History
                  if (_history.isNotEmpty) ...[
                    Text('Points History', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    ..._history.take(20).map((h) {
                      final pts = ((h['points'] ?? 0) as num).toInt();
                      final isPositive = pts >= 0;
                      return ListTile(
                        leading: Icon(isPositive ? Icons.add_circle : Icons.remove_circle, color: isPositive ? Colors.green : Colors.red),
                        title: Text(h['description'] ?? h['type'] ?? 'Points'),
                        subtitle: Text(_formatDate(h['created_at'] ?? '')),
                        trailing: Text('${isPositive ? '+' : ''}$pts', style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: isPositive ? Colors.green : Colors.red,
                        )),
                      );
                    }),
                  ],

                  if (_tiers.isEmpty && _rewards.isEmpty && _history.isEmpty)
                    Center(child: Padding(
                      padding: const EdgeInsets.all(48),
                      child: Column(children: [
                        Icon(Icons.loyalty, size: 64, color: theme.colorScheme.onSurface.withAlpha(80)),
                        const SizedBox(height: 16),
                        const Text('No loyalty data yet', style: TextStyle(fontSize: 16)),
                        const SizedBox(height: 8),
                        Text('Start earning points by booking stays!', style: theme.textTheme.bodySmall),
                      ]),
                    )),
                ],
              ),
            ),
    );
  }

  void _showRedeemDialog(Map<String, dynamic> reward) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Redeem ${reward['name']}?'),
        content: Text('This will cost ${reward['points_cost']} points.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(onPressed: () { Navigator.pop(ctx); _loadData(); }, child: const Text('Redeem')),
        ],
      ),
    );
  }

  String _formatDate(String iso) {
    try {
      final d = DateTime.parse(iso);
      return '${d.day}/${d.month}/${d.year}';
    } catch (_) {
      return iso;
    }
  }
}
