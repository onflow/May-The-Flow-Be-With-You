## Setup Instructions

### 1. Install Dependencies

```bash
flutter pub get
```

### 2. Add TensorFlow Lite Model

Place your trained TensorFlow Lite model file in `assets/models/animal_classifier.tflite`

The model should:
- Accept 224x224x3 RGB images
- Output probabilities for classes: frog, iguana, other
- Be quantized for mobile deployment

### 3. Configure Permissions

#### Android (android/app/src/main/AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.INTERNET" />
```

#### iOS (ios/Runner/Info.plist)
```xml
<key>NSCameraUsageDescription</key>
<string>This app needs camera access to capture animal images</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs photo library access to select animal images</string>
```

### 4. Run the Application

```bash
flutter run
```

## Usage

1. **Select Image**: Use camera or gallery to select a frog or iguana image
2. **Classify**: Tap "Confirm Animal" to run AI classification
3. **Connect Wallet**: Connect your wallet to sign transactions
4. **Mint NFT**: Once image is verified and wallet connected, mint your NFT

## Architecture

- **Provider Pattern**: State management using Provider package
- **Service Layer**: Separate services for AI, wallet, and NFT operations
- **Modular Design**: Clean separation of concerns

## Flow Testnet Configuration

- RPC URL: https://testnet.evm.nodes.onflow.org
- Network: Flow EVM Testnet
- Chain ID: 545 (Flow EVM Testnet)

## AI Model Requirements

Your TensorFlow Lite model should:
- Input shape: [1, 224, 224, 3]
- Output shape: [1, 3] (frog, iguana, other)
- Input normalization: [-1, 1] range
- Format: .tflite
