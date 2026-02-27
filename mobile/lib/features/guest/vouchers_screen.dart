import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../services/supabase_service.dart';

class VouchersScreen extends StatefulWidget {
  const VouchersScreen({super.key});
  @override State<VouchersScreen> createState() => _VouchersScreenState();
}

class _VouchersScreenState extends State<VouchersScreen> with SingleTickerProviderStateMixin {
  late TabController _tab;
  List<Map<String, dynamic>> _myVouchers = [];
  List<Map<String, dynamic>> _promoCodes = [];
  bool _loading = true;
  String? _copiedCode;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this);
    _load();
  }

  @override
  void dispose() { _tab.dispose(); super.dispose(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final [vouchers, promos] = await Future.wait([
        SupabaseService.getUserVouchers(),
        _fetchPromos(),
      ]);
      if (mounted) setState(() { _myVouchers = vouchers; _promoCodes = promos; });
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<List<Map<String, dynamic>>> _fetchPromos() async {
    try {
      final res = await SupabaseService.client
          .from('promo_codes')
          .select('*')
          .eq('is_active', true)
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(res);
    } catch (_) { return []; }
  }

  void _copyCode(String code) {
    Clipboard.setData(ClipboardData(text: code));
    setState(() => _copiedCode = code);
    Future.delayed(const Duration(seconds: 2), () { if (mounted) setState(() => _copiedCode = null); });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(children: [
          const Icon(Icons.check_circle, color: Colors.white, size: 18),
          const SizedBox(width: 8),
          Text('Code "$code" copied!'),
        ]),
        backgroundColor: Colors.green.shade600,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  String _discountLabel(String type, dynamic value) {
    final v = (value as num).toStringAsFixed(value % 1 == 0 ? 0 : 2);
    return type == 'percentage' ? '$v% OFF' : 'RM$v OFF';
  }

  bool _isExpired(String? dateStr) {
    if (dateStr == null) return false;
    return DateTime.tryParse(dateStr)?.isBefore(DateTime.now()) ?? false;
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    final available = _myVouchers.where((v) => v['is_used'] != true && !_isExpired(v['expires_at']?.toString())).toList();
    final usedOrExpired = _myVouchers.where((v) => v['is_used'] == true || _isExpired(v['expires_at']?.toString())).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Vouchers'),
        bottom: TabBar(
          controller: _tab,
          tabs: [
            Tab(text: 'My Vouchers (${available.length})'),
            const Tab(text: 'Public Codes'),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tab,
              children: [
                // Tab 1: My Vouchers
                RefreshIndicator(
                  onRefresh: _load,
                  child: _myVouchers.isEmpty
                      ? _emptyState(cs, icon: Icons.local_offer, message: 'No personal vouchers\nVouchers assigned by the hotel will appear here')
                      : ListView(
                          padding: const EdgeInsets.all(16),
                          children: [
                            if (available.isNotEmpty) ...[
                              _sectionTitle('✅ Available (${available.length})'),
                              ...available.map((v) => _VoucherCard(
                                v: v,
                                discountLabel: _discountLabel(v['discount_type'], v['discount_value']),
                                isActive: true,
                                isCopied: _copiedCode == v['code'],
                                onCopy: () => _copyCode(v['code']),
                              )),
                              const SizedBox(height: 20),
                            ],
                            if (usedOrExpired.isNotEmpty) ...[
                              _sectionTitle('📁 Used / Expired'),
                              ...usedOrExpired.map((v) => _VoucherCard(
                                v: v,
                                discountLabel: _discountLabel(v['discount_type'], v['discount_value']),
                                isActive: false,
                                isCopied: false,
                                onCopy: null,
                              )),
                            ],
                          ],
                        ),
                ),

                // Tab 2: Public Promo Codes
                RefreshIndicator(
                  onRefresh: _load,
                  child: _promoCodes.isEmpty
                      ? _emptyState(cs, icon: Icons.percent, message: 'No promo codes available\nCheck back for special offers!')
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _promoCodes.length,
                          itemBuilder: (_, i) {
                            final p = _promoCodes[i];
                            final expired = _isExpired(p['valid_to']?.toString());
                            final limitReached = p['usage_limit'] != null && (p['used_count'] ?? 0) >= p['usage_limit'];
                            final active = !expired && !limitReached;
                            return _PromoCard(
                              promo: p,
                              discountLabel: _discountLabel(p['discount_type'], p['discount_value']),
                              isActive: active,
                              isCopied: _copiedCode == p['code'],
                              onCopy: active ? () => _copyCode(p['code']) : null,
                              reason: expired ? 'Expired' : limitReached ? 'Limit reached' : null,
                            );
                          },
                        ),
                ),
              ],
            ),
    );
  }

  Widget _sectionTitle(String title) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
  );

  Widget _emptyState(ColorScheme cs, {required IconData icon, required String message}) => Center(
    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      Icon(icon, size: 56, color: cs.onSurfaceVariant.withOpacity(0.3)),
      const SizedBox(height: 12),
      Text(message, textAlign: TextAlign.center, style: TextStyle(color: cs.onSurfaceVariant, height: 1.5)),
    ]),
  );
}

