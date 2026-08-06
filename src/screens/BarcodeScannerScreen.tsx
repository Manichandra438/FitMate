import React, { useState, useEffect } from 'react';
import { appAlert } from '../components/AppAlert';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions, scanFromURLAsync } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
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

  const resolveBarcode = async (code: string) => {
    setLoading(true);
    const food = await lookupBarcode(code);
    setLoading(false);
    if (food) {
      route.params.onFound(food);
      navigation.goBack();
    } else {
      appAlert(
        'Not found',
        `No nutrition data found for barcode ${code}. Try searching by name.`,
        [
          { text: 'Scan again', onPress: () => setScanning(true) },
          { text: 'Go back', onPress: () => navigation.goBack() },
        ]
      );
    }
  };

  const handleBarcode = async ({ data }: { data: string }) => {
    if (!scanning || loading) return;
    setScanning(false);
    await resolveBarcode(data);
  };

  const handlePickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      appAlert('Permission needed', 'Allow photo library access to scan barcodes from images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    setLoading(true);
    setScanning(false);

    const uri = result.assets[0].uri;
    const found = await scanFromURLAsync(uri, ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr']);
    setLoading(false);

    if (!found || found.length === 0) {
      appAlert(
        'No barcode found',
        'Could not detect a barcode in that image. Try a clearer photo or scan directly.',
        [
          { text: 'Pick another', onPress: () => handlePickFromGallery() },
          { text: 'Scan with camera', onPress: () => setScanning(true) },
        ]
      );
      return;
    }

    await resolveBarcode(found[0].data);
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
        <TouchableOpacity style={styles.galleryPermBtn} onPress={handlePickFromGallery}>
          <Ionicons name="images-outline" size={18} color={colors.primary} />
          <Text style={styles.galleryPermBtnText}>Pick from gallery instead</Text>
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

        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.galleryBtn} onPress={handlePickFromGallery} activeOpacity={0.8}>
            <Ionicons name="images-outline" size={20} color="#fff" />
            <Text style={styles.galleryBtnText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={22} color="#fff" />
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const CORNER = 28;
const BORDER = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    gap: 16,
    padding: 32,
  },
  permText: { color: colors.textSecondary, fontSize: 15, textAlign: 'center' },
  permBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  galleryPermBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  galleryPermBtnText: { color: colors.primary, fontWeight: '700', fontSize: 14 },

  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  topHint: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
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

  bottomRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,122,89,0.85)',
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  galleryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cancelText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
