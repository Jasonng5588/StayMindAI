import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';


/// Smooth custom page transitions used across the entire app via GoRouter.
/// Use [AppPageTransitions.slide] for push, [AppPageTransitions.fade] for tab switches.

class AppPageTransitions {
  /// Silky slide-up + fade (for push routes like profile sub-pages)
  static Page<T> slideUp<T>({
    required LocalKey key,
    required Widget child,
    String? name,
  }) {
    return CustomTransitionPage<T>(
      key: key,
      name: name,
      child: child,
      transitionDuration: const Duration(milliseconds: 350),
      reverseTransitionDuration: const Duration(milliseconds: 280),
      transitionsBuilder: (_, animation, secondaryAnimation, child) {
        final curved = CurvedAnimation(parent: animation, curve: Curves.easeOutCubic);
        final reverseCurved = CurvedAnimation(parent: secondaryAnimation, curve: Curves.easeInCubic);
        return SlideTransition(
          position: Tween<Offset>(begin: const Offset(0, 0.08), end: Offset.zero).animate(curved),
          child: FadeTransition(
            opacity: Tween<double>(begin: 0.0, end: 1.0).animate(curved),
            child: FadeTransition(
              opacity: Tween<double>(begin: 1.0, end: 0.7).animate(reverseCurved),
              child: child,
            ),
          ),
        );
      },
    );
  }

  /// Smooth horizontal slide (left→right for normal push)
  static Page<T> slideRight<T>({
    required LocalKey key,
    required Widget child,
    String? name,
  }) {
    return CustomTransitionPage<T>(
      key: key,
      name: name,
      child: child,
      transitionDuration: const Duration(milliseconds: 320),
      reverseTransitionDuration: const Duration(milliseconds: 260),
      transitionsBuilder: (_, animation, secondaryAnimation, child) {
        final curved = CurvedAnimation(parent: animation, curve: Curves.easeOutCubic);
        return SlideTransition(
          position: Tween<Offset>(begin: const Offset(1.0, 0), end: Offset.zero).animate(curved),
          child: FadeTransition(
            opacity: Tween<double>(begin: 0.4, end: 1.0).animate(curved),
            child: child,
          ),
        );
      },
    );
  }

  /// Soft fade + slight scale (for modal-style pages)
  static Page<T> fadeScale<T>({
    required LocalKey key,
    required Widget child,
    String? name,
  }) {
    return CustomTransitionPage<T>(
      key: key,
      name: name,
      child: child,
      transitionDuration: const Duration(milliseconds: 400),
      reverseTransitionDuration: const Duration(milliseconds: 300),
      transitionsBuilder: (_, animation, __, child) {
        final curved = CurvedAnimation(parent: animation, curve: Curves.easeOutBack);
        return FadeTransition(
          opacity: Tween<double>(begin: 0.0, end: 1.0).animate(
            CurvedAnimation(parent: animation, curve: Curves.easeOut),
          ),
          child: ScaleTransition(
            scale: Tween<double>(begin: 0.93, end: 1.0).animate(curved),
            child: child,
          ),
        );
      },
    );
  }
}

/// Mixin that provides standard entrance animation for any StatefulWidget.
/// Usage: in your build() wrap with [AnimatedEntrance].
class AnimatedEntrance extends StatelessWidget {
  final Widget child;
  final int delayMs;
  final Offset slideFrom;

  const AnimatedEntrance({
    super.key,
    required this.child,
    this.delayMs = 0,
    this.slideFrom = const Offset(0, 0.06),
  });

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: Duration(milliseconds: 500 + delayMs),
      curve: Curves.easeOutCubic,
      builder: (_, value, child) {
        return Opacity(
          opacity: value.clamp(0.0, 1.0),
          child: Transform.translate(
            offset: Offset(slideFrom.dx * (1 - value) * 40, slideFrom.dy * (1 - value) * 40),
            child: child,
          ),
        );
      },
      child: child,
    );
  }
}

/// Tap-bounce effect for interactive cards
class TapBounce extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double scale;

  const TapBounce({super.key, required this.child, this.onTap, this.scale = 0.96});

  @override
  State<TapBounce> createState() => _TapBounceState();
}

class _TapBounceState extends State<TapBounce> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 100));
    _scale = Tween<double>(begin: 1.0, end: widget.scale).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _ctrl.forward(),
      onTapUp: (_) { _ctrl.reverse(); widget.onTap?.call(); },
      onTapCancel: () => _ctrl.reverse(),
      child: ScaleTransition(scale: _scale, child: widget.child),
    );
  }
}
