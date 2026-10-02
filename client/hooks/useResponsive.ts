import { useWindowDimensions } from 'react-native';

export interface ResponsiveInfo {
  width: number;
  height: number;
  isPhone: boolean;
  isTablet: boolean;
  isLargeTablet: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  // Recommended layout column counts for card grids
  cardColumns: number;
  // Maximum container constraints for tablets
  containerClassName: string;
}

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  const isPhone = width < 600;
  const isTablet = width >= 600;
  const isLargeTablet = width >= 900;
  const isLandscape = width > height;
  const isPortrait = !isLandscape;

  let cardColumns = 1;
  if (isLargeTablet || (isTablet && isLandscape)) {
    cardColumns = 3;
  } else if (isTablet) {
    cardColumns = 2;
  }

  // Constrains wide content on tablets so it centers neatly
  const containerClassName = isTablet ? 'max-w-5xl self-center w-full mx-auto' : 'w-full';

  return {
    width,
    height,
    isPhone,
    isTablet,
    isLargeTablet,
    isLandscape,
    isPortrait,
    cardColumns,
    containerClassName,
  };
}

export default useResponsive;
