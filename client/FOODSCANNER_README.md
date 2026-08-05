# FitTrack Food Scanner - React Native

A modern, feature-rich food scanner application built with React Native and Expo. Scan barcodes or search for meals to track your nutritional intake with an elegant dark-themed interface.

## 📱 Features

- **Barcode Scanning**: Point your camera at barcodes to quickly log foods
- **Meal Search**: Search for foods by name or barcode
- **Tab Navigation**: Easy switching between Barcode and Meal Search modes
- **Recent Scans**: Quick access to recently logged foods with calorie counts
- **Dark Theme**: Beautiful dark UI with cyan accent colors
- **Search Functionality**: Filter recent scans by name or barcode
- **Responsive Design**: Optimized for mobile devices with safe area handling

## 🎨 UI Components

### Color Scheme
- **Background**: `#0B0F1A` (Dark Navy)
- **Surface**: `#111726` (Slightly lighter)
- **Accent**: `#00E5A0` (Cyan Green)
- **Text Primary**: `#FFFFFF` (White)
- **Text Muted**: `#8A93A6` (Gray)

### Key UI Elements

1. **Header**: 
   - FitTrack branding
   - Menu button

2. **Tab Navigation**:
   - Barcode Tab (with camera frame)
   - Meal Search Tab

3. **Scanner View**:
   - Camera placeholder with corner guides
   - Flash toggle button
   - Camera instructions

4. **Search Input**: 
   - Searchable food/barcode input field

5. **Recent Scans List**:
   - Food icon
   - Food name and quantity
   - Calorie count
   - Time logged
   - Clear all button

6. **Action Button**:
   - "Log Scanned Food" button at bottom

## 📁 File Structure

```
client/
├── app/
│   ├── _layout.tsx           # Root layout with font configuration
│   ├── index.tsx             # Entry point redirecting to FoodScanner
│   └── foodscanner.tsx       # Main FoodScanner screen component
├── hooks/
│   └── useFoodScanner.ts     # Custom hook for food scanner state management
├── constants/
│   └── colors.ts             # Color palette definitions
├── components/               # Reusable UI components
├── assets/                   # Images and icons
└── package.json             # Dependencies configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- Expo CLI (optional but recommended)

### Installation

1. **Navigate to client directory**:
   ```bash
   cd client
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

### Running on Different Platforms

- **iOS**: `npm run ios`
- **Android**: `npm run android`
- **Web**: `npm run web`

## 🔧 Hook Usage

### useFoodScanner

Custom hook managing food scanner state and operations.

```typescript
const {
  recentScans,     // Array of recently scanned foods
  addScan,         // Function to add new scan
  removeScan,      // Function to remove specific scan
  clearAllScans,   // Function to clear all scans
  searchScans,     // Function to search scans by name or barcode
} = useFoodScanner();
```

**Example Usage**:
```typescript
const { recentScans, addScan, clearAllScans } = useFoodScanner();

// Add a new scan
addScan({
  name: 'Apple',
  calories: 95,
  icon: '🍎',
  barcode: '123456789',
});

// Clear all scans
clearAllScans();
```

## 🎯 Features in Detail

### Barcode Scanner Tab
- Camera preview placeholder
- Corner guides for alignment
- Flash button for low-light conditions
- Real-time barcode detection (ready for implementation)

### Meal Search Tab
- Text input for food search
- Real-time filtering of recent scans
- Support for searching by food name or barcode

### Recent Scans Management
- Displays last 3 scans by default
- Shows food icon, name, quantity, and calories
- Time-based sorting
- Individual and bulk delete options
- Search filtering

## 🔌 Integration Points

### Future Integrations
- Barcode detection library (expo-camera + react-native-barcode-scanner)
- Backend API for nutrition database
- User authentication
- Cloud sync for scan history
- Advanced meal planning features

## 📱 Responsive Design

The app is designed to work on various screen sizes:
- Maximum width: 480px (phone-optimized)
- Safe area handling for notched devices
- Scrollable content with fixed header and footer

## 🎨 Customization

### Adding New Foods
Modify the `INITIAL_SCANS` in `useFoodScanner.ts`:

```typescript
const INITIAL_SCANS: RecentScan[] = [
  {
    id: 'unique-id',
    name: 'Food Name',
    calories: 100,
    timestamp: 'time-ago',
    icon: '🍎',
    barcode: 'barcode-number',
  },
  // ... more foods
];
```

### Changing Colors
Update values in `constants/colors.ts`:

```typescript
const colors = {
  background: '#0B0F1A',
  surface: '#111726',
  accent: '#00E5A0',
  // ... other colors
};
```

## 🧪 Testing

The app includes mock data for testing the UI. All interactive elements (tabs, buttons, search) are functional with the mock data.

## 🚦 Status

✅ UI Implementation Complete
🔄 Ready for API Integration
📋 Ready for Camera Integration
🔐 Ready for Authentication Integration

## 📝 License

This project is part of FitTrack application suite.

## 👥 Contributing

When contributing:
1. Maintain the existing code style
2. Update this README if adding new features
3. Test on both iOS and Android platforms
4. Use TypeScript for type safety

## 📧 Support

For issues or suggestions, please refer to the main FitTrack repository.
