import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../services/supabase_service.dart';

class MyRewardScreen extends StatefulWidget {
  const MyRewardScreen({super.key});
  @override State<MyRewardScreen> createState() => _MyRewardScreenState();
}

class _MyRewardScreenState extends State<MyRewardScreen> with SingleTickerProviderStateMixin {
  late TabController _tab;
  bool _loading = true;
  List<Map<String, dynamic>> _available = [];
  List<Map<String, dynamic>> _redeemed = [];
  int _totalPoints = 0;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this);
    _loadData();
  }

  @override
  void dispose() { _tab.dispose(); super.dispose(); }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        SupabaseService.getLoyaltyRewards(),
        SupabaseService.getLoyaltyPoints(),
      ]);
      final rewards = results[0] as List<Map<String, dynamic>>;
      final history = results[1] as List<Map<String, dynamic>>;
      final redeemed = history.where((h) => h['type'] == 'redemption').toList();
      final total = history.fold<int>(0, (s, p) => s + ((p['points'] as num?)?.toInt() ?? 0));
      if (mounted) setState(() {
        _available = rewards;
        _redeemed = redeemed;
        _totalPoints = total;
        _loading = false;
      });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _redeemReward(Map<String, dynamic> reward) async {
    final name = reward['name'] ?? 'Reward';
    final cost = ((reward['points_cost'] ?? 0) as num).toInt();
    final id = reward['id']?.toString() ?? '';
    final cs = Theme.of(context).colorScheme;

    if (_totalPoints < cost) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Need $cost pts but only have $_totalPoints'),
        backgroundColor: Colors.red.shade600,
        behavior: SnackBarBehavior.floating,
      ));
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Redeem Reward'),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: cs.primaryContainer.withOpacity(0.3), borderRadius: BorderRadius.circular(14)),
            child: Column(children: [
              Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16), textAlign: TextAlign.center),
              const SizedBox(height: 8),
              Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(Icons.star, size: 18, color: Colors.amber.shade600),
                const SizedBox(width: 4),
                Text('$cost points', style: TextStyle(fontWeight: FontWeight.w600, color: cs.primary)),
              ]),
            ]),
          ),
          const SizedBox(height: 12),
          Text('After redeeming: ${_totalPoints - cost} pts remaining', style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant), textAlign: TextAlign.center),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Redeem')),
        ],
      ),
    );

    if (confirmed != true) return;
    final success = await SupabaseService.redeemReward(id, name, cost);
    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Row(children: [const Icon(Icons.check_circle, color: Colors.white), const SizedBox(width: 8), Expanded(child: Text('Redeemed "$name"!'))]),
          backgroundColor: Colors.green.shade600, behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ));
        _loadData();
        _tab.animateTo(1); // Switch to "My Rewards" tab
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: const Text('Redemption failed. Try again.'),
          backgroundColor: Colors.red.shade600, behavior: SnackBarBehavior.floating,
        ));
      }
    }
  }

  void _showUseRewardQR(Map<String, dynamic> redemption) {
    final cs = Theme.of(context).colorScheme;
    final rewardName = redemption['description']?.toString().replaceFirst('Redeemed: ', '') ?? 'Reward';
    final redemptionId = redemption['id']?.toString() ?? '';
    // QR data encodes the redemption for hotel staff to scan
    final qrData = jsonEncode({'type': 'reward_redemption', 'id': redemptionId, 'reward': rewardName, 'user': SupabaseService.currentUser?.id});

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(32),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 24),
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(Icons.qr_code, size: 28, color: cs.primary),
            const SizedBox(width: 10),
            const Text('Use This Reward', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          ]),
          const SizedBox(height: 8),
          Text(rewardName, style: TextStyle(fontSize: 16, color: cs.onSurfaceVariant), textAlign: TextAlign.center),
          const SizedBox(height: 24),
          // QR code representation (using styled container since qr_flutter not always available)
          Container(
            width: 220, height: 220,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 16, offset: const Offset(0, 4))],
            ),
            child: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(Icons.qr_code_2, size: 140, color: Colors.black87),
              Text(redemptionId.substring(0, 8).toUpperCase(), style: const TextStyle(fontFamily: 'monospace', fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 2)),
            ])),
          ),
          const SizedBox(height: 16),
          Text('Show this QR code to hotel staff', style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant)),
          Text('to redeem your reward', style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant)),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(color: cs.primaryContainer, borderRadius: BorderRadius.circular(20)),
            child: Text('ID: ${redemptionId.substring(0, 8).toUpperCase()}', style: TextStyle(fontFamily: 'monospace', fontSize: 12, fontWeight: FontWeight.w700, color: cs.primary)),
          ),
          const SizedBox(height: 24),
          Row(children: [
            Expanded(child: OutlinedButton.icon(
              onPressed: () { Clipboard.setData(ClipboardData(text: redemptionId)); Navigator.pop(ctx); ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Copied!'), behavior: SnackBarBehavior.floating)); },
              icon: const Icon(Icons.copy, size: 16),
              label: const Text('Copy ID'),
            )),
            const SizedBox(width: 12),
            Expanded(child: FilledButton.icon(
              onPressed: () => Navigator.pop(ctx),
              icon: const Icon(Icons.check, size: 16),
              label: const Text('Done'),
            )),
          ]),
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Rewards', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [IconButton(icon: const Icon(Icons.refresh), onPressed: _loadData)],
        bottom: TabBar(
          controller: _tab,
          tabs: const [
            Tab(icon: Icon(Icons.card_giftcard_outlined), text: 'Available'),
            Tab(icon: Icon(Icons.redeem), text: 'My Rewards'),
          ],
        ),
      ),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : TabBarView(controller: _tab, children: [
            // ─── TAB 1: Available rewards to redeem ───────────────────
            RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Points banner
                  Container(
                    padding: const EdgeInsets.all(16),
                    margin: const EdgeInsets.only(bottom: 20),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: [cs.primary, cs.primary.withOpacity(0.7)]),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(children: [
                      Icon(Icons.star, color: Colors.amber.shade300, size: 32),
                      const SizedBox(width: 12),
                      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('$_totalPoints', style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold, height: 1)),
                        const Text('Available Points', style: TextStyle(color: Colors.white70, fontSize: 13)),
                      ]),
                    ]),
                  ),

                  if (_available.isEmpty)
                    Center(child: Column(children: [
                      const SizedBox(height: 40),
                      Icon(Icons.card_giftcard, size: 60, color: cs.onSurfaceVariant.withOpacity(0.3)),
                      const SizedBox(height: 12),
                      Text('No rewards available', style: TextStyle(color: cs.onSurfaceVariant)),
                    ]))
                  else
                    ..._available.map((r) {
                      final cost = ((r['points_cost'] ?? 0) as num).toInt();
                      final canRedeem = _totalPoints >= cost;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: canRedeem ? cs.primary.withOpacity(0.3) : cs.outlineVariant.withOpacity(0.4)),
                          color: cs.surface,
                          boxShadow: canRedeem ? [BoxShadow(color: cs.primary.withOpacity(0.08), blurRadius: 8, offset: const Offset(0, 2))] : null,
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: canRedeem ? cs.primaryContainer : cs.surfaceVariant,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(Icons.card_giftcard, color: canRedeem ? cs.primary : cs.onSurfaceVariant, size: 24),
                            ),
                            const SizedBox(width: 14),
                            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(r['name'] ?? 'Reward', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                              const SizedBox(height: 4),
                              Text(r['description'] ?? '', style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant), maxLines: 2, overflow: TextOverflow.ellipsis),
                              const SizedBox(height: 10),
                              Row(children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: canRedeem ? Colors.amber.withOpacity(0.15) : cs.surfaceVariant,
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                                    Icon(Icons.star, size: 14, color: canRedeem ? Colors.amber.shade700 : cs.onSurfaceVariant),
                                    const SizedBox(width: 4),
                                    Text('$cost pts', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: canRedeem ? Colors.amber.shade700 : cs.onSurfaceVariant)),
                                  ]),
                                ),
                                const Spacer(),
                                FilledButton(
                                  onPressed: canRedeem ? () => _redeemReward(r) : null,
                                  style: FilledButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                    textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                                  ),
                                  child: const Text('Redeem'),
                                ),
                              ]),
                            ])),
                          ]),
                        ),
                      );
                    }),
                ],
              ),
            ),

            // ─── TAB 2: Already redeemed rewards ───────────────────────
            RefreshIndicator(
              onRefresh: _loadData,
              child: _redeemed.isEmpty
                ? ListView(children: [
                    const SizedBox(height: 80),
                    Center(child: Column(children: [
                      Icon(Icons.redeem, size: 60, color: cs.onSurfaceVariant.withOpacity(0.3)),
                      const SizedBox(height: 12),
                      const Text('No redeemed rewards yet', style: TextStyle(fontWeight: FontWeight.w500)),
                      const SizedBox(height: 4),
                      Text('Redeem rewards from the Available tab', style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant)),
                    ])),
                  ])
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _redeemed.length,
                    itemBuilder: (_, i) {
                      final r = _redeemed[i];
                      final name = r['description']?.toString().replaceFirst('Redeemed: ', '') ?? 'Reward';
                      final pts = ((r['points'] as num?)?.toInt() ?? 0).abs();
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: cs.outlineVariant.withOpacity(0.4)),
                          color: cs.surface,
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          leading: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(color: Colors.green.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                            child: const Icon(Icons.redeem, color: Colors.green, size: 24),
                          ),
                          title: Text(name, style: const TextStyle(fontWeight: FontWeight.w600)),
                          subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            const SizedBox(height: 2),
                            Text('${pts} pts · ${_fmtDate(r['created_at'] ?? '')}', style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
                          ]),
                          trailing: FilledButton.icon(
                            onPressed: () => _showUseRewardQR(r),
                            icon: const Icon(Icons.qr_code, size: 16),
                            label: const Text('Use'),
                            style: FilledButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              textStyle: const TextStyle(fontSize: 12),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
            ),
          ]),
    );
  }

  String _fmtDate(String iso) { try { final d = DateTime.parse(iso).toLocal(); return '${d.day}/${d.month}/${d.year}'; } catch (_) { return iso; } }
}
