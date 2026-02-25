import 'package:flutter/material.dart';
import '../../services/supabase_service.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});
  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  bool _loading = true;
  List<Map<String, dynamic>> _tickets = [];
  Map<String, dynamic>? _selected;
  List<Map<String, dynamic>> _messages = [];
  final _msgController = TextEditingController();
  final _subjectController = TextEditingController();
  final _descController = TextEditingController();
  String _category = 'general';

  @override
  void initState() {
    super.initState();
    _loadTickets();
  }

  @override
  void dispose() {
    _msgController.dispose();
    _subjectController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _loadTickets() async {
    setState(() => _loading = true);
    try {
      final tickets = await SupabaseService.getSupportTickets();
      setState(() { _tickets = tickets; _loading = false; });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _selectTicket(Map<String, dynamic> ticket) async {
    setState(() => _selected = ticket);
    try {
      final msgs = await SupabaseService.getTicketMessages(ticket['id']);
      setState(() => _messages = msgs);
    } catch (_) {}
  }

  Future<void> _sendReply() async {
    final text = _msgController.text.trim();
    if (text.isEmpty || _selected == null) return;
    _msgController.clear();
    try {
      await SupabaseService.sendTicketMessage(_selected!['id'], text);
      await _selectTicket(_selected!);
    } catch (_) {}
  }

  Future<void> _createTicket() async {
    final subject = _subjectController.text.trim();
    final desc = _descController.text.trim();
    if (subject.isEmpty || desc.isEmpty) return;
    try {
      await SupabaseService.createSupportTicket(subject: subject, description: desc, category: _category);
      _subjectController.clear();
      _descController.clear();
      Navigator.pop(context);
      _loadTickets();
    } catch (_) {}
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'open': return Colors.orange;
      case 'in_progress': return Colors.blue;
      case 'resolved': return Colors.green;
      case 'closed': return Colors.grey;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_selected != null) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => setState(() { _selected = null; _messages = []; })),
          title: Text(_selected!['subject'] ?? 'Ticket'),
        ),
        body: Column(
          children: [
            Expanded(
              child: _messages.isEmpty
                  ? const Center(child: Text('No messages yet'))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _messages.length,
                      itemBuilder: (_, i) {
                        final msg = _messages[i];
                        final isAdmin = msg['role'] == 'admin';
                        return Align(
                          alignment: isAdmin ? Alignment.centerLeft : Alignment.centerRight,
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                            constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                            decoration: BoxDecoration(
                              color: isAdmin ? theme.colorScheme.surfaceVariant : theme.colorScheme.primary,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(msg['message'] ?? '', style: TextStyle(color: isAdmin ? null : Colors.white)),
                                const SizedBox(height: 4),
                                Text(
                                  _formatTime(msg['created_at'] ?? ''),
                                  style: TextStyle(fontSize: 10, color: isAdmin ? theme.colorScheme.onSurface.withAlpha(120) : Colors.white70),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                border: Border(top: BorderSide(color: theme.dividerColor)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _msgController,
                      decoration: const InputDecoration(hintText: 'Type a message...', border: OutlineInputBorder(), isDense: true, contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _sendReply(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(icon: const Icon(Icons.send), onPressed: _sendReply),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Support')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateDialog,
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
                        Icon(Icons.support_agent, size: 64, color: theme.colorScheme.onSurface.withAlpha(80)),
                        const SizedBox(height: 16),
                        const Text('No support tickets', style: TextStyle(fontSize: 16)),
                        const SizedBox(height: 8),
                        Text('Tap + to create a new ticket', style: theme.textTheme.bodySmall),
                      ])),
                    ])
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _tickets.length,
                      itemBuilder: (_, i) {
                        final t = _tickets[i];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: ListTile(
                            onTap: () => _selectTicket(t),
                            leading: CircleAvatar(
                              backgroundColor: _statusColor(t['status'] ?? 'open'),
                              child: const Icon(Icons.confirmation_number, color: Colors.white, size: 20),
                            ),
                            title: Text(t['subject'] ?? 'Ticket', maxLines: 1, overflow: TextOverflow.ellipsis),
                            subtitle: Text('${t['category'] ?? 'general'} • ${_formatDate(t['created_at'] ?? '')}', style: theme.textTheme.bodySmall),
                            trailing: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: _statusColor(t['status'] ?? 'open').withAlpha(30),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text((t['status'] ?? 'open').toString().replaceAll('_', ' '),
                                style: TextStyle(fontSize: 11, color: _statusColor(t['status'] ?? 'open'), fontWeight: FontWeight.w600)),
                            ),
                          ),
                        );
                      },
                    ),
            ),
    );
  }

  void _showCreateDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          const Text('New Support Ticket', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          TextField(controller: _subjectController, decoration: const InputDecoration(labelText: 'Subject', border: OutlineInputBorder())),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _category,
            decoration: const InputDecoration(labelText: 'Category', border: OutlineInputBorder()),
            items: ['general', 'billing', 'room_issue', 'service', 'complaint', 'other']
                .map((c) => DropdownMenuItem(value: c, child: Text(c.replaceAll('_', ' ').toUpperCase())))
                .toList(),
            onChanged: (v) => setState(() => _category = v ?? 'general'),
          ),
          const SizedBox(height: 12),
          TextField(controller: _descController, maxLines: 4, decoration: const InputDecoration(labelText: 'Description', border: OutlineInputBorder(), alignLabelWithHint: true)),
          const SizedBox(height: 16),
          FilledButton(onPressed: _createTicket, child: const Text('Submit Ticket')),
        ]),
      ),
    );
  }

  String _formatDate(String iso) {
    try {
      final d = DateTime.parse(iso);
      return '${d.day}/${d.month}/${d.year}';
    } catch (_) { return iso; }
  }

  String _formatTime(String iso) {
    try {
      final d = DateTime.parse(iso);
      return '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
    } catch (_) { return iso; }
  }
}
