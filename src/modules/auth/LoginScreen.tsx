import React, { useState, useEffect } from 'react';
import {
  Text, TextInput, Pressable, StyleSheet,
  Dimensions, KeyboardAvoidingView, Alert,
} from 'react-native';
import Svg, { Image as SvgImage, Ellipse, ClipPath } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, interpolate,
  withTiming, withDelay, runOnJS,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { useAuth } from './AuthContext';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const landmarksAnimation = require('../../../assets/animations/Landmarks.json') as string;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const loginBg = require('../../../assets/loginBackground.png') as number;

const { width, height } = Dimensions.get('window');

interface Props {
  onComplete: () => void;
}

export function LoginScreen({ onComplete }: Props) {
  const { signIn, signUp, error, clearError, continueAsGuest } = useAuth();

  const screenOffset = useSharedValue(width);
  const imagePosition = useSharedValue(1);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    screenOffset.value = withTiming(0, { duration: 500 });
  }, []);

  const screenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: screenOffset.value }],
  }));

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY: withTiming(
        interpolate(imagePosition.value, [0, 1], [-height * 0.46, 0]),
        { duration: 1000 }
      ),
    }],
  }));

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(imagePosition.value, { duration: 1000 }),
    transform: [{
      translateY: withTiming(
        interpolate(imagePosition.value, [0, 1], [250, 0]),
        { duration: 1000 }
      ),
    }],
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: imagePosition.value === 0
      ? withDelay(400, withTiming(1, { duration: 800 }))
      : withTiming(0, { duration: 300 }),
  }));

  const exitToLeft = () => {
    screenOffset.value = withTiming(-width * 1.3, { duration: 500 }, (finished) => {
      if (finished) runOnJS(onComplete)();
    });
  };

  const handleSkip = () => {
    continueAsGuest();
    exitToLeft();
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    setIsSubmitting(true);
    try {
      if (isRegistering) {
        await signUp(email, password);
        Alert.alert('Success!', 'Account created successfully', [{ text: 'OK', onPress: exitToLeft }]);
      } else {
        await signIn(email, password);
        exitToLeft();
      }
    } catch {
      Alert.alert('Error', error ?? 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Animated.View style={[styles.container, screenStyle]}>
      <Animated.View style={[StyleSheet.absoluteFill, imageAnimatedStyle]}>
        <Svg width={width * 1.23} height={height + 100}>
          <LottieView
            source={landmarksAnimation}
            autoPlay loop speed={0.25}
            style={styles.lottie} resizeMode="contain"
          />
          <ClipPath id="clip">
            <Ellipse cx={width / 2} rx={height} ry={height + 100} />
          </ClipPath>
          <SvgImage
            href={loginBg}
            width={width + 100} height={height + 100}
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#clip)"
          />
        </Svg>
      </Animated.View>

      <KeyboardAvoidingView behavior="height" style={[styles.bottom, { paddingBottom: height * 0.08 }]}>
        <Animated.View style={buttonsAnimatedStyle}>
          <Pressable onPress={() => { imagePosition.value = 0; setIsRegistering(false); clearError(); }} style={styles.button}>
            <Text style={styles.buttonText}>LOG IN</Text>
          </Pressable>
        </Animated.View>
        <Animated.View style={buttonsAnimatedStyle}>
          <Pressable onPress={() => { imagePosition.value = 0; setIsRegistering(true); clearError(); }} style={styles.button}>
            <Text style={styles.buttonText}>REGISTER</Text>
          </Pressable>
        </Animated.View>
        <Animated.View style={buttonsAnimatedStyle}>
          <Pressable onPress={handleSkip} style={[styles.button, { width: width * 0.25, alignSelf: 'center' }]}>
            <Text style={styles.buttonText}>SKIP</Text>
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.form, { bottom: height * 0.09 }, formAnimatedStyle]}>
          <TextInput
            placeholder="Email" value={email} onChangeText={setEmail}
            autoCapitalize="none" keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            placeholder="Password" value={password} onChangeText={setPassword}
            secureTextEntry style={styles.input}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
          <Pressable onPress={handleSubmit} disabled={isSubmitting}
            style={[styles.formBtn, isSubmitting && styles.formBtnDisabled]}>
            <Text style={styles.formBtnText}>
              {isSubmitting ? 'LOADING...' : isRegistering ? 'CREATE ACCOUNT' : 'CONTINUE'}
            </Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bottom: { flex: 1, justifyContent: 'flex-end' },
  button: {
    backgroundColor: '#fff', height: 55, borderRadius: 35,
    margin: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#9348CC',
  },
  buttonText: { fontSize: 18, fontWeight: '600', color: '#9348CC' },
  form: { position: 'absolute', bottom: 0, width: '100%', alignItems: 'center', zIndex: -1 },
  input: {
    width: width * 0.9, height: 50, borderRadius: 25,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.2)',
    margin: 10, paddingHorizontal: 16, backgroundColor: '#FFF',
  },
  formBtn: {
    backgroundColor: '#9348CC', height: 55, width: width * 0.9,
    borderRadius: 35, alignItems: 'center', justifyContent: 'center', margin: 10,
  },
  formBtnDisabled: { opacity: 0.6 },
  formBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  errorText: { color: '#F44336', fontSize: 14, textAlign: 'center', marginHorizontal: 20, marginBottom: 10 },
  lottie: { position: 'absolute', width: 300, height: 300, top: height * 0.15, right: width * 0.37 },
});
