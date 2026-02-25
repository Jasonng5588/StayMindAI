import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/router.dart';
import 'core/theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: const String.fromEnvironment('SUPABASE_URL', defaultValue: 'https://obrwbyyvmoepuqhyceyf.supabase.co'),
    anonKey: const String.fromEnvironment('SUPABASE_ANON_KEY', defaultValue: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icndieXl2bW9lcHVxaHljZXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MzYzNzgsImV4cCI6MjA4NzUxMjM3OH0.OLbLtcle96hKAGwwQ8vdHIaCeJ96MGzqvqLOy7A_mrY'),
  );

  runApp(const ProviderScope(child: StayMindApp()));
}

class StayMindApp extends ConsumerWidget {
  const StayMindApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final isDark = ref.watch(themeProvider);

    return MaterialApp.router(
      title: 'StayMind AI',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: isDark ? ThemeMode.dark : ThemeMode.light,
      routerConfig: router,
    );
  }
}

