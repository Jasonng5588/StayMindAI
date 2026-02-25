import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/supabase_service.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});
  @override State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailC = TextEditingController();
  bool _loading = false;
  bool _sent = false;

  Future<void> _reset() async {
    setState(() => _loading = true);
    try {
      await SupabaseService.resetPassword(_emailC.text.trim());
      setState(() => _sent = true);
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to send reset email')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reset Password')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: _sent
          ? Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(Icons.check_circle_outline, size: 64, color: Theme.of(context).colorScheme.primary),
              const SizedBox(height: 16),
              const Text('Check your email', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text('We sent a reset link to ${_emailC.text}', textAlign: TextAlign.center, style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
              const SizedBox(height: 24),
              FilledButton(onPressed: () => context.pop(), child: const Text('Back to Login')),
            ])
          : Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              const Text('Enter your email address and we\'ll send you a reset link.', style: TextStyle(fontSize: 15)),
              const SizedBox(height: 24),
              TextField(controller: _emailC, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined))),
              const SizedBox(height: 24),
              FilledButton(onPressed: _loading ? null : _reset, child: _loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Send Reset Link')),
            ]),
      ),
    );
  }
}

