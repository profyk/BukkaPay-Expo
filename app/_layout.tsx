import { Stack } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "../lib/ThemeContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(screens)" />
          </Stack>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
