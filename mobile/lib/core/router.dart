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
import '../features/guest/vouchers_screen.dart';
import '../features/guest/guest_shell.dart';
import '../features/guest/service_detail_screen.dart';
import '../features/staff/staff_dashboard_screen.dart';
import '../features/staff/housekeeping_screen.dart';
import '../features/staff/rooms_screen.dart' as staff;
import '../features/staff/maintenance_screen.dart';
import '../features/staff/guest_chat_screen.dart';
import '../features/staff/manual_booking_screen.dart';
import '../features/staff/qr_scanner_screen.dart';
import '../features/staff/staff_shell.dart';
import 'animations.dart';

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
      // Auth routes — slide in from right
      GoRoute(
        path: '/login',
        pageBuilder: (_, state) => AppPageTransitions.slideRight(
          key: state.pageKey, child: const LoginScreen()),
      ),
      GoRoute(
        path: '/register',
        pageBuilder: (_, state) => AppPageTransitions.slideRight(
          key: state.pageKey, child: const RegisterScreen()),
      ),
      GoRoute(
        path: '/forgot-password',
        pageBuilder: (_, state) => AppPageTransitions.slideRight(
          key: state.pageKey, child: const ForgotPasswordScreen()),
      ),

      // Guest shell with bottom nav (5 tabs)
      StatefulShellRoute.indexedStack(
        builder: (_, __, navigationShell) => GuestShell(navigationShell: navigationShell),
        branches: [
          // Tab 0: Home
          StatefulShellBranch(navigatorKey: _guestShellKey, routes: [
            GoRoute(
              path: '/', 
              builder: (_, __) => const HomeScreen(),
              routes: [
                GoRoute(
                  path: 'service-detail',
                  pageBuilder: (_, state) => AppPageTransitions.fadeScale(
                    key: state.pageKey,
                    child: ServiceDetailScreen(serviceData: state.extra as Map<String, dynamic>),
                  ),
                ),
              ],
            ),
          ]),
          // Tab 1: Book Room
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/rooms',
              builder: (_, __) => const RoomsScreen(),
              routes: [
                GoRoute(
                  path: 'book',
                  pageBuilder: (_, state) => AppPageTransitions.fadeScale(
                    key: state.pageKey,
                    child: BookingFlowScreen(roomData: state.extra as Map<String, dynamic>?)),
                ),
              ],
            ),
          ]),
          // Tab 2: My Bookings
          StatefulShellBranch(routes: [
            GoRoute(path: '/bookings', builder: (_, __) => const BookingsScreen()),
          ]),
          // Tab 3: AI Concierge
          StatefulShellBranch(routes: [
            GoRoute(path: '/chat', builder: (_, __) => const ChatScreen()),
          ]),
          // Tab 4: Profile + sub-pages (slide up)
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/profile',
              builder: (_, __) => const ProfileScreen(),
              routes: [
                GoRoute(path: 'edit', pageBuilder: (_, state) => AppPageTransitions.slideUp(
                  key: state.pageKey, child: const EditProfileScreen())),
                GoRoute(path: 'reviews', pageBuilder: (_, state) => AppPageTransitions.slideUp(
                  key: state.pageKey, child: const ReviewsScreen())),
                GoRoute(path: 'notifications', pageBuilder: (_, state) => AppPageTransitions.slideUp(
                  key: state.pageKey, child: const NotificationsScreen())),
                GoRoute(path: 'loyalty', pageBuilder: (_, state) => AppPageTransitions.slideUp(
                  key: state.pageKey, child: const LoyaltyScreen())),
                GoRoute(path: 'rewards', pageBuilder: (_, state) => AppPageTransitions.slideUp(
                  key: state.pageKey, child: const MyRewardScreen())),
                GoRoute(path: 'support', pageBuilder: (_, state) => AppPageTransitions.slideUp(
                  key: state.pageKey, child: const SupportScreen())),
                GoRoute(path: 'vouchers', pageBuilder: (_, state) => AppPageTransitions.slideUp(
                  key: state.pageKey, child: const VouchersScreen())),
              ],
            ),
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

      // Standalone staff routes — slide + fade
      GoRoute(path: '/staff/chat', pageBuilder: (_, state) => AppPageTransitions.slideRight(
        key: state.pageKey, child: const GuestChatScreen())),
      GoRoute(path: '/staff/booking', pageBuilder: (_, state) => AppPageTransitions.fadeScale(
        key: state.pageKey, child: const ManualBookingScreen())),
      GoRoute(path: '/staff/qr', pageBuilder: (_, state) => AppPageTransitions.fadeScale(
        key: state.pageKey, child: const QrScannerScreen())),
    ],
  );
});
