// src/components/SplashOverlay.tsx

import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View, useWindowDimensions } from 'react-native';

interface SplashOverlayProps {
  onFinish: () => void;
  duration?: number;
}

export function SplashOverlay({ onFinish, duration = 2500 }: SplashOverlayProps) {
  const { width, height } = useWindowDimensions();
  const logoSize = Math.min(width * 0.6, 240);

  const opacity = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => onFinish());
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, logoOpacity, logoScale, opacity, onFinish]);

  return (
    <Animated.View 
      style={[
        styles.root, 
        { 
          opacity,
          width: width,      // Force exact screen width
          height: height,    // Force exact screen height
        }
      ]}
    >
      <View style={styles.center}>
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          }}
        >
          <Image
            source={require('../../assets/images/splash-logo.png')}
            style={{ width: logoSize, height: logoSize }}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF', // Forces a solid white background
    zIndex: 9999,               // Force it on top of everything
    elevation: 9999,            // Force it on top for Android
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});