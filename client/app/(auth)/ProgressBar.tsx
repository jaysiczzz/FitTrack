import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './dashboard';

export const ProgressBar: React.FC<{ label: string; value: string; }> = ({ label, value }) => (
    <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>{label}</Text>
        <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: value }]} />
        </View>
    </View>
);
