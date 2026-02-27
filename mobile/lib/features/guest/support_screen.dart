import 'package:flutter/material.dart';
import '../../services/supabase_service.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});
  @override State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  bool _loading = true;
  List<Map<String, dynamic>> _tickets = [];
  Map<String, dynamic>? _selected;
  List<Map<String, dynamic>> _messages = [];
  final _msgC = TextEditingController();
  final _subjectC = TextEditingController();
  final _descC = TextEditingController();
  String _category = 'general';
  bool _creating = false;

  @override
  void initState() { super.initState(); _loadTickets(); }

  @override
  void dispose() { _msgC.dispose(); _subjectC.dispose(); _descC.dispose(); super.dispose(); }

  Future<void> _loadTickets() async {
    setState(() => _loading = true);
    try {
      _tickets = await SupabaseService.getSupportTickets();
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _selectTicket(Map<String, dynamic> ticket) async {
    setState(() => _selected = ticket);
    try {
      final msgs = await SupabaseService.getTicketMessages(ticket['id']);
      if (mounted) setState(() => _messages = msgs);
    } catch (_) {}
  }

  Future<void> _sendReply() async {
    final text = _msgC.text.trim();
    if (text.isEmpty || _selected == null) return;
    _msgC.clear();
    try {
      await SupabaseService.sendTicketMessage(_selected!['id'], text);
      await _selectTicket(_selected!);
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to send message')));
    }
  }

  Future<void> _createTicket() async {
    final subject = _subjectC.text.trim();
    final desc = _descC.text.trim();
    if (subject.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a subject')));
      return;
    }
    if (desc.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a description')));
      return;
    }

    setState(() => _creating = true);
    try {
      await SupabaseService.createSupportTicket(subject: subject, description: desc, category: _category);
      _subjectC.clear();
      _descC.clear();
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(children: [Icon(Icons.check_circle, color: Colors.white, size: 18), SizedBox(width: 8), Text('Ticket created successfully!')]),
            backgroundColor: Colors.green.shade600,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
        _loadTickets();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(children: [const Icon(Icons.error, color: Colors.white, size: 18), const SizedBox(width: 8), Expanded(child: Text('Failed to create ticket: ${e.toString().split(':').last.trim()}'))]),
            backgroundColor: Colors.red.shade600,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    }
    if (mounted) setState(() => _creating = false);
  }

  Color _statusColor(String status) => switch (status) {
    'open' => const Color(0xFFF59E0B),
    'in_progress' => const Color(0xFF3B82F6),
    'resolved' => const Color(0xFF22C55E),
    'closed' => const Color(0xFF6B7280),
    _ => const Color(0xFF6B7280),
  };

  IconData _statusIcon(String status) => switch (status) {
    'open' => Icons.fiber_new,
    'in_progress' => Icons.hourglass_top,
    'resolved' => Icons.check_circle,
    'closed' => Icons.lock,
    _ => Icons.help,
  };

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    // Ticket detail / chat view
    if (_selected != null) {
      final status = _selected!['status'] ?? 'open';
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => setState(() { _selected = null; _messages = []; })),
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(_selected!['subject'] ?? 'Ticket', style: const TextStyle(fontSize: 15), maxLines: 1, overflow: TextOverflow.ellipsis),
              Row(children: [
                Container(width: 6, height: 6, decoration: BoxDecoration(shape: BoxShape.circle, color: _statusColor(status))),
                const SizedBox(width: 4),
                Text(status.toString().replaceAll('_', ' '), style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
              ]),
            ],
          ),
        ),
        body: Column(children: [
          Expanded(
            child: _messages.isEmpty
              ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.forum_outlined, size: 48, color: cs.onSurfaceVariant.withOpacity(0.3)),
                  const SizedBox(height: 8),
                  Text('No messages yet', style: TextStyle(color: cs.onSurfaceVariant)),
                ]))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _messages.length,
                  itemBuilder: (_, i) {
                    final msg = _messages[i];
                    final isAdmin = msg['role'] == 'admin';
                    return Align(
                      alignment: isAdmin ? Alignment.centerLeft : Alignment.centerRight,
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
                        decoration: BoxDecoration(
                          color: isAdmin ? cs.surfaceVariant : cs.primary,
                          borderRadius: BorderRadius.only(
                            topLeft: const Radius.circular(16),
                            topRight: const Radius.circular(16),
                            bottomLeft: Radius.circular(isAdmin ? 4 : 16),
                            bottomRight: Radius.circular(isAdmin ? 16 : 4),
                          ),
                        ),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          if (isAdmin) Padding(
                            padding: const EdgeInsets.only(bottom: 4),
                            child: Text('Support Agent', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: cs.primary)),
                          ),
                          Text(msg['message'] ?? '', style: TextStyle(color: isAdmin ? cs.onSurface : Colors.white, height: 1.4)),
                          const SizedBox(height: 4),
                          Text(_fmtTime(msg['created_at'] ?? ''), style: TextStyle(fontSize: 10, color: isAdmin ? cs.onSurfaceVariant : Colors.white60)),
                        ]),
                      ),
                    );
                  },
                ),
          ),
          Container(
            padding: const EdgeInsets.fromLTRB(12, 8, 8, 8),
            decoration: BoxDecoration(
              color: cs.surface,
              border: Border(top: BorderSide(color: cs.outlineVariant.withOpacity(0.5))),
            ),
            child: SafeArea(
              child: Row(children: [
                Expanded(
                  child: TextField(
                    controller: _msgC,
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      filled: true,
                      fillColor: cs.surfaceVariant.withOpacity(0.3),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      isDense: true,
                    ),
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _sendReply(),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [cs.primary, cs.primary.withOpacity(0.8)]),
                    shape: BoxShape.circle,
                  ),
                  child: IconButton(icon: Icon(Icons.send, color: cs.onPrimary, size: 20), onPressed: _sendReply),
                ),
              ]),
            ),
          ),
        ]),
      );
    }

    // Ticket list view
    return Scaffold(
      appBar: AppBar(
        title: const Text('Support', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadTickets),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateSheet,
        icon: const Icon(Icons.add),
        label: const Text('New Ticket'),
      ),
      body: _loading
        ? const Center(child: CircularProgressIndicator())
        : RefreshIndicator(
            onRefresh: _loadTickets,
            child: _tickets.isEmpty
              ? ListView(children: [
                  const SizedBox(height: 120),
                  Center(child: Column(children: [
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: cs.primaryContainer.withOpacity(0.3),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.support_agent, size: 48, color: cs.primary),
                    ),
                    const SizedBox(height: 16),
                    const Text('No support tickets', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
                    const SizedBox(height: 4),
                    Text('Tap + to create a new ticket', style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant)),
                  ])),
                ])
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _tickets.length,
                  itemBuilder: (_, i) {
                    final t = _tickets[i];
                    final status = t['status'] ?? 'open';
                    final sc = _statusColor(status);
                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      child: Material(
                        borderRadius: BorderRadius.circular(14),
                        color: cs.surface,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(14),
                          onTap: () => _selectTicket(t),
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: cs.outlineVariant.withOpacity(0.5)),
                            ),
                            child: Row(children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: sc.withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(_statusIcon(status), size: 20, color: sc),
                              ),
                              const SizedBox(width: 14),
                              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Text(t['subject'] ?? 'Ticket', style: const TextStyle(fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis),
                                const SizedBox(height: 4),
                                Row(children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(color: cs.surfaceVariant.withOpacity(0.5), borderRadius: BorderRadius.circular(6)),
                                    child: Text((t['category'] ?? 'general').toString().replaceAll('_', ' '), style: TextStyle(fontSize: 10, color: cs.onSurfaceVariant, fontWeight: FontWeight.w500)),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(_fmtDate(t['created_at'] ?? ''), style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
                                ]),
                              ])),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(color: sc.withOpacity(0.12), borderRadius: BorderRadius.circular(20)),
                                child: Text(status.toString().replaceAll('_', ' '), style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: sc)),
                              ),
                            ]),
                          ),
                        ),
                      ),
                    );
                  },
                ),
          ),
    );
  }

  void _showCreateSheet() {
    _category = 'general';
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        return StatefulBuilder(builder: (ctx, setSheetState) {
          final cs = Theme.of(ctx).colorScheme;
          return Padding(
            padding: EdgeInsets.only(left: 24, right: 24, top: 8, bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Center(child: Container(width: 40, height: 4, margin: const EdgeInsets.only(bottom: 16), decoration: BoxDecoration(color: cs.outlineVariant, borderRadius: BorderRadius.circular(2)))),
              Row(children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: cs.primaryContainer, borderRadius: BorderRadius.circular(10)),
                  child: Icon(Icons.support_agent, color: cs.primary, size: 20),
                ),
                const SizedBox(width: 12),
                const Text('New Support Ticket', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ]),
              const SizedBox(height: 20),
              TextField(controller: _subjectC, decoration: const InputDecoration(labelText: 'Subject', prefixIcon: Icon(Icons.subject))),
              const SizedBox(height: 14),
              DropdownButtonFormField<String>(
                value: _category,
                decoration: const InputDecoration(labelText: 'Category', prefixIcon: Icon(Icons.category)),
                items: ['general', 'billing', 'room_issue', 'service', 'complaint', 'other']
                  .map((c) => DropdownMenuItem(value: c, child: Text(c.replaceAll('_', ' ').toUpperCase())))
                  .toList(),
                onChanged: (v) => setSheetState(() => _category = v ?? 'general'),
              ),
              const SizedBox(height: 14),
              TextField(controller: _descC, maxLines: 4, decoration: const InputDecoration(labelText: 'Description', alignLabelWithHint: true, prefixIcon: Padding(padding: EdgeInsets.only(bottom: 60), child: Icon(Icons.description)))),
              const SizedBox(height: 20),
              SizedBox(
                height: 50,
                child: FilledButton(
                  onPressed: _creating ? null : _createTicket,
                  child: _creating
                    ? const Row(mainAxisSize: MainAxisSize.min, children: [SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)), SizedBox(width: 8), Text('Submitting...')])
                    : const Text('Submit Ticket'),
                ),
              ),
            ]),
          );
        });
      },
    );
  }

  String _fmtDate(String iso) { try { final d = DateTime.parse(iso); return '${d.day}/${d.month}/${d.year}'; } catch (_) { return iso; } }
  String _fmtTime(String iso) { try { final d = DateTime.parse(iso); return '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}'; } catch (_) { return iso; } }
}
