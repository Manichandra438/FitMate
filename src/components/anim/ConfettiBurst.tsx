import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useCallback,
  useRef,
} from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const PASTELS = ['#FF7A59', '#34C79A', '#58B9F4', '#FFC145', '#F4604F', '#FF9F45'];
const EMOJI = ['🎉', '✨', '💪'];
const PIECES = 24;

export interface ConfettiBurstHandle {
  burst: () => void;
}

interface PieceSpec {
  id: number;
  x: number;
  emoji?: string;
  color: string;
  size: number;
  driftX: number;
  fallY: number;
  rotate: number;
  delay: number;
}

function makePieces(width: number): PieceSpec[] {
  return Array.from({ length: PIECES }, (_, i) => ({
    id: i,
    x: Math.random() * width,
    emoji: i % 8 === 0 ? EMOJI[i % EMOJI.length] : undefined,
    color: PASTELS[i % PASTELS.length],
    size: 6 + Math.random() * 8,
    driftX: (Math.random() - 0.5) * 140,
    fallY: 380 + Math.random() * 260,
    rotate: (Math.random() - 0.5) * 720,
    delay: Math.random() * 180,
  }));
}

function Piece({ spec, onDone }: { spec: PieceSpec; onDone?: () => void }) {
  const t = useSharedValue(0);

  React.useEffect(() => {
    t.value = withDelay(
      spec.delay,
      withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }, (finished) => {
        if (finished && onDone) runOnJS(onDone)();
      })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    transform: [
      { translateX: spec.x + t.value * spec.driftX },
      { translateY: -20 + t.value * spec.fallY },
      { rotate: `${t.value * spec.rotate}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.piece, style]}>
      {spec.emoji ? (
        <Text style={{ fontSize: 18 }}>{spec.emoji}</Text>
      ) : (
        <View
          style={{
            width: spec.size,
            height: spec.size,
            borderRadius: spec.size / 3,
            backgroundColor: spec.color,
          }}
        />
      )}
    </Animated.View>
  );
}

/**
 * Full-screen overlay confetti. Mount once per screen, fire via ref:
 *   const confetti = useRef<ConfettiBurstHandle>(null);
 *   <ConfettiBurst ref={confetti} />
 *   confetti.current?.burst();
 */
const ConfettiBurst = forwardRef<ConfettiBurstHandle>((_props, ref) => {
  const [pieces, setPieces] = useState<PieceSpec[] | null>(null);
  const doneCount = useRef(0);

  const burst = useCallback(() => {
    doneCount.current = 0;
    setPieces(makePieces(Dimensions.get('window').width));
  }, []);

  useImperativeHandle(ref, () => ({ burst }), [burst]);

  const handlePieceDone = useCallback(() => {
    doneCount.current += 1;
    if (doneCount.current >= PIECES) setPieces(null);
  }, []);

  if (!pieces) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {pieces.map((spec) => (
        <Piece key={spec.id} spec={spec} onDone={handlePieceDone} />
      ))}
    </View>
  );
});

export default ConfettiBurst;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    overflow: 'hidden',
  },
  piece: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