class _VoucherCard extends StatelessWidget {
  final Map<String, dynamic> v;
  final String discountLabel;
  final bool isActive;
  final bool isCopied;
  final VoidCallback? onCopy;
  const _VoucherCard({required this.v, required this.discountLabel, required this.isActive, required this.isCopied, required this.onCopy});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isUsed = v['is_used'] == true;
    return Opacity(
      opacity: isActive ? 1.0 : 0.6,
      child: Card(
        margin: const EdgeInsets.only(bottom: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: BorderSide(color: isActive ? Colors.green.shade400.withOpacity(0.4) : cs.outlineVariant, width: 1.5),
        ),
        child: IntrinsicHeight(
          child: Row(
            children: [
              // Left accent bar
              Container(
                width: 6,
                decoration: BoxDecoration(
                  color: isActive ? Colors.green.shade500 : cs.onSurfaceVariant.withOpacity(0.3),
                  borderRadius: const BorderRadius.horizontal(left: Radius.circular(14)),
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: isActive ? Colors.green.withOpacity(0.1) : cs.surfaceVariant,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          v['code']?.toString() ?? '',
                          style: TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold, fontSize: 16, color: isActive ? Colors.green.shade700 : null, letterSpacing: 1.5),
                        ),
                      ),
                      const Spacer(),
                      Text(discountLabel, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: isActive ? Colors.green.shade600 : cs.onSurfaceVariant)),
                    ]),
                    const SizedBox(height: 8),
                    if (v['description'] != null) Text(v['description'], style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
                    const SizedBox(height: 6),
                    Row(children: [
                      if (v['expires_at'] != null) Row(children: [
                        Icon(Icons.schedule, size: 12, color: cs.onSurfaceVariant),
                        const SizedBox(width: 3),
                        Text(
                          isActive ? 'Expires ${_formatDate(v['expires_at'])}' : 'Expired',
                          style: TextStyle(fontSize: 11, color: isActive ? cs.onSurfaceVariant : Colors.red),
                        ),
                      ]),
                      const Spacer(),
                      if (isUsed)
                        Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3), decoration: BoxDecoration(color: cs.surfaceVariant, borderRadius: BorderRadius.circular(6)), child: const Text('Used', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)))
                      else if (onCopy != null)
                        OutlinedButton.icon(
                          onPressed: onCopy,
                          icon: Icon(isCopied ? Icons.check : Icons.copy, size: 14),
                          label: Text(isCopied ? 'Copied!' : 'Copy Code', style: const TextStyle(fontSize: 12)),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            minimumSize: Size.zero,
                            foregroundColor: isCopied ? Colors.green : null,
                          ),
                        ),
                    ]),
                  ]),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(dynamic d) {
    final dt = DateTime.tryParse(d.toString());
    if (dt == null) return '';
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}

class _PromoCard extends StatelessWidget {
  final Map<String, dynamic> promo;
  final String discountLabel;
  final bool isActive;
  final bool isCopied;
  final VoidCallback? onCopy;
  final String? reason;
  const _PromoCard({required this.promo, required this.discountLabel, required this.isActive, required this.isCopied, required this.onCopy, this.reason});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Opacity(
      opacity: isActive ? 1.0 : 0.55,
      child: Card(
        margin: const EdgeInsets.only(bottom: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: BorderSide(color: isActive ? cs.primary.withOpacity(0.3) : cs.outlineVariant, width: 1.5),
        ),
        child: IntrinsicHeight(child: Row(children: [
          Container(
            width: 6,
            decoration: BoxDecoration(
              color: isActive ? cs.primary : cs.onSurfaceVariant.withOpacity(0.3),
              borderRadius: const BorderRadius.horizontal(left: Radius.circular(14)),
            ),
          ),
          Expanded(child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: isActive ? cs.primaryContainer : cs.surfaceVariant, borderRadius: BorderRadius.circular(6)),
                  child: Text(promo['code']?.toString() ?? '', style: TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold, fontSize: 16, color: isActive ? cs.primary : null, letterSpacing: 1.5)),
                ),
                const Spacer(),
                Text(discountLabel, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: isActive ? cs.primary : cs.onSurfaceVariant)),
              ]),
              const SizedBox(height: 8),
              if (promo['description'] != null) Text(promo['description'], style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
              const SizedBox(height: 6),
              Row(children: [
                if (promo['valid_to'] != null) Row(children: [
                  Icon(Icons.schedule, size: 12, color: cs.onSurfaceVariant),
                  const SizedBox(width: 3),
                  Text('Until ${_fmtDate(promo['valid_to'])}', style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
                ]),
                if (promo['usage_limit'] != null) Padding(
                  padding: const EdgeInsets.only(left: 10),
                  child: Text('${promo['used_count']}/${promo['usage_limit']} used', style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
                ),
                const Spacer(),
                if (reason != null)
                  Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3), decoration: BoxDecoration(color: cs.errorContainer, borderRadius: BorderRadius.circular(6)), child: Text(reason!, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: cs.error)))
                else
                  OutlinedButton.icon(
                    onPressed: onCopy,
                    icon: Icon(isCopied ? Icons.check : Icons.copy, size: 14),
                    label: Text(isCopied ? 'Copied!' : 'Copy Code', style: const TextStyle(fontSize: 12)),
                    style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6), minimumSize: Size.zero, foregroundColor: isCopied ? Colors.green : null),
                  ),
              ]),
            ]),
          )),
        ])),
      ),
    );
  }

  String _fmtDate(dynamic d) {
    final dt = DateTime.tryParse(d.toString());
    if (dt == null) return '';
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}
