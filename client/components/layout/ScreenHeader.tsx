import React from 'react';
import { View, StyleSheet } from 'react-native';
import NavMenu from '@/components/navigation/NavMenu';

const ScreenHeader: React.FC = () => {
  return (
    <View style={styles.container}>
      <NavMenu />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
});

export default ScreenHeader;
