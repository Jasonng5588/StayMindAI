import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/supabase_service.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});
  @override State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameC = TextEditingController();
  final _emailC = TextEditingController();
  final _passC = TextEditingController();
  bool _loading = false;
  bool _obscure = true;
  String? _error;

  Future<void> _register() async {
    if (_nameC.text.trim().isEmpty || _emailC.text.trim().isEmpty || _passC.text.length < 8) {
      setState(() => _error = 'Please fill all fields. Password must be 8+ characters.');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      await SupabaseService.signUp(_emailC.text.trim(), _passC.text, _nameC.text.trim(), role: 'guest');
      if (mounted) context.go('/');
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Create Account')),
      body: SafeArea(child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          // Hotel branding
          const Text('Join Grand Azure Resort & Spa', textAlign: TextAlign.center, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
          const SizedBox(height: 4),
          Text('Create a guest account to start booking', textAlign: TextAlign.center, style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13)),
          const SizedBox(height: 24),

          if (_error != null) Container(margin: const EdgeInsets.only(bottom: 16), padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: cs.errorContainer, borderRadius: BorderRadius.circular(12)), child: Text(_error!, style: TextStyle(color: cs.error, fontSize: 13))),
          TextField(controller: _nameC, decoration: const InputDecoration(labelText: 'Full Name', prefixIcon: Icon(Icons.person_outlined))),
          const SizedBox(height: 16),
          TextField(controller: _emailC, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined))),
          const SizedBox(height: 16),
          TextField(controller: _passC, obscureText: _obscure, decoration: InputDecoration(labelText: 'Password', prefixIcon: const Icon(Icons.lock_outlined), suffixIcon: IconButton(icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility), onPressed: () => setState(() => _obscure = !_obscure)))),
          const SizedBox(height: 24),
          FilledButton(onPressed: _loading ? null : _register, child: _loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Create Account')),
          const SizedBox(height: 16),
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [Text('Already have an account? ', style: TextStyle(color: cs.onSurfaceVariant)), TextButton(onPressed: () => context.pop(), child: const Text('Sign In'))]),
        ]),
      )),
    );
  }
}

