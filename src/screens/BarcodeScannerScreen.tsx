import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';
import { lookupBarcode } from '../services/openFoodFacts';
import { NutritionixFood } from '../types';

type RouteParams = {
  BarcodeScanner: { onFound: (food: NutritionixFood) => void };
};

export default function BarcodeScannerScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'BarcodeScanner'>>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  const handleBarcode = async ({ data }: { data: string }) => {
    if (!scanning || loading) return;
    setScanning(false);
    setLoading(true);
    const food = await lookupBarcode(data);
    setLoading(false);
    if (food) {
      route.params.onFound(food);
      navigation.goBack();
    } else {
      Alert.alert(
        'Not found',
        `No nutrition data found for barcode ${data}. Try searching by name.`,
        [{ text: 'Scan again', onPress: () => setScanning(true) }, { text: 'Go back', onPress: () => navigation.goBack() }]
      );
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={48} color={colors.textMuted} />
        <Text style={styles.permText}>Camera permission needed to scan barcodes.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanning ? handleBarcode : undefined}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'] }}
      />
      <View style={styles.overlay}>
        <View style={styles.topHint}>
          <Text style={styles.hintText}>Point at a product barcode</Text>
        </View>
        <View style={styles.frame}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#fff" size="large" />
              <Text style={styles.loadingText}>Looking up product…</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={22} color="#fff" />
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const CORNER = 28;
const BORDER = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, gap: 16, padding: 32 },
  permText: { color: colors.textSecondary, fontSize: 15, textAlign: 'center' },
  permBtn: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingHorizontal: 24, paddingVertical: 12 },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  overlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 60 },
  topHint: { backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: radius.pill, paddingHorizontal: 20, paddingVertical: 10 },
  hintText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  frame: {
    width: 260,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#fff', borderRadius: 4 },
  tl: { top: 0, left: 0, borderTopWidth: BORDER, borderLeftWidth: BORDER },
  tr: { top: 0, right: 0, borderTopWidth: BORDER, borderRightWidth: BORDER },
  bl: { bottom: 0, left: 0, borderBottomWidth: BORDER, borderLeftWidth: BORDER },
  br: { bottom: 0, right: 0, borderBottomWidth: BORDER, borderRightWidth: BORDER },
  loadingBox: { alignItems: 'center', gap: 10 },
  loadingText: { color: '#fff', fontSize: 14 },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: radius.pill, paddingHorizontal: 20, paddingVertical: 10 },
  cancelText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
