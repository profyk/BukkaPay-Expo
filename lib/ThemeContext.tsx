import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LightColors, DarkColors, AppColors } from "./theme";

interface ThemeContextType {
  darkMode: boolean;
  setDarkMode: (val: boolean) => Promise<void>;
  colors: AppColors;
  loaded: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  setDarkMode: async () => {},
  colors: LightColors,
  loaded: false,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [userPreference, setUserPreference] = useState<"light" | "dark" | "system">("system");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const pref = await AsyncStorage.getItem("dark_mode_pref");
      if (pref === "light" || pref === "dark" || pref === "system") {
        setUserPreference(pref);
      } else {
        const legacy = await AsyncStorage.getItem("dark_mode");
        if (legacy === "true") setUserPreference("dark");
        else if (legacy === "false") setUserPreference("light");
      }
      setLoaded(true);
    })();
  }, []);

  const isDark =
    userPreference === "system"
      ? systemScheme === "dark"
      : userPreference === "dark";

  const setDarkMode = async (enabled: boolean) => {
    const pref = enabled ? "dark" : "light";
    setUserPreference(pref);
    await AsyncStorage.setItem("dark_mode_pref", pref);
    await AsyncStorage.setItem("dark_mode", String(enabled));
  };

  return (
    <ThemeContext.Provider
      value={{
        darkMode: isDark,
        setDarkMode,
        colors: isDark ? DarkColors : LightColors,
        loaded,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}
