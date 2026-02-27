import 'package:flutter/material.dart';

/// Wraps the app and shows a smooth logo overlay animation when the app
/// launches or comes back to the foreground (switch back or reopen from kill).
class AppResumeWrapper extends StatefulWidget {
  final Widget child;
  const AppResumeWrapper({super.key, required this.child});

  @override
  State<AppResumeWrapper> createState() => _AppResumeWrapperState();
}

class _AppResumeWrapperState extends State<AppResumeWrapper>
    with WidgetsBindingObserver, TickerProviderStateMixin {
  bool _showOverlay = true;
  late AnimationController _ctrl;
  late Animation<double> _fadeAnim;
  late Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    _fadeAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _ctrl, curve: const Interval(0.0, 0.6, curve: Curves.easeOut)),
    );

    _scaleAnim = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _ctrl, curve: const Interval(0.0, 0.8, curve: Curves.easeOutBack)),
    );

    // Launch animation
    _ctrl.forward().then((_) {
      Future.delayed(const Duration(milliseconds: 700), _dismiss);
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _ctrl.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _show();
    }
  }

  void _show() {
    if (!mounted) return;
    setState(() => _showOverlay = true);
    _ctrl.reset();
    _ctrl.forward().then((_) {
      Future.delayed(const Duration(milliseconds: 500), _dismiss);
    });
  }

  void _dismiss() {
    if (!mounted) return;
    _ctrl.reverse().then((_) {
      if (mounted) setState(() => _showOverlay = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Stack(children: [
      widget.child,
      if (_showOverlay)
        AnimatedBuilder(
          animation: _ctrl,
          builder: (ctx, _) {
            final isDark = Theme.of(ctx).brightness == Brightness.dark;
            final bg = isDark ? const Color(0xFF0B1120) : const Color(0xFF0EA5E9);
            final iconBg = isDark ? const Color(0xFF3B82F6) : Colors.white.withOpacity(0.95);
            final iconColor = isDark ? Colors.white : const Color(0xFF0EA5E9);

            return Material(
              type: MaterialType.transparency,
              child: Opacity(
                opacity: _fadeAnim.value.clamp(0.0, 1.0),
                child: Container(
                  color: bg,
                  child: Center(
                    child: Transform.scale(
                    scale: _scaleAnim.value,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Logo circle
                        Container(
                          width: 90,
                          height: 90,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: iconBg,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.25),
                                blurRadius: 24,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          child: Icon(Icons.hotel, size: 46, color: iconColor),
                        ),
                        const SizedBox(height: 22),
                        // App name
                        Opacity(
                          opacity: ((_ctrl.value - 0.2) / 0.6).clamp(0.0, 1.0),
                          child: Transform.translate(
                            offset: Offset(0, 20 * (1 - ((_ctrl.value - 0.2) / 0.6).clamp(0.0, 1.0))),
                            child: const Text(
                              'StayMind AI',
                              style: TextStyle(
                                fontSize: 30,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                                letterSpacing: 1.5,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        // Tagline
                        Opacity(
                          opacity: ((_ctrl.value - 0.35) / 0.5).clamp(0.0, 1.0),
                          child: Text(
                            'Your Premium Hotel Experience',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.white.withOpacity(0.75),
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          );
          },
        ),
    ]);
  }
}
