import 'package:flutter/material.dart';
import '../../services/supabase_service.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});
  @override State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _msgC = TextEditingController();
  final _scrollC = ScrollController();
  final List<Map<String, String>> _messages = [
    {'role': 'model', 'text': 'Welcome to Grand Azure Resort & Spa! \u{1F3D6}\uFE0F I\'m your AI Concierge. Ask me about rooms, dining, spa, pool, activities, or anything else about the hotel!'}
  ];
  bool _typing = false;

  // Quick suggestions
  final _suggestions = [
    'What rooms are available?',
    'Tell me about the spa',
    'Restaurant hours?',
    'Pool & beach info',
    'Airport transfer?',
    'Check-in time?',
  ];

  String _getLocalReply(String question) {
    final q = question.toLowerCase();
    if (q.contains('room') || q.contains('book') || q.contains('stay')) {
      return 'We have 4 room types:\n\n\u{1F3E8} **Standard Room** - \$179/night (Queen bed, 28m\u00B2)\n\u{1F30A} **Ocean View Deluxe** - \$299/night (King bed, 42m\u00B2, balcony)\n\u{1F334} **Garden Suite** - \$449/night (65m\u00B2, jacuzzi, living room)\n\u{1F451} **Presidential Suite** - \$799/night (120m\u00B2, butler service)\n\nAll rooms include free Wi-Fi, smart TV, and AC. Would you like to book?';
    }
    if (q.contains('spa') || q.contains('massage') || q.contains('wellness')) {
      return 'Our Azure Wellness Spa offers:\n\n\u{1F486} Full-body massage - \$120 (60min)\n\u{1F9D6} Hot stone therapy - \$150 (90min)\n\u{1F33F} Aromatherapy session - \$95 (45min)\n\u{1F485} Manicure & Pedicure - \$60\n\u{1F9D8} Yoga classes (daily 7am)\n\nOpen daily 8AM - 10PM. Would you like to book a treatment?';
    }
    if (q.contains('restaurant') || q.contains('dine') || q.contains('food') || q.contains('eat') || q.contains('breakfast')) {
      return 'Our dining options:\n\n\u{1F37D}\uFE0F **Azure Restaurant** - Fine dining, 6PM\u201311PM\n\u2615 **Sunrise Caf\u00E9** - Breakfast & brunch, 6AM\u20132PM\n\u{1F378} **Skyline Rooftop Bar** - Cocktails & tapas, 4PM\u20131AM\n\u{1F3D6}\uFE0F **Beach Grill** - Seafood & BBQ, 11AM\u20139PM\n\nRoom service available 24/7. Breakfast is included with Garden Suite and Presidential Suite.';
    }
    if (q.contains('pool') || q.contains('beach') || q.contains('swim')) {
      return 'Pool & Beach facilities:\n\n\u{1F3CA} **Infinity Pool** - Open 7AM\u20139PM, heated\n\u{1F3D6}\uFE0F **Private Beach** - Complimentary sun loungers & umbrellas\n\u{1F9D2} **Kids Pool** - Shallow pool with water features\n\nPool towels available at the towel station. Poolside drink service from 10AM\u20136PM.';
    }
    if (q.contains('airport') || q.contains('transfer') || q.contains('taxi') || q.contains('transport')) {
      return 'Transportation options:\n\n\u2708\uFE0F **Airport Transfer** - \$45 one-way (sedan), \$70 (luxury SUV)\n\u{1F695} **Hotel Shuttle** - Free to downtown Miami, hourly from 9AM\u20139PM\n\u{1F697} **Valet Parking** - \$25/day\n\nPlease book transfers 24 hours in advance through reception or this chat.';
    }
    if (q.contains('check-in') || q.contains('check in') || q.contains('check-out') || q.contains('check out') || q.contains('time')) {
      return 'Important times:\n\n\u{1F554} **Check-in**: 3:00 PM\n\u{1F550} **Check-out**: 11:00 AM\n\u2728 **Early check-in**: Available from 12PM (subject to availability, \$30)\n\u23F0 **Late check-out**: Until 2PM (\$40) or 5PM (\$80)\n\nPlease contact front desk at 555-0100 for special arrangements.';
    }
    if (q.contains('parking') || q.contains('car')) {
      return 'Parking options:\n\n\u{1F17F}\uFE0F **Self-parking** - \$15/day\n\u{1F697} **Valet parking** - \$25/day\n\u26A1 **EV charging** - 4 stations available (complimentary)\n\nParking is located at level B1-B3 with elevator access to the lobby.';
    }
    if (q.contains('wifi') || q.contains('internet')) {
      return 'Wi-Fi Information:\n\n\u{1F4F6} **Network**: GrandAzure-Guest\n\u{1F511} **Password**: Available at check-in\n\u{1F4E1} Speed: Up to 100 Mbps\n\nComplimentary in all rooms and public areas. Premium high-speed available for business travelers.';
    }
    if (q.contains('gym') || q.contains('fitness') || q.contains('workout')) {
      return 'Fitness Center:\n\n\u{1F3CB}\uFE0F Open 24/7 with key card access\n\u{1F6B4} Cardio equipment, free weights, and resistance machines\n\u{1F9D8} Yoga studio with daily classes at 7AM and 5PM\n\u{1F6BF} Locker rooms with showers and amenities\n\nPersonal training available upon request (\$80/session).';
    }
    return 'Thank you for your question! At Grand Azure Resort & Spa, we offer luxury accommodation, a full-service spa, multiple dining venues, infinity pool, private beach, and more.\n\nYou can ask me about:\n\u2022 Rooms & booking\n\u2022 Spa & wellness\n\u2022 Restaurants & dining\n\u2022 Pool & beach\n\u2022 Transportation\n\u2022 Check-in/out times\n\u2022 Wi-Fi & fitness\n\nHow can I help you?';
  }

  Future<void> _send([String? preset]) async {
    final text = (preset ?? _msgC.text).trim();
    if (text.isEmpty) return;
    _msgC.clear();
    setState(() {
      _messages.add({'role': 'user', 'text': text});
      _typing = true;
    });
    _scrollToBottom();

    // Try Supabase AI first, fallback to local
    String reply;
    try {
      reply = await SupabaseService.chatWithAI(
        '11111111-1111-1111-1111-111111111111',
        text,
        _messages.sublist(0, _messages.length - 1),
      ).timeout(const Duration(seconds: 5));
      // If the reply is a fallback error message, use local
      if (reply.contains('trouble connecting')) {
        reply = _getLocalReply(text);
      }
    } catch (_) {
      reply = _getLocalReply(text);
    }
    setState(() {
      _messages.add({'role': 'model', 'text': reply});
      _typing = false;
    });
    _scrollToBottom();
  }

  void _scrollToBottom() => Future.delayed(
    const Duration(milliseconds: 100),
    () {
      if (_scrollC.hasClients) {
        _scrollC.animateTo(
          _scrollC.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    },
  );

  void _clearChat() {
    setState(() {
      _messages.clear();
      _messages.add({
        'role': 'model',
        'text': 'Welcome back! How can I help you? \u{1F3D6}\uFE0F',
      });
    });
  }

  @override
  void dispose() {
    _msgC.dispose();
    _scrollC.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Row(children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [cs.primary, cs.tertiary]),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.smart_toy, size: 20, color: Colors.white),
          ),
          const SizedBox(width: 10),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('AI Concierge', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                Text('Always online', style: TextStyle(fontSize: 11, color: Colors.green)),
              ],
            ),
          ),
        ]),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Clear chat',
            onPressed: _clearChat,
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollC,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length + (_typing ? 1 : 0),
              itemBuilder: (_, i) {
                // Typing indicator
                if (i == _messages.length) {
                  return Align(
                    alignment: Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.only(top: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: cs.surfaceVariant,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SizedBox(
                            width: 16, height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2, color: cs.primary),
                          ),
                          const SizedBox(width: 8),
                          Text('Thinking...', style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant)),
                        ],
                      ),
                    ),
                  );
                }

                final msg = _messages[i];
                final isUser = msg['role'] == 'user';

                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: isUser ? cs.primary : cs.surfaceVariant,
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(18),
                        topRight: const Radius.circular(18),
                        bottomLeft: Radius.circular(isUser ? 18 : 4),
                        bottomRight: Radius.circular(isUser ? 4 : 18),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: (isUser ? cs.primary : Colors.black).withOpacity(0.08),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Text(
                      msg['text'] ?? '',
                      style: TextStyle(
                        color: isUser ? cs.onPrimary : cs.onSurface,
                        height: 1.5,
                        fontSize: 14,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          // Quick suggestions (only show when few messages)
          if (_messages.length <= 2)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: SizedBox(
                height: 36,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: _suggestions.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (_, i) => ActionChip(
                    label: Text(_suggestions[i], style: const TextStyle(fontSize: 12)),
                    onPressed: () => _send(_suggestions[i]),
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                ),
              ),
            ),

          // Input bar
          Container(
            padding: const EdgeInsets.fromLTRB(16, 8, 8, 8),
            decoration: BoxDecoration(
              color: cs.surface,
              border: Border(top: BorderSide(color: cs.outlineVariant.withOpacity(0.5))),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _msgC,
                      decoration: InputDecoration(
                        hintText: 'Ask about the hotel...',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                        filled: true,
                        fillColor: cs.surfaceVariant.withOpacity(0.5),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        isDense: true,
                      ),
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _send(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: [cs.primary, cs.tertiary]),
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      onPressed: _typing ? null : () => _send(),
                      icon: const Icon(Icons.send_rounded, size: 20, color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
