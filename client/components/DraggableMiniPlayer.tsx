import { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Animated as RNAnimated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from './AudioPlayerProvider';

export default function DraggableMiniPlayer() {
  const { width, height } = useWindowDimensions();
  // PanResponder-based drag (works reliably on web)
  const position = useRef(new RNAnimated.ValueXY({ x: 0, y: 0 })).current;
  const offsetRef = useRef({ x: 0, y: 0 });

  const { current, state, toggle, next, prev, toggleFavorite, favorites, clear } = useAudioPlayer();
  const [collapsed, setCollapsed] = useState(false);

  const visible = useMemo(() => !!current, [current]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: RNAnimated.event([
        null,
        { dx: position.x, dy: position.y },
      ], { useNativeDriver: false }),
      onPanResponderRelease: (_, gesture) => {
        const boundaryOffset = collapsed ? 60 : 20;
        const nextX = offsetRef.current.x + gesture.dx;
        const nextY = offsetRef.current.y + gesture.dy;
        const clampedX = Math.max(-(width / 2 - boundaryOffset), Math.min(width / 2 - boundaryOffset, nextX));
        const clampedY = Math.max(-(height / 2 - boundaryOffset), Math.min(height / 2 - boundaryOffset, nextY));
        offsetRef.current = { x: clampedX, y: clampedY };
        position.setOffset({ x: clampedX, y: clampedY });
        position.setValue({ x: 0, y: 0 });
      },
    })
  ).current;

  if (!visible) return null;
  
  // Isolate the width calculation for the Animated.View wrapper
  const playerWidthStyle = { width: collapsed ? 120 : (width - 24) };
  
  // Define the inner player content using a separate variable
  const PlayerContent = (
    <View style={styles.container}> 
      {collapsed ? (
        <View style={styles.inner}> 
          <View style={styles.row}> 
            <TouchableOpacity onPress={() => setCollapsed(false)} style={styles.iconBtn}>
              <Ionicons name="expand" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggle} style={styles.iconBtn}>
              <Ionicons name={state.isPlaying ? 'pause' : 'play'} size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={clear} style={styles.iconBtn}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.inner}>
          <View style={styles.meta}>
            <Text numberOfLines={1} style={styles.title}>{current?.title ?? 'Now playing'}</Text>
            {current?.artist ? (
              <Text numberOfLines={1} style={styles.artist}>{current.artist}</Text>
            ) : null}
          </View>
          <View style={styles.controls}>
            <TouchableOpacity onPress={() => current && toggleFavorite(current)} style={styles.iconBtn}>
              <Ionicons name={current && favorites[current.id] ? 'heart' : 'heart-outline'} size={22} color={current && favorites[current.id] ? '#ff4d4f' : '#fff'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={prev} style={styles.iconBtn}>
              <Ionicons name="play-skip-back" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggle} style={styles.iconBtn}>
              <Ionicons name={state.isPlaying ? 'pause' : 'play'} size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={next} style={styles.iconBtn}>
              <Ionicons name="play-skip-forward" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCollapsed(true)} style={styles.iconBtn}>
              <Ionicons name="contract" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={clear} style={styles.iconBtn}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <RNAnimated.View style={[styles.absoluteWrap, { transform: position.getTranslateTransform() }, playerWidthStyle]} {...panResponder.panHandlers}>
      {PlayerContent}
    </RNAnimated.View>
  );
}

const styles = StyleSheet.create({
  absoluteWrap: {
    // Positioning the draggable component
    position: 'absolute',
    left: 12,
    bottom: 20,
    zIndex: 1000,
  },
  container: {
    // Visual container for the player bar
    width: '100%', // MUST take up the full width of the parent Animated.View
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#388e3c',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 6,
  },
  meta: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    
  },
  artist: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  iconBtn: {
    marginHorizontal: 6,
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around', // Added this back for better collapsed button spacing
    flex: 1,
  },
});
