import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useFoodScanner } from '@/hooks/useFoodScanner';
import colors from '@/constants/colors';

export default function FoodScannerScreen() {
  const [activeTab, setActiveTab] = useState<'barcode' | 'meal'>('barcode');
  const [searchQuery, setSearchQuery] = useState('');
  const { recentScans, clearAllScans, searchScans } = useFoodScanner();

  const displayedScans =
    searchQuery.trim() === '' ? recentScans : searchScans(searchQuery);

  const renderRecentScanItem = (item: typeof recentScans[0]) => (
    <View style={styles.scanItem} key={item.id}>
      <View style={styles.scanItemLeft}>
        <Text style={styles.itemIcon}>{item.icon}</Text>
        <View>
          <Text style={styles.itemName}>
            {item.name} {item.quantity && <Text>{item.quantity}</Text>}
          </Text>
          <Text style={styles.itemTime}>{item.timestamp}</Text>
        </View>
      </View>
      <View style={styles.scanItemRight}>
        <Text style={styles.itemCalories}>{item.calories} kcal</Text>
        <Text style={styles.itemTimestamp}>{item.timestamp}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FitTrack</Text>
        <TouchableOpacity>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Screen Title */}
        <Text style={styles.screenTitle}>Food Scanner</Text>
        <Text style={styles.screenSubtitle}>
          Scan barcode or search to log nutrition
        </Text>

        {/* Tab Buttons */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'barcode' && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab('barcode')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'barcode' && styles.tabTextActive,
              ]}
            >
              Barcode
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'meal' && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab('meal')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'meal' && styles.tabTextActive,
              ]}
            >
              Meal Search
            </Text>
          </TouchableOpacity>
        </View>

        {/* Camera/Scanner Area */}
        {activeTab === 'barcode' && (
          <>
            <View style={styles.scannerContainer}>
              <View style={styles.cameraFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                <View style={styles.cameraPlaceholder}>
                  <Text style={styles.cameraText}>📷</Text>
                </View>
              </View>
              <Text style={styles.scannerHint}>Point camera at barcode</Text>
              <TouchableOpacity style={styles.flashButton}>
                <Text style={styles.flashText}>⚡</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search food or barcode..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Recent Scans */}
        <View style={styles.recentScansContainer}>
          <View style={styles.recentScansHeader}>
            <Text style={styles.recentScansTitle}>Recent Scans</Text>
            {displayedScans.length > 0 && (
              <TouchableOpacity onPress={clearAllScans}>
                <Text style={styles.clearAllText}>Clear all</Text>
              </TouchableOpacity>
            )}
          </View>

          {displayedScans.length > 0 ? (
            displayedScans.map((item) => renderRecentScanItem(item))
          ) : (
            <Text style={styles.emptyText}>No scans found</Text>
          )}
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.logButton}
          onPress={() => {
            // Handle logging scanned food
          }}
        >
          <Text style={styles.logButtonText}>+ Log Scanned Food</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
  },
  menuIcon: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 24,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.background,
  },
  scannerContainer: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  cameraFrame: {
    width: 120,
    height: 120,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: colors.accent,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  cameraPlaceholder: {
    width: 116,
    height: 116,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 160, 0.05)',
  },
  cameraText: {
    fontSize: 32,
  },
  scannerHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
  },
  flashButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashText: {
    fontSize: 16,
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchInput: {
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
  recentScansContainer: {
    marginBottom: 20,
  },
  recentScansHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentScansTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  clearAllText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
  },
  scanItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  scanItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  itemIcon: {
    fontSize: 24,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  itemTime: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  scanItemRight: {
    alignItems: 'flex-end',
  },
  itemCalories: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  itemTimestamp: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 20,
    marginBottom: 20,
  },
  bottomButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: colors.background,
  },
  logButton: {
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
});
