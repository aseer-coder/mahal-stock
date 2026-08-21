import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { useColors } from "@/hooks/use-colors";

function createTabIcon(name: React.ComponentProps<typeof MaterialIcons>["name"]) {
  return function TabBarIcon({ color }: { color: string }) {
    return <MaterialIcons name={name} color={color} size={24} />;
  };
}

export default function TabLayout() {
  const colors = useColors(); const insets = useSafeAreaInsets(); const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarButton: HapticTab, tabBarStyle: { height: 61 + bottomPadding, paddingTop: 7, paddingBottom: bottomPadding, backgroundColor: colors.surface, borderTopColor: colors.border }, tabBarLabelStyle: { fontSize: 11, fontWeight: "700" } }}>
    <Tabs.Screen name="index" options={{ title: "الرئيسية", tabBarIcon: createTabIcon("home") }} />
    <Tabs.Screen name="sale" options={{ title: "البيع", tabBarIcon: createTabIcon("point-of-sale") }} />
    <Tabs.Screen name="products" options={{ title: "المنتجات", tabBarIcon: createTabIcon("inventory-2") }} />
    <Tabs.Screen name="stock" options={{ title: "المخزون", tabBarIcon: createTabIcon("warehouse") }} />
    <Tabs.Screen name="settings" options={{ title: "الإعدادات", tabBarIcon: createTabIcon("settings") }} />
  </Tabs>;
}
