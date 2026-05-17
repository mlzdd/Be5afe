import { Easing } from 'react-native-reanimated';

export const durations = {
  instant: 0,
  fast: 200,
  normal: 300,
  slow: 500,
  verySlow: 800,
} as const;

export const easings = {
  linear:    Easing.linear,
  easeIn:    Easing.in(Easing.ease),
  easeOut:   Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),
  bounce:    Easing.bounce,
  cubic:     Easing.bezier(0.4, 0.0, 0.2, 1),
  sharp:     Easing.bezier(0.4, 0.0, 0.6, 1),
} as const;

export const animations = {
  fadeIn:    { duration: durations.normal, easing: easings.easeOut },
  fadeOut:   { duration: durations.normal, easing: easings.easeIn },
  slideUp:   { duration: durations.normal, easing: easings.cubic },
  slideDown: { duration: durations.normal, easing: easings.cubic },
  slideLeft: { duration: durations.normal, easing: easings.cubic },
  slideRight:{ duration: durations.normal, easing: easings.cubic },
  scaleIn:   { duration: durations.fast,   easing: easings.easeOut },
  scaleOut:  { duration: durations.fast,   easing: easings.easeIn },
  bounce:    { duration: durations.slow,   easing: easings.bounce },
  spring:    { duration: durations.normal, easing: easings.easeInOut },
  press:     { duration: durations.fast,   easing: easings.sharp },
} as const;

export const animationValues = {
  hidden: 0,
  visible: 1,
  scaleMin: 0.9,
  scaleNormal: 1,
  scaleMax: 1.1,
  translateHidden: 100,
  translateVisible: 0,
} as const;

export type AnimationType = keyof typeof animations;
