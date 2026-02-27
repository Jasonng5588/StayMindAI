import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../features/auth/login_screen.dart';
import '../features/auth/register_screen.dart';
import '../features/auth/forgot_password_screen.dart';
import '../features/guest/home_screen.dart';
import '../features/guest/rooms_screen.dart';
import '../features/guest/booking_flow_screen.dart';
import '../features/guest/bookings_screen.dart';
import '../features/guest/chat_screen.dart';
import '../features/guest/notifications_screen.dart';
import '../features/guest/reviews_screen.dart';
import '../features/guest/profile_screen.dart';
import '../features/guest/edit_profile_screen.dart';
import '../features/guest/loyalty_screen.dart';
import '../features/guest/my_reward_screen.dart';
import '../features/guest/support_screen.dart';
import '../features/guest/guest_shell.dart';
import '../features/staff/staff_dashboard_screen.dart';
import '../features/staff/housekeeping_screen.dart';
import '../features/staff/rooms_screen.dart' as staff;
import '../features/staff/maintenance_screen.dart';
import '../features/staff/guest_chat_screen.dart';
import '../features/staff/manual_booking_screen.dart';
import '../features/staff/qr_scanner_screen.dart';
import '../features/staff/staff_shell.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _guestShellKey = GlobalKey<NavigatorState>();
final _staffShellKey = GlobalKey<NavigatorState>();

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/',
    redirect: (context, state) {
      final session = Supabase.instance.client.auth.currentSession;
      final isLoggedIn = session != null;
      final isAuthRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register' ||
          state.matchedLocation == '/forgot-password';

      if (!isLoggedIn && !isAuthRoute) return '/login';
      if (isLoggedIn && isAuthRoute) return '/';
      return null;
    },
    routes: [
      // Auth routes
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/forgot-password', builder: (_, __) => const ForgotPasswordScreen()),

      // Guest shell with bottom nav (5 tabs)
      StatefulShellRoute.indexedStack(
        builder: (_, __, navigationShell) => GuestShell(navigationShell: navigationShell),
        branches: [
          // Tab 0: Home (single hotel dashboard)
          StatefulShellBranch(navigatorKey: _guestShellKey, routes: [
            GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
          ]),
          // Tab 1: Book Room (browse rooms)
          StatefulShellBranch(routes: [
            GoRoute(path: '/rooms', builder: (_, __) => const RoomsScreen(), routes: [
              GoRoute(path: 'book', builder: (_, state) => BookingFlowScreen(roomData: state.extra as Map<String, dynamic>?)),
            ]),
          ]),
          // Tab 2: My Bookings
          StatefulShellBranch(routes: [
            GoRoute(path: '/bookings', builder: (_, __) => const BookingsScreen()),
          ]),
          // Tab 3: AI Concierge
          StatefulShellBranch(routes: [
            GoRoute(path: '/chat', builder: (_, __) => const ChatScreen()),
          ]),
          // Tab 4: Profile
          StatefulShellBranch(routes: [
            GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen(), routes: [
              GoRoute(path: 'edit', builder: (_, __) => const EditProfileScreen()),
              GoRoute(path: 'reviews', builder: (_, __) => const ReviewsScreen()),
              GoRoute(path: 'notifications', builder: (_, __) => const NotificationsScreen()),
              GoRoute(path: 'loyalty', builder: (_, __) => const LoyaltyScreen()),
              GoRoute(path: 'rewards', builder: (_, __) => const MyRewardScreen()),
              GoRoute(path: 'support', builder: (_, __) => const SupportScreen()),
            ]),
          ]),
        ],
      ),

      // Staff shell
      StatefulShellRoute.indexedStack(
        builder: (_, __, navigationShell) => StaffShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(navigatorKey: _staffShellKey, routes: [
            GoRoute(path: '/staff', builder: (_, __) => const StaffDashboardScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/staff/housekeeping', builder: (_, __) => const HousekeepingScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/staff/rooms', builder: (_, __) => const staff.RoomsScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/staff/maintenance', builder: (_, __) => const MaintenanceScreen()),
          ]),
        ],
      ),

      // Standalone staff routes
      GoRoute(path: '/staff/chat', builder: (_, __) => const GuestChatScreen()),
      GoRoute(path: '/staff/booking', builder: (_, __) => const ManualBookingScreen()),
      GoRoute(path: '/staff/qr', builder: (_, __) => const QrScannerScreen()),
    ],
  );
});

