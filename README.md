# InstaSupply — Driver Delivery App

A functional driver delivery app built with React Native (Expo) and Firebase. Handles authentication, delivery management, route optimisation, and push notifications.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native (Expo SDK 55) |
| Auth | Firebase Authentication (Email + Phone OTP) |
| Database | Cloud Firestore |
| Push | Firebase Cloud Messaging (FCM) |
| Maps | react-native-maps + Google Maps Directions API |
| Navigation | React Navigation 7 |
| Cloud Functions | Firebase Functions v2 |

## Setup

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g eas-cli`)
- Firebase project (Blaze plan for Cloud Functions)
- Google Maps API key (Directions API enabled)
- Android Studio / Xcode for local development

### 1. Clone & Install

```bash
git clone <repo-url>
cd InstaSupply
npm install
cd functions && npm install && cd ..
```

### 2. Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Email/Password** and **Phone** sign-in methods in Authentication
3. Create a **Firestore** database
4. Download `google-services.json` (Android) and place it in the project root
5. Download `GoogleService-Info.plist` (iOS) and place it in the project root

### 3. Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Directions API** and **Maps SDK for Android**
3. Create an API key
4. Update `app.json` → `expo.android.config.googleMaps.apiKey` with your key
5. Update `GOOGLE_MAPS_API_KEY` in `src/services/route.service.ts`

### 4. Environment Config

```bash
cp .env.example .env
# Fill in your Firebase and Google Maps credentials
```

### 5. Deploy Cloud Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

### 6. Create Test Data

#### Create a test driver account:
1. Go to Firebase Console → Authentication → Add User
2. Email: `driver@test.com`, Password: `Test@123`

#### Add sample deliveries in Firestore:

Create documents in the `deliveries` collection with this structure:

```json
{
  "orderId": "ORD-001",
  "driverId": "<uid-of-test-driver>",
  "customerName": "Rahul Sharma",
  "customerAddress": "42, MG Road, Bengaluru 560001",
  "customerPhone": "+919876543210",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "status": "pending",
  "createdAt": "<server-timestamp>",
  "updatedAt": "<server-timestamp>"
}
```

Add 4-5 deliveries with different addresses and coordinates for route testing.

### 7. Run the App

```bash
# Start development build
npx expo run:android

# Or use EAS for dev builds
eas build --platform android --profile development
```

## Building the APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK (preview profile)
eas build --platform android --profile preview
```

The APK will be available for download from the EAS dashboard.

## Triggering a Test Push Notification

1. Start the app and login with the test driver account
2. Complete phone OTP verification
3. The app will automatically register for push notifications
4. Add a new delivery document to the `deliveries` collection in Firebase Console:
   - Set `driverId` to the test driver's UID
   - The Cloud Function will automatically trigger and send a push notification
5. The notification will appear in all app states:
   - **Foreground**: Shows an in-app alert
   - **Background**: System notification in the notification tray
   - **Killed**: System notification; tapping it opens the Deliveries screen

## App Flow

```
Login (Email/Password)
  ↓
Phone OTP Verification
  ↓
Deliveries Screen (real-time Firestore updates)
  ↓
Optimised Route Screen (Google Maps + route optimisation)
  ↓
Mark Delivered → Route re-optimises for remaining stops
```

## Firestore Security Rules

The app includes Firestore security rules (`firestore.rules`) that:
- Allow drivers to read/update only their own profile
- Allow drivers to read only their assigned deliveries
- Allow drivers to update only the `status` and `updatedAt` fields on deliveries
- Block direct delivery creation (only via admin/Cloud Functions)

## Project Structure

```
├── src/
│   ├── config/firebase.ts          # Firebase module re-exports
│   ├── screens/
│   │   ├── LoginScreen.tsx         # Email/password authentication
│   │   ├── OTPVerificationScreen.tsx # Phone number OTP verification
│   │   ├── DeliveriesScreen.tsx    # Main delivery list with real-time updates
│   │   └── OptimisedRouteScreen.tsx # Map + optimised route display
│   ├── services/
│   │   ├── auth.service.ts         # Firebase Auth operations
│   │   ├── delivery.service.ts     # Firestore delivery CRUD
│   │   ├── notification.service.ts # FCM registration & handlers
│   │   └── route.service.ts        # Google Maps route optimisation
│   ├── hooks/
│   │   ├── useAuth.ts              # Auth state management
│   │   └── useDeliveries.ts        # Real-time delivery subscription
│   ├── components/
│   │   ├── DeliveryCard.tsx        # Delivery list item
│   │   ├── StopCard.tsx            # Route stop item
│   │   └── StatusBadge.tsx         # Colored status indicator
│   ├── navigation/
│   │   └── AppNavigator.tsx        # Auth-gated navigation
│   └── types/index.ts              # TypeScript type definitions
├── functions/
│   └── src/index.ts                # Cloud Function: delivery → push notification
├── firestore.rules                 # Firestore security rules
├── firebase.json                   # Firebase project config
├── eas.json                        # EAS Build config
├── app.json                        # Expo config with plugins
└── .env.example                    # Environment variable template
```
