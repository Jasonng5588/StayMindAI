import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../services/supabase_service.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});
  @override State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _dobCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _countryCtrl = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final user = SupabaseService.currentUser;
    _nameCtrl.text = user?.userMetadata?['full_name'] ?? '';
    _phoneCtrl.text = user?.userMetadata?['phone'] ?? '';
    _loadProfileData();
  }

  Future<void> _loadProfileData() async {
    final user = SupabaseService.currentUser;
    if (user == null) return;
    try {
      final data = await SupabaseService.client.from('profiles').select().eq('id', user.id).maybeSingle();
      if (data != null && mounted) {
        setState(() {
          _dobCtrl.text = data['date_of_birth'] ?? '';
          _addressCtrl.text = data['address'] ?? '';
          _cityCtrl.text = data['city'] ?? '';
          _countryCtrl.text = data['country'] ?? '';
        });
      }
    } catch (_) {} // fail silently
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _dobCtrl.dispose();
    _addressCtrl.dispose();
    _cityCtrl.dispose();
    _countryCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final user = SupabaseService.currentUser;
      if (user != null) {
        await SupabaseService.client.auth.updateUser(
          UserAttributes(data: {
            'full_name': _nameCtrl.text.trim(),
            'phone': _phoneCtrl.text.trim(),
          }),
        );
        // Also update profiles table
        await SupabaseService.client.from('profiles').update({
          'full_name': _nameCtrl.text.trim(),
          'phone': _phoneCtrl.text.trim(),
          'date_of_birth': _dobCtrl.text.trim().isEmpty ? null : _dobCtrl.text.trim(),
          'address': _addressCtrl.text.trim(),
          'city': _cityCtrl.text.trim(),
          'country': _countryCtrl.text.trim(),
        }).eq('id', user.id);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(children: [Icon(Icons.check_circle, color: Colors.white, size: 20), SizedBox(width: 8), Text('Profile updated!')]),
            backgroundColor: Colors.green.shade600,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red.shade600,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
    if (mounted) setState(() => _saving = false);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final user = SupabaseService.currentUser;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Profile'),
        actions: [
          TextButton.icon(
            onPressed: _saving ? null : _save,
            icon: _saving ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.check),
            label: const Text('Save'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Avatar
          Center(
            child: Stack(
              children: [
                CircleAvatar(
                  radius: 50,
                  backgroundColor: cs.primaryContainer,
                  child: Text(
                    (user?.email ?? 'U')[0].toUpperCase(),
                    style: TextStyle(fontSize: 36, fontWeight: FontWeight.bold, color: cs.primary),
                  ),
                ),
                Positioned(
                  bottom: 0, right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(color: cs.primary, shape: BoxShape.circle),
                    child: const Icon(Icons.camera_alt, size: 18, color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),

          // Email (read-only)
          Text('Email', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: cs.onSurfaceVariant)),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: cs.surfaceVariant.withOpacity(0.5),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(Icons.email_outlined, size: 20, color: cs.onSurfaceVariant),
                const SizedBox(width: 12),
                Expanded(child: Text(user?.email ?? '', style: TextStyle(color: cs.onSurfaceVariant))),
                Icon(Icons.lock_outline, size: 16, color: cs.onSurfaceVariant),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Full Name
          Text('Full Name', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: cs.onSurfaceVariant)),
          const SizedBox(height: 6),
          TextField(
            controller: _nameCtrl,
            decoration: InputDecoration(
              prefixIcon: const Icon(Icons.person_outline),
              hintText: 'Enter your full name',
              filled: true,
              fillColor: cs.surfaceVariant.withOpacity(0.3),
            ),
          ),
          const SizedBox(height: 20),

          // Phone
          Text('Phone', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: cs.onSurfaceVariant)),
          const SizedBox(height: 6),
          TextField(
            controller: _phoneCtrl,
            keyboardType: TextInputType.phone,
            decoration: InputDecoration(
              prefixIcon: const Icon(Icons.phone_outlined),
              hintText: 'Enter phone number',
              filled: true,
              fillColor: cs.surfaceVariant.withOpacity(0.3),
            ),
          ),
          const SizedBox(height: 20),

          // Date of Birth
          Text('Date of Birth', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: cs.onSurfaceVariant)),
          const SizedBox(height: 6),
          TextField(
            controller: _dobCtrl,
            keyboardType: TextInputType.datetime,
            readOnly: true,
            onTap: () async {
              final date = await showDatePicker(
                context: context,
                initialDate: DateTime(2000),
                firstDate: DateTime(1900),
                lastDate: DateTime.now(),
              );
              if (date != null) {
                _dobCtrl.text = date.toIso8601String().split('T')[0];
              }
            },
            decoration: InputDecoration(
              prefixIcon: const Icon(Icons.calendar_today_outlined),
              hintText: 'YYYY-MM-DD',
              filled: true,
              fillColor: cs.surfaceVariant.withOpacity(0.3),
            ),
          ),
          const SizedBox(height: 20),

          // Address
          Text('Address', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: cs.onSurfaceVariant)),
          const SizedBox(height: 6),
          TextField(
            controller: _addressCtrl,
            decoration: InputDecoration(
              prefixIcon: const Icon(Icons.home_outlined),
              hintText: 'Street address',
              filled: true,
              fillColor: cs.surfaceVariant.withOpacity(0.3),
            ),
          ),
          const SizedBox(height: 20),

          // City & Country
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('City', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: cs.onSurfaceVariant)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _cityCtrl,
                      decoration: InputDecoration(
                        prefixIcon: const Icon(Icons.location_city_outlined),
                        hintText: 'City',
                        filled: true,
                        fillColor: cs.surfaceVariant.withOpacity(0.3),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Country', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: cs.onSurfaceVariant)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _countryCtrl,
                      decoration: InputDecoration(
                        prefixIcon: const Icon(Icons.public_outlined),
                        hintText: 'Country',
                        filled: true,
                        fillColor: cs.surfaceVariant.withOpacity(0.3),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),

          FilledButton.icon(
            onPressed: _saving ? null : _save,
            icon: _saving ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.save),
            label: const Text('Save Changes'),
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
    );
  }
}
