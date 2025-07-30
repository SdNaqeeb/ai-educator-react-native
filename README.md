# AI Educator Mobile App

A professional React Native mobile application converted from the original ReactJS web app. This app provides a comprehensive AI-powered learning platform for students with features like question solving, progress tracking, analytics, and more.

## 🚀 Features

- **Authentication**: Secure login/signup with role-based access (Student/Teacher)
- **Question Generation**: Generate questions by class, subject, and chapter
- **Camera Integration**: Capture handwritten answers with OCR support
- **Progress Tracking**: Monitor learning progress with XP, levels, and achievements
- **Analytics Dashboard**: Detailed analytics and performance metrics
- **Leaderboard**: Competitive learning with rankings
- **Quests & Challenges**: Gamified learning experience
- **Chat Assistant**: AI-powered learning assistant
- **Real-time Notifications**: Push notifications for achievements and updates
- **Offline Support**: Continue learning even without internet

## 📱 Tech Stack

- **Framework**: React Native (Expo)
- **Navigation**: React Navigation 6
- **State Management**: React Context API
- **Networking**: Axios
- **UI Components**: Custom components with Expo Vector Icons
- **Animations**: React Native Reanimated & Expo Linear Gradient
- **Camera**: Expo Camera & Image Picker
- **Notifications**: Expo Notifications
- **Secure Storage**: Expo Secure Store
- **Sound**: Expo AV

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Step 1: Install Dependencies

```bash
cd ai-student-react-native
npm install
# or
yarn install
```

### Step 2: Install Expo CLI (if not already installed)

```bash
npm install -g @expo/cli
```

### Step 3: Start the Development Server

```bash
expo start
# or
npm start
```

### Step 4: Run on Device/Simulator

- **iOS**: Press `i` in the terminal or scan QR code with Expo Go app
- **Android**: Press `a` in the terminal or scan QR code with Expo Go app
- **Web**: Press `w` in the terminal

## 📦 Build for Production

### Android APK

```bash
expo build:android
```

### iOS App

```bash
expo build:ios
```

### Using EAS Build (Recommended)

```bash
npm install -g @expo/eas-cli
eas build --platform android
eas build --platform ios
```

## 🔧 Configuration

### Backend URL

Update the backend URL in `src/api/axiosInstance.js`:

```javascript
const BASE_URL = "https://your-backend-url.com/";
```

### App Configuration

Modify `app.json` for app-specific settings:

- App name and slug
- Icons and splash screen
- Permissions
- Push notification settings

## 📁 Project Structure

```
ai-student-react-native/
├── src/
│   ├── api/                 # API configuration
│   ├── components/          # Reusable UI components
│   ├── contexts/           # React Context providers
│   ├── navigation/         # Navigation configuration
│   ├── screens/            # Screen components
│   ├── utils/              # Utility functions
│   └── hooks/              # Custom hooks
├── assets/                 # Static assets (images, sounds, fonts)
├── App.js                  # Main app entry point
├── app.json               # Expo configuration
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## 🔑 Key Components

### Authentication Flow

- `LoginScreen.js` - User authentication
- `SignupScreen.js` - User registration
- `AuthContext.js` - Authentication state management

### Main Features

- `StudentDashScreen.js` - Main dashboard for students
- `SolveQuestionScreen.js` - Question solving interface
- `QuestionGeneratorForm.js` - Question selection form
- `CameraCapture.js` - Answer capture functionality

### Navigation

- `RootNavigator.js` - Main navigation structure
- Tab-based navigation for main features
- Stack navigation for detailed views

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface
- **Dark Mode Support**: Automatic theme switching
- **Responsive Layout**: Optimized for all screen sizes
- **Smooth Animations**: Enhanced user experience
- **Accessibility**: Voice-over and screen reader support

## 📊 State Management

The app uses React Context API for state management:

- `AuthContext` - User authentication
- `ProgressContext` - Learning progress tracking
- `NotificationContext` - Push notifications
- `LeaderboardContext` - Rankings and competition
- `QuestContext` - Challenges and achievements

## 🔔 Notifications

Expo Notifications is used for:

- Achievement unlocks
- Study reminders
- Progress milestones
- Homework deadlines

## 📷 Camera Integration

- **Image Capture**: Take photos of handwritten answers
- **Gallery Selection**: Choose images from device gallery
- **OCR Processing**: Extract text from images (backend)

## 🎵 Sound Effects

Enhanced learning experience with:

- Correct/incorrect answer sounds
- Achievement unlocks
- Level up celebrations
- Background music (optional)

## 🔒 Security

- Secure token storage with Expo Secure Store
- API request authentication
- Input validation and sanitization
- Secure image handling

## 🚀 Performance Optimization

- Lazy loading of screens
- Image optimization
- Efficient list rendering with FlatList
- Memory management for large datasets

## 🐛 Debugging

### Common Issues

1. **Metro bundler issues**: Clear cache with `expo start -c`
2. **iOS build issues**: Ensure Xcode is properly configured
3. **Android build issues**: Check Android SDK setup
4. **Network issues**: Verify backend URL and CORS settings

### Debugging Tools

- Expo Developer Tools
- React Native Debugger
- Flipper (for advanced debugging)

## 📈 Analytics & Monitoring

Consider integrating:

- Expo Analytics
- Sentry for error tracking
- Firebase Analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Note**: This React Native app maintains all the functionality of the original ReactJS web application while providing a native mobile experience with enhanced performance and mobile-specific features.
