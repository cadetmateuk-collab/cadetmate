import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { webPath } from '../lib/openWeb';

/**
 * In-app WebView for web-only surfaces (simulators, admin, rich module HTML).
 * Auth cookies are not shared with Expo Supabase sessions — users may need to
 * sign in again inside the WebView until cookie bridging is added.
 */
export default function WebviewScreen() {
  const { path, title } = useLocalSearchParams<{ path?: string; title?: string }>();
  const uri = webPath(path && path.startsWith('/') ? path : '/home');

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: title || 'CadetMate Web' }} />
      <WebView
        source={{ uri }}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator color="#5B8CFF" />
          </View>
        )}
        allowsBackForwardNavigationGestures
        setSupportMultipleWindows={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1F3A' },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B1F3A',
  },
});
