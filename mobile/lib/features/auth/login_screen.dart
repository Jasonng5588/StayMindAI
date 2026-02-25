import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/supabase_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailC = TextEditingController();
  final _passC = TextEditingController();
  bool _loading = false;
  bool _obscure = true;
  String? _error;

  Future<void> _login() async {
    setState(() { _loading = true; _error = null; });
    try {
      await SupabaseService.signIn(_emailC.text.trim(), _passC.text);
      if (mounted) context.go('/');
    } catch (e) {
      setState(() => _error = 'Invalid email or password');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      body: SafeArea(
        child: Center(child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Icon(Icons.hotel_rounded, size: 56, color: cs.primary),
            const SizedBox(height: 12),
            Text('StayMind AI', textAlign: TextAlign.center, style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: cs.primary)),
            const SizedBox(height: 4),
            Text('Sign in to your account', textAlign: TextAlign.center, style: TextStyle(color: cs.onSurfaceVariant)),
            const SizedBox(height: 32),
            if (_error != null) Container(margin: const EdgeInsets.only(bottom: 16), padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: cs.errorContainer, borderRadius: BorderRadius.circular(12)), child: Text(_error!, style: TextStyle(color: cs.error, fontSize: 13), textAlign: TextAlign.center)),
            TextField(controller: _emailC, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined))),
            const SizedBox(height: 16),
            TextField(controller: _passC, obscureText: _obscure, decoration: InputDecoration(labelText: 'Password', prefixIcon: const Icon(Icons.lock_outlined), suffixIcon: IconButton(icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility), onPressed: () => setState(() => _obscure = !_obscure)))),
            const SizedBox(height: 8),
            Align(alignment: Alignment.centerRight, child: TextButton(onPressed: () => context.push('/forgot-password'), child: const Text('Forgot password?'))),
            const SizedBox(height: 16),
            FilledButton(onPressed: _loading ? null : _login, child: _loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Sign In')),
            const SizedBox(height: 16),
            OutlinedButton.icon(onPressed: () => SupabaseService.signInWithGoogle(), icon: const Icon(Icons.g_mobiledata, size: 24), label: const Text('Continue with Google')),
            const SizedBox(height: 24),
            Row(mainAxisAlignment: MainAxisAlignment.center, children: [Text('Don\'t have an account? ', style: TextStyle(color: cs.onSurfaceVariant)), TextButton(onPressed: () => context.push('/register'), child: const Text('Sign Up'))]),
          ]),
        )),
      ),
    );
  }
}

