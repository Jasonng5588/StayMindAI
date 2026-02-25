import 'package:flutter/material.dart';
import '../../services/supabase_service.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});
  @override State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _msgC = TextEditingController();
  final _scrollC = ScrollController();
  final List<Map<String, String>> _messages = [{'role': 'model', 'text': 'Welcome to Grand Azure Resort & Spa! ðŸ–ï¸ I\'m your AI Concierge. Ask me about rooms, dining, spa, pool, activities, or anything else about the hotel!'}];
  bool _typing = false;

  // Quick suggestions
  final _suggestions = ['What rooms are available?', 'Tell me about the spa', 'Restaurant hours?', 'Pool & beach info', 'Airport transfer?', 'Check-in time?'];

  String _getLocalReply(String question) {
    final q = question.toLowerCase();
    if (q.contains('room') || q.contains('book') || q.contains('stay')) {
      return 'We have 4 room types:\n\nðŸ¨ **Standard Room** - \$179/night (Queen bed, 28mÂ²)\nðŸŒŠ **Ocean View Deluxe** - \$299/night (King bed, 42mÂ², balcony)\nðŸŒ´ **Garden Suite** - \$449/night (65mÂ², jacuzzi, living room)\nðŸ‘‘ **Presidential Suite** - \$799/night (120mÂ², butler service)\n\nAll rooms include free Wi-Fi, smart TV, and AC. Would you like to book?';
    }
    if (q.contains('spa') || q.contains('massage') || q.contains('wellness')) {
      return 'Our Azure Wellness Spa offers:\n\nðŸ’† Full-body massage - \$120 (60min)\nðŸ§– Hot stone therapy - \$150 (90min)\nðŸŒ¿ Aromatherapy session - \$95 (45min)\nðŸ’… Manicure & Pedicure - \$60\nðŸ§˜ Yoga classes (daily 7am)\n\nOpen daily 8AM - 10PM. Would you like to book a treatment?';
    }
    if (q.contains('restaurant') || q.contains('dine') || q.contains('food') || q.contains('eat') || q.contains('breakfast')) {
      return 'Our dining options:\n\nðŸ½ï¸ **Azure Restaurant** - Fine dining, 6PMâ€“11PM\nâ˜• **Sunrise CafÃ©** - Breakfast & brunch, 6AMâ€“2PM\nðŸ¸ **Skyline Rooftop Bar** - Cocktails & tapas, 4PMâ€“1AM\nðŸ–ï¸ **Beach Grill** - Seafood & BBQ, 11AMâ€“9PM\n\nRoom service available 24/7. Breakfast is included with Garden Suite and Presidential Suite.';
    }
    if (q.contains('pool') || q.contains('beach') || q.contains('swim')) {
      return 'Pool & Beach facilities:\n\nðŸŠ **Infinity Pool** - Open 7AMâ€“9PM, heated\nðŸ–ï¸ **Private Beach** - Complimentary sun loungers & umbrellas\nðŸ§’ **Kids Pool** - Shallow pool with water features\n\nPool towels available at the towel station. Poolside drink service from 10AMâ€“6PM.';
    }
    if (q.contains('airport') || q.contains('transfer') || q.contains('taxi') || q.contains('transport')) {
      return 'Transportation options:\n\nâœˆï¸ **Airport Transfer** - \$45 one-way (sedan), \$70 (luxury SUV)\nðŸš• **Hotel Shuttle** - Free to downtown Miami, hourly from 9AMâ€“9PM\nðŸš— **Valet Parking** - \$25/day\n\nPlease book transfers 24 hours in advance through reception or this chat.';
    }
    if (q.contains('check-in') || q.contains('check in') || q.contains('check-out') || q.contains('check out') || q.contains('time')) {
      return 'Important times:\n\nðŸ•’ **Check-in**: 3:00 PM\nðŸ• **Check-out**: 11:00 AM\nâœ¨ **Early check-in**: Available from 12PM (subject to availability, \$30)\nâ° **Late check-out**: Until 2PM (\$40) or 5PM (\$80)\n\nPlease contact front desk at 555-0100 for special arrangements.';
    }
    if (q.contains('parking') || q.contains('car')) {
      return 'Parking options:\n\nðŸ…¿ï¸ **Self-parking** - \$15/day\nðŸš— **Valet parking** - \$25/day\nâš¡ **EV charging** - 4 stations available (complimentary)\n\nParking is located at level B1-B3 with elevator access to the lobby.';
    }
    return 'Thank you for your question! At Grand Azure Resort & Spa, we offer luxury accommodation, a full-service spa, multiple dining venues, infinity pool, private beach, and more.\n\nYou can ask me about:\nâ€¢ Rooms & booking\nâ€¢ Spa & wellness\nâ€¢ Restaurants & dining\nâ€¢ Pool & beach\nâ€¢ Transportation\nâ€¢ Check-in/out times\n\nHow can I help you?';
  }

  Future<void> _send([String? preset]) async {
    final text = (preset ?? _msgC.text).trim();
    if (text.isEmpty) return;
    _msgC.clear();
    setState(() { _messages.add({'role': 'user', 'text': text}); _typing = true; });
    _scrollToBottom();

    // Try Supabase AI first, fallback to local
    String reply;
    try {
      reply = await SupabaseService.chatWithAI('11111111-1111-1111-1111-111111111111', text, _messages.sublist(0, _messages.length - 1)).timeout(const Duration(seconds: 5));
    } catch (_) {
      reply = _getLocalReply(text);
    }
    setState(() { _messages.add({'role': 'model', 'text': reply}); _typing = false; });
    _scrollToBottom();
  }

  void _scrollToBottom() => Future.delayed(const Duration(milliseconds: 100), () { if (_scrollC.hasClients) _scrollC.animateTo(_scrollC.position.maxScrollExtent, duration: const Duration(milliseconds: 300), curve: Curves.easeOut); });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('AI Concierge'), actions: [IconButton(icon: const Icon(Icons.delete_outline), onPressed: () => setState(() { _messages.clear(); _messages.add({'role': 'model', 'text': 'Welcome back! How can I help you? ðŸ–ï¸'}); }))]),
      body: Column(children: [
        Expanded(child: ListView.builder(controller: _scrollC, padding: const EdgeInsets.all(16), itemCount: _messages.length + (_typing ? 1 : 0), itemBuilder: (_, i) {
          if (i == _messages.length) return Align(alignment: Alignment.centerLeft, child: Container(margin: const EdgeInsets.only(top: 8), padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: cs.surfaceVariant, borderRadius: BorderRadius.circular(16)), child: const SizedBox(width: 40, height: 16, child: Center(child: Text('...', style: TextStyle(fontSize: 18))))));
          final msg = _messages[i];
          final isUser = msg['role'] == 'user';
          return Align(
            alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
            child: Container(
              constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(color: isUser ? cs.primary : cs.surfaceVariant, borderRadius: BorderRadius.only(topLeft: const Radius.circular(16), topRight: const Radius.circular(16), bottomLeft: Radius.circular(isUser ? 16 : 4), bottomRight: Radius.circular(isUser ? 4 : 16))),
              child: Text(msg['text'] ?? '', style: TextStyle(color: isUser ? cs.onPrimary : cs.onSurface, height: 1.4)),
            ),
          );
        })),

        // Quick suggestions (only show when few messages)
        if (_messages.length < 3) SizedBox(height: 40, child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: _suggestions.length,
          separatorBuilder: (_, __) => const SizedBox(width: 8),
          itemBuilder: (_, i) => ActionChip(label: Text(_suggestions[i], style: const TextStyle(fontSize: 12)), onPressed: () => _send(_suggestions[i])),
        )),

        Container(
          padding: const EdgeInsets.fromLTRB(16, 8, 8, 8),
          decoration: BoxDecoration(color: cs.surface, border: Border(top: BorderSide(color: cs.outlineVariant))),
          child: SafeArea(child: Row(children: [
            Expanded(child: TextField(controller: _msgC, decoration: const InputDecoration(hintText: 'Ask about the hotel...', border: InputBorder.none), textInputAction: TextInputAction.send, onSubmitted: (_) => _send())),
            IconButton.filled(onPressed: () => _send(), icon: const Icon(Icons.send, size: 18)),
          ])),
        ),
      ]),
    );
  }
}

