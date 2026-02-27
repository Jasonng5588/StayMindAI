import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';

final themeProvider = StateNotifierProvider<ThemeNotifier, bool>((ref) => ThemeNotifier());

class ThemeNotifier extends StateNotifier<bool> {
  ThemeNotifier() : super(false) { _loadTheme(); }
  Future<void> _loadTheme() async {
    final prefs = await SharedPreferences.getInstance();
    state = prefs.getBool('isDark') ?? false;
  }
  Future<void> toggle() async {
    state = !state;
    final prefs = await SharedPreferences.getInstance();
    prefs.setBool('isDark', state);
  }
}

class AppTheme {
  // Premium teal-blue palette
  static const _seed = Color(0xFF0EA5E9);
  static const _seedDark = Color(0xFF38BDF8);

  static ThemeData get lightTheme => ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    colorSchemeSeed: _seed,
    textTheme: GoogleFonts.interTextTheme(),
    scaffoldBackgroundColor: const Color(0xFFF8FAFC),
    appBarTheme: AppBarTheme(
      centerTitle: true,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      backgroundColor: const Color(0xFFF8FAFC),
      titleTextStyle: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w600, color: const Color(0xFF0F172A)),
    ),
    cardTheme: CardTheme(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      color: Colors.white,
      surfaceTintColor: Colors.transparent,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFFF1F5F9),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: _seed, width: 2)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      height: 70,
      elevation: 3,
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      indicatorColor: _seed.withOpacity(0.12),
      labelTextStyle: MaterialStateProperty.all(GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w500)),
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      elevation: 2,
      shape: StadiumBorder(),
    ),
    chipTheme: ChipThemeData(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    ),
    dividerTheme: const DividerThemeData(color: Color(0xFFE2E8F0)),
  );

  static ThemeData get darkTheme => ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorSchemeSeed: _seedDark,
    textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme),
    scaffoldBackgroundColor: const Color(0xFF0B1120),
    appBarTheme: AppBarTheme(
      centerTitle: true,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      backgroundColor: const Color(0xFF0B1120),
      titleTextStyle: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w600, color: const Color(0xFFE2E8F0)),
    ),
    cardTheme: CardTheme(
      elevation: 0,
      color: const Color(0xFF162032),
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFF1E3A5F)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFF162032),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF1E3A5F))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: _seedDark, width: 2)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      height: 70,
      elevation: 3,
      backgroundColor: const Color(0xFF0B1120),
      surfaceTintColor: Colors.transparent,
      indicatorColor: _seedDark.withOpacity(0.15),
      labelTextStyle: MaterialStateProperty.all(GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w500)),
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      elevation: 2,
      shape: StadiumBorder(),
    ),
    chipTheme: ChipThemeData(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    ),
    dividerTheme: const DividerThemeData(color: Color(0xFF1E3A5F)),
  );
}
