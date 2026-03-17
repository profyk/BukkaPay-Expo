import { useState } from "react";
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, Dimensions, Platform, StatusBar
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useToast } from "../hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../lib/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const STATUSBAR_HEIGHT = Platform.OS === "android" ? (StatusBar.currentHeight || 24) : 44;
const CARD_WIDTH = (SCREEN_WIDTH - 48 - 12) / 2;

interface Product {
  id: string;
  name: string;
  provider: string;
  price: number;
  value: string;
  description: string;
  iconName: string;
  category: string;
  rating: number;
  discount?: number;
  color: string;
}

interface CartItem extends Product { quantity: number }
interface Order {
  id: string;
  items: CartItem[];
  total: number;
  date: Date;
  status: "completed" | "pending" | "failed";
}

const products: Product[] = [
  { id: "airtime-att-10", name: "AT&T Airtime", provider: "AT&T", price: 10, value: "$10 Credit", description: "Prepaid phone credit", iconName: "phone-portrait", category: "airtime", rating: 4.8, color: "#00A8E0" },
  { id: "airtime-verizon-25", name: "Verizon Airtime", provider: "Verizon", price: 25, value: "$25 Credit", description: "Prepaid phone credit", iconName: "phone-portrait", category: "airtime", rating: 4.7, color: "#CD040B" },
  { id: "airtime-tmobile-50", name: "T-Mobile Airtime", provider: "T-Mobile", price: 50, value: "$50 Credit", description: "Prepaid phone credit", iconName: "phone-portrait", category: "airtime", rating: 4.6, discount: 5, color: "#E20074" },
  { id: "data-att-5gb", name: "5GB Data Plan", provider: "AT&T", price: 30, value: "5GB / 30 days", description: "Monthly data add-on", iconName: "wifi", category: "data", rating: 4.7, color: "#00A8E0" },
  { id: "data-verizon-10gb", name: "10GB Data Plan", provider: "Verizon", price: 50, value: "10GB / 30 days", description: "Monthly data add-on", iconName: "wifi", category: "data", rating: 4.6, color: "#CD040B" },
  { id: "data-tmobile-unlimited", name: "Unlimited Data", provider: "T-Mobile", price: 75, value: "Unlimited / 30 days", description: "Unlimited monthly data", iconName: "wifi", category: "data", rating: 4.8, discount: 10, color: "#E20074" },
  { id: "utility-electric-50", name: "Electric Bill", provider: "Local Utility", price: 50, value: "$50 Payment", description: "Pay your electric bill", iconName: "flash", category: "utilities", rating: 4.6, color: "#F59E0B" },
  { id: "utility-electric-100", name: "Electric Bill", provider: "Local Utility", price: 100, value: "$100 Payment", description: "Pay your electric bill", iconName: "flash", category: "utilities", rating: 4.7, color: "#F59E0B" },
  { id: "utility-water-75", name: "Water Bill", provider: "Water Authority", price: 75, value: "$75 Payment", description: "Pay your water bill", iconName: "water", category: "utilities", rating: 4.8, color: "#3B82F6" },
  { id: "streaming-netflix", name: "Netflix", provider: "Netflix", price: 15.99, value: "1 Month", description: "Standard HD plan", iconName: "tv", category: "streaming", rating: 4.9, color: "#E50914" },
  { id: "streaming-hulu", name: "Hulu", provider: "Hulu", price: 12.99, value: "1 Month", description: "Ad-free streaming", iconName: "tv", category: "streaming", rating: 4.7, color: "#1CE783" },
  { id: "streaming-disney", name: "Disney+", provider: "Disney", price: 10.99, value: "1 Month", description: "Disney streaming", iconName: "tv", category: "streaming", rating: 4.8, color: "#113CCF" },
  { id: "streaming-spotify", name: "Spotify Premium", provider: "Spotify", price: 9.99, value: "1 Month", description: "Ad-free music", iconName: "musical-notes", category: "streaming", rating: 4.9, discount: 10, color: "#1DB954" },
  { id: "insurance-health", name: "Health Insurance", provider: "HealthGuard", price: 150, value: "Monthly Premium", description: "Family health coverage", iconName: "medkit", category: "insurance", rating: 4.8, color: "#EF4444" },
  { id: "insurance-travel", name: "Travel Insurance", provider: "TravelSafe", price: 25, value: "Per Trip", description: "Full coverage while traveling", iconName: "airplane", category: "insurance", rating: 4.6, color: "#6366F1" },
  { id: "giftcard-amazon-25", name: "Amazon $25", provider: "Amazon", price: 25, value: "$25 Gift Card", description: "Shop anything on Amazon", iconName: "gift", category: "giftcards", rating: 4.9, color: "#FF9900" },
  { id: "giftcard-amazon-50", name: "Amazon $50", provider: "Amazon", price: 50, value: "$50 Gift Card", description: "Shop anything on Amazon", iconName: "gift", category: "giftcards", rating: 4.9, color: "#FF9900" },
  { id: "giftcard-starbucks", name: "Starbucks", provider: "Starbucks", price: 25, value: "$25 Gift Card", description: "Coffee and treats", iconName: "cafe", category: "giftcards", rating: 4.8, color: "#00704A" },
  { id: "giftcard-apple", name: "Apple Gift Card", provider: "Apple", price: 50, value: "$50 Gift Card", description: "Apps, games & more", iconName: "gift", category: "giftcards", rating: 4.9, discount: 5, color: "#555555" },
  { id: "giftcard-google", name: "Google Play", provider: "Google", price: 25, value: "$25 Gift Card", description: "Apps, games & entertainment", iconName: "logo-google-playstore", category: "giftcards", rating: 4.8, color: "#4285F4" },
  { id: "voucher-uber-25", name: "Uber Credit", provider: "Uber", price: 25, value: "$25 Credit", description: "Rides & Uber Eats", iconName: "car", category: "vouchers", rating: 4.8, color: "#000000" },
  { id: "voucher-doordash-30", name: "DoorDash", provider: "DoorDash", price: 30, value: "$30 Credit", description: "Food delivery credit", iconName: "fast-food", category: "vouchers", rating: 4.7, color: "#FF3008" },
  { id: "voucher-grubhub-25", name: "Grubhub", provider: "Grubhub", price: 25, value: "$25 Credit", description: "Order from local restaurants", iconName: "restaurant", category: "vouchers", rating: 4.6, discount: 10, color: "#F63440" },
  { id: "voucher-target-50", name: "Target Voucher", provider: "Target", price: 50, value: "$50 Credit", description: "Shop anything at Target", iconName: "storefront", category: "vouchers", rating: 4.9, color: "#CC0000" },
  { id: "voucher-gym-30", name: "Gym Pass", provider: "ClassPass", price: 30, value: "1 Month Access", description: "Access to gyms & fitness", iconName: "barbell", category: "vouchers", rating: 4.6, color: "#7C3AED" },
  { id: "ticket-movie", name: "Movie Ticket", provider: "AMC Theaters", price: 15, value: "1 Ticket", description: "Standard showing", iconName: "film", category: "tickets", rating: 4.6, color: "#B45309" },
  { id: "ticket-sports", name: "Sports Game", provider: "StubHub", price: 75, value: "1 Ticket", description: "Local team game", iconName: "football", category: "tickets", rating: 4.8, discount: 8, color: "#059669" },
  { id: "ticket-flight", name: "Flight Booking", provider: "BukkaPay Travel", price: 299, value: "Round Trip", description: "Economy class", iconName: "airplane", category: "tickets", rating: 4.9, color: "#2563EB" },
];

const categories = [
  { id: "all", label: "All", icon: "apps" as const, color: "#7C3AED" },
  { id: "airtime", label: "Airtime", icon: "phone-portrait" as const, color: "#00A8E0" },
  { id: "data", label: "Data", icon: "wifi" as const, color: "#10B981" },
  { id: "utilities", label: "Bills", icon: "flash" as const, color: "#F59E0B" },
  { id: "streaming", label: "Streaming", icon: "tv" as const, color: "#EF4444" },
  { id: "insurance", label: "Insurance", icon: "shield-checkmark" as const, color: "#6366F1" },
  { id: "giftcards", label: "Gift Cards", icon: "gift" as const, color: "#EC4899" },
  { id: "vouchers", label: "Vouchers", icon: "ticket" as const, color: "#F97316" },
  { id: "tickets", label: "Tickets", icon: "film" as const, color: "#059669" },
];

type Stage = "browse" | "cart" | "checkout" | "pin" | "success" | "orders";

export default function Buy() {
  const router = useRouter();
  const { toast } = useToast();
  const { colors } = useTheme();
  const [stage, setStage] = useState<Stage>("browse");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sortBy, setSortBy] = useState<"rating" | "price-low" | "price-high">("rating");
  const [pin, setPin] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const { data: cards = [] } = useQuery<any[]>({ queryKey: ["/api/wallet-cards"] });
  const walletBalance = cards.reduce((s: number, c: any) => s + parseFloat(c.balance || "0"), 0);
  const primaryCard = cards[0];

  const deductBalanceMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!primaryCard) throw new Error("No wallet card found");
      const newBalance = (parseFloat(primaryCard.balance || "0") - amount).toFixed(2);
      return apiRequest("PATCH", `/api/wallet-cards/${primaryCard.id}`, { balance: newBalance });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/wallet-cards"] }),
  });

  const getDiscountedPrice = (p: Product) =>
    p.discount ? p.price * (1 - p.discount / 100) : p.price;

  const cartTotal = cart.reduce((s, i) => s + getDiscountedPrice(i) * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const filteredProducts = products
    .filter(
      (p) =>
        (activeCategory === "all" || p.category === activeCategory) &&
        (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.provider.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) =>
      sortBy === "price-low" ? a.price - b.price :
      sortBy === "price-high" ? b.price - a.price :
      b.rating - a.rating
    );

  const addToCart = (product: Product) => {
    const existing = cart.find((i) => i.id === product.id);
    if (existing) {
      setCart(cart.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast({ title: "Added!", description: `${product.name} added to cart` });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map((i) => i.id === id ? { ...i, quantity: i.quantity + delta } : i).filter((i) => i.quantity > 0));
  };

  const removeFromCart = (id: string) => setCart(cart.filter((i) => i.id !== id));

  const handleProceedToPin = () => {
    if (cartTotal > walletBalance) {
      toast({ title: "Insufficient Balance", description: "Please top up your wallet", variant: "destructive" });
      return;
    }
    setStage("pin");
  };

  const handleConfirmPurchase = async () => {
    const storedPin = (await AsyncStorage.getItem("wallet_pin")) || "1234";
    if (pin !== storedPin) {
      toast({ title: "Invalid PIN", description: "Incorrect PIN entered", variant: "destructive" });
      setPin("");
      return;
    }
    try {
      await deductBalanceMutation.mutateAsync(cartTotal);
      const order: Order = {
        id: `ORD-${Date.now().toString(36).toUpperCase()}`,
        items: [...cart],
        total: cartTotal,
        date: new Date(),
        status: "completed",
      };
      setCurrentOrder(order);
      setOrders([order, ...orders]);
      setCart([]);
      setPin("");
      setPhoneNumber("");
      setAccountNumber("");
      setStage("success");
    } catch (error: any) {
      toast({ title: "Payment Failed", description: error.message || "Could not process payment", variant: "destructive" });
      setPin("");
    }
  };

  const activeCat = categories.find((c) => c.id === activeCategory);

  if (stage === "success" && currentOrder) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }]}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={48} color="#FFFFFF" />
        </View>
        <Text style={[styles.successTitle, { color: colors.text }]}>Purchase Complete!</Text>
        <Text style={[styles.mutedText, { color: colors.textSecondary }]}>Your order has been processed successfully</Text>

        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { label: "Order ID", value: currentOrder.id, mono: true },
            { label: "Items", value: `${currentOrder.items.reduce((s, i) => s + i.quantity, 0)} items` },
            { label: "Total Paid", value: `$${currentOrder.total.toFixed(2)}`, bold: true },
          ].map((row) => (
            <View key={row.label} style={[styles.summaryRow, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{row.label}</Text>
              <Text style={[row.mono ? styles.monoText : row.bold ? styles.summaryValueBold : styles.summaryValue, { color: colors.text }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View style={{ width: "100%", gap: 12, marginTop: 24 }}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => { setStage("orders"); setCurrentOrder(null); }}>
            <Ionicons name="receipt-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>View Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.outlineButton, { borderColor: colors.border }]} onPress={() => { setStage("browse"); setCurrentOrder(null); }}>
            <Text style={[styles.outlineBtnText, { color: colors.text }]}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (stage === "pin") {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={[styles.pageHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setStage("checkout")} style={[styles.iconBtn, { backgroundColor: colors.surface }]}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Enter PIN</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <View style={[styles.pinAmountCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.pinAmountLabel, { color: colors.textSecondary }]}>Total to Pay</Text>
            <Text style={[styles.pinAmountValue, { color: colors.text }]}>${cartTotal.toFixed(2)}</Text>
          </View>

          <Text style={[styles.pinHint, { color: colors.textSecondary }]}>Enter your 4-digit wallet PIN</Text>

          <View style={styles.pinDots}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.pinDot, { borderColor: pin.length > i ? "#7C3AED" : colors.border, backgroundColor: pin.length > i ? "rgba(124,58,237,0.1)" : colors.surface }]}>
                {pin.length > i && <View style={styles.pinDotFill} />}
              </View>
            ))}
          </View>

          <View style={styles.numpad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "del"].map((num, i) => (
              <TouchableOpacity
                key={i}
                disabled={num === ""}
                onPress={() => {
                  if (num === "del") { setPin(pin.slice(0, -1)); }
                  else if (num !== "" && pin.length < 4) {
                    const newPin = pin + num;
                    setPin(newPin);
                    if (newPin.length === 4) setTimeout(() => handleConfirmPurchase(), 300);
                  }
                }}
                style={[styles.numpadBtn, { backgroundColor: colors.surface, borderColor: colors.border }, num === "" && { opacity: 0 }]}
              >
                {num === "del"
                  ? <Ionicons name="backspace-outline" size={22} color={colors.text} />
                  : <Text style={[styles.numpadText, { color: colors.text }]}>{num}</Text>
                }
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  }

  if (stage === "checkout") {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={[styles.pageHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setStage("cart")} style={[styles.iconBtn, { backgroundColor: colors.surface }]}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Checkout</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionCardTitle, { color: colors.text }]}>Order Summary</Text>
            {cart.map((item) => (
              <View key={item.id} style={[styles.checkoutRow, { borderBottomColor: colors.borderLight }]}>
                <View style={[styles.checkoutIcon, { backgroundColor: item.color + "22" }]}>
                  <Ionicons name={item.iconName as any} size={18} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.checkoutItemName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.checkoutItemSub, { color: colors.textSecondary }]}>Qty: {item.quantity} · {item.value}</Text>
                </View>
                <Text style={[styles.checkoutItemPrice, { color: colors.text }]}>${(getDiscountedPrice(item) * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
            <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total</Text>
              <Text style={[styles.totalAmount, { color: "#7C3AED" }]}>${cartTotal.toFixed(2)}</Text>
            </View>
          </View>

          {cart.some((i) => ["airtime", "data"].includes(i.category)) && (
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionCardTitle, { color: colors.text }]}>Phone Number</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder="Enter phone number"
                placeholderTextColor={colors.textMuted}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>
          )}

          {cart.some((i) => i.category === "utilities") && (
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionCardTitle, { color: colors.text }]}>Account Number</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder="Enter account number"
                placeholderTextColor={colors.textMuted}
                value={accountNumber}
                onChangeText={setAccountNumber}
              />
            </View>
          )}

          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: walletBalance >= cartTotal ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)" }]}>
            <View style={styles.walletBalanceRow}>
              <View>
                <Text style={[styles.sectionCardTitle, { color: colors.textSecondary, marginBottom: 2 }]}>Wallet Balance</Text>
                <Text style={[styles.walletAmount, { color: colors.text }]}>${walletBalance.toFixed(2)}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: walletBalance >= cartTotal ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)" }]}>
                <Ionicons name={walletBalance >= cartTotal ? "checkmark-circle" : "close-circle"} size={14} color={walletBalance >= cartTotal ? "#10B981" : "#EF4444"} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: walletBalance >= cartTotal ? "#10B981" : "#EF4444", marginLeft: 4 }}>
                  {walletBalance >= cartTotal ? "Sufficient" : "Insufficient"}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.primaryButton, { opacity: walletBalance < cartTotal ? 0.5 : 1 }]}
            onPress={handleProceedToPin}
            disabled={walletBalance < cartTotal}
          >
            <Ionicons name="lock-closed" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>Confirm & Pay ${cartTotal.toFixed(2)}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (stage === "cart") {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={[styles.pageHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setStage("browse")} style={[styles.iconBtn, { backgroundColor: colors.surface }]}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Cart ({cartCount})</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: cart.length > 0 ? 120 : 24 }}>
          {cart.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
                <Ionicons name="cart-outline" size={40} color={colors.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Your cart is empty</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Browse the marketplace to add items</Text>
              <TouchableOpacity style={[styles.primaryButton, { marginTop: 24, paddingHorizontal: 32 }]} onPress={() => setStage("browse")}>
                <Text style={styles.primaryBtnText}>Start Shopping</Text>
              </TouchableOpacity>
            </View>
          ) : (
            cart.map((item) => (
              <View key={item.id} style={[styles.cartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.cartItemIcon, { backgroundColor: item.color + "22" }]}>
                  <Ionicons name={item.iconName as any} size={24} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cartItemName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                      <Text style={[styles.cartItemProvider, { color: colors.textSecondary }]}>{item.provider} · {item.value}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeFromCart(item.id)} style={{ padding: 4 }}>
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                    <View style={[styles.qtyControl, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={styles.qtyBtn}>
                        <Ionicons name="remove" size={16} color={colors.text} />
                      </TouchableOpacity>
                      <Text style={[styles.qtyNum, { color: colors.text }]}>{item.quantity}</Text>
                      <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={styles.qtyBtn}>
                        <Ionicons name="add" size={16} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.cartItemTotal, { color: colors.text }]}>${(getDiscountedPrice(item) * item.quantity).toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {cart.length > 0 && (
          <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total ({cartCount} items)</Text>
              <Text style={[styles.totalAmount, { color: colors.text }]}>${cartTotal.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setStage("checkout")}>
              <Text style={styles.primaryBtnText}>Proceed to Checkout</Text>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  if (stage === "orders") {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={[styles.pageHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setStage("browse")} style={[styles.iconBtn, { backgroundColor: colors.surface }]}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Order History</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
          {orders.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
                <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No orders yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Your purchase history will appear here</Text>
            </View>
          ) : (
            orders.map((order) => (
              <View key={order.id} style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <Text style={[styles.monoText, { color: colors.text }]}>{order.id}</Text>
                  <View style={styles.successPill}>
                    <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                    <Text style={styles.successPillText}>Completed</Text>
                  </View>
                </View>
                {order.items.map((item, i) => (
                  <View key={i} style={[styles.orderItemRow, { borderBottomColor: colors.borderLight }]}>
                    <View style={[styles.orderItemIcon, { backgroundColor: item.color + "22" }]}>
                      <Ionicons name={item.iconName as any} size={14} color={item.color} />
                    </View>
                    <Text style={[styles.orderItemName, { color: colors.textSecondary }]} numberOfLines={1}>{item.name} x{item.quantity}</Text>
                    <Text style={[styles.orderItemPrice, { color: colors.text }]}>${(getDiscountedPrice(item) * item.quantity).toFixed(2)}</Text>
                  </View>
                ))}
                <View style={[styles.totalRow, { borderTopColor: colors.border, marginTop: 8 }]}>
                  <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
                    {order.date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                  </Text>
                  <Text style={[styles.totalAmount, { color: "#7C3AED" }]}>${order.total.toFixed(2)}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={[styles.browseHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.browseHeaderTop}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.surface }]}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.pageTitle, { color: colors.text }]}>Marketplace</Text>
            <Text style={[styles.browseSubtitle, { color: colors.textSecondary }]}>
              {filteredProducts.length} products
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity onPress={() => setStage("orders")} style={[styles.iconBtn, { backgroundColor: colors.surface }]}>
              <Ionicons name="receipt-outline" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStage("cart")} style={[styles.iconBtn, { backgroundColor: colors.surface }]}>
              <Ionicons name="cart-outline" size={20} color={colors.text} />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.searchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search products..."
            placeholderTextColor={colors.textMuted}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm("")}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.catScroll, { borderBottomColor: colors.border }]} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 12 }}>
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setActiveCategory(cat.id)}
              style={[styles.catPill, { backgroundColor: isActive ? cat.color : colors.surface, borderColor: isActive ? cat.color : colors.border }]}
            >
              <Ionicons name={cat.icon} size={15} color={isActive ? "#FFFFFF" : colors.textSecondary} />
              <Text style={[styles.catPillText, { color: isActive ? "#FFFFFF" : colors.textSecondary }]}>{cat.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.sortBar, { borderBottomColor: colors.borderLight }]}>
        <Text style={[styles.sortLabel, { color: colors.textSecondary }]}>Sort:</Text>
        {(["rating", "price-low", "price-high"] as const).map((sort) => (
          <TouchableOpacity
            key={sort}
            onPress={() => setSortBy(sort)}
            style={[styles.sortPill, { backgroundColor: sortBy === sort ? "#7C3AED" : colors.surface, borderColor: sortBy === sort ? "#7C3AED" : colors.border }]}
          >
            <Text style={[styles.sortPillText, { color: sortBy === sort ? "#FFFFFF" : colors.textSecondary }]}>
              {sort === "rating" ? "⭐ Top Rated" : sort === "price-low" ? "↑ Price" : "↓ Price"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: cartCount > 0 ? 110 : 24 }}>
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
              <Ionicons name="search-outline" size={40} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No products found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Try adjusting your search or filters</Text>
          </View>
        ) : (
          <View style={styles.productGrid}>
            {filteredProducts.map((product) => {
              const inCart = cart.find((i) => i.id === product.id);
              const discountedPrice = getDiscountedPrice(product);
              return (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => addToCart(product)}
                  activeOpacity={0.85}
                  style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border, width: CARD_WIDTH }]}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <View style={[styles.productIconWrap, { backgroundColor: product.color + "22" }]}>
                      <Ionicons name={product.iconName as any} size={22} color={product.color} />
                    </View>
                    {product.discount ? (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>-{product.discount}%</Text>
                      </View>
                    ) : inCart ? (
                      <View style={styles.inCartBadge}>
                        <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                        <Text style={styles.inCartText}>{inCart.quantity}</Text>
                      </View>
                    ) : null}
                  </View>

                  <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>{product.name}</Text>
                  <Text style={[styles.productProvider, { color: colors.textSecondary }]} numberOfLines={1}>{product.provider}</Text>
                  <Text style={[styles.productValue, { color: colors.textMuted }]} numberOfLines={1}>{product.value}</Text>

                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4, marginBottom: 10 }}>
                    <Ionicons name="star" size={11} color="#EAB308" />
                    <Text style={[styles.ratingText, { color: colors.textSecondary }]}>{product.rating}</Text>
                  </View>

                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View>
                      {product.discount && (
                        <Text style={styles.oldPrice}>${product.price.toFixed(2)}</Text>
                      )}
                      <Text style={[styles.currentPrice, { color: colors.text }]}>${discountedPrice.toFixed(2)}</Text>
                    </View>
                    <View style={[styles.addBtn, { backgroundColor: inCart ? "#10B981" : "#7C3AED" }]}>
                      <Ionicons name={inCart ? "checkmark" : "add"} size={16} color="#FFFFFF" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {cartCount > 0 && (
        <View style={[styles.floatingCart, { backgroundColor: "#7C3AED" }]}>
          <TouchableOpacity style={styles.floatingCartBtn} onPress={() => setStage("cart")}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={styles.floatingCartCount}>
                <Text style={styles.floatingCartCountText}>{cartCount}</Text>
              </View>
              <Text style={styles.floatingCartLabel}>View Cart</Text>
            </View>
            <Text style={styles.floatingCartTotal}>${cartTotal.toFixed(2)}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  pageHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: STATUSBAR_HEIGHT + 8, paddingBottom: 14,
    borderBottomWidth: 1,
  },
  pageTitle: { fontSize: 18, fontWeight: "700" },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },

  browseHeader: {
    paddingTop: STATUSBAR_HEIGHT + 8, paddingBottom: 12,
    paddingHorizontal: 16, borderBottomWidth: 1,
  },
  browseHeaderTop: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12,
  },
  browseSubtitle: { fontSize: 12, fontWeight: "500", marginTop: 1 },
  searchRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14 },

  catScroll: { borderBottomWidth: 1, flexGrow: 0 },
  catPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  catPillText: { fontSize: 13, fontWeight: "600" },

  sortBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1,
  },
  sortLabel: { fontSize: 13, fontWeight: "500", marginRight: 2 },
  sortPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  sortPillText: { fontSize: 12, fontWeight: "600" },

  productGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  productCard: {
    borderRadius: 16, borderWidth: 1, padding: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  productIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  discountBadge: { backgroundColor: "#10B981", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  discountText: { fontSize: 10, fontWeight: "700", color: "#FFFFFF" },
  inCartBadge: { flexDirection: "row", alignItems: "center", gap: 2, backgroundColor: "#10B981", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  inCartText: { fontSize: 10, fontWeight: "700", color: "#FFFFFF" },
  productName: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  productProvider: { fontSize: 12, fontWeight: "500", marginBottom: 1 },
  productValue: { fontSize: 11 },
  ratingText: { fontSize: 11, fontWeight: "500" },
  oldPrice: { fontSize: 11, color: "#9CA3AF", textDecorationLine: "line-through" },
  currentPrice: { fontSize: 15, fontWeight: "700" },
  addBtn: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },

  floatingCart: {
    position: "absolute", bottom: 24, left: 24, right: 24,
    borderRadius: 16, elevation: 8,
    shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12,
  },
  floatingCartBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16,
  },
  floatingCartCount: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center",
  },
  floatingCartCountText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  floatingCartLabel: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  floatingCartTotal: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },

  cartBadge: {
    position: "absolute", top: -2, right: -2,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center",
  },
  cartBadgeText: { fontSize: 10, fontWeight: "700", color: "#FFFFFF" },

  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  emptySubtitle: { fontSize: 14, textAlign: "center" },

  sectionCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  sectionCardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 14 },

  checkoutRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 10, borderBottomWidth: 1,
  },
  checkoutIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  checkoutItemName: { fontSize: 14, fontWeight: "600" },
  checkoutItemSub: { fontSize: 12, marginTop: 1 },
  checkoutItemPrice: { fontSize: 14, fontWeight: "700" },

  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, paddingTop: 14, marginTop: 4 },
  totalLabel: { fontSize: 14, fontWeight: "500" },
  totalAmount: { fontSize: 18, fontWeight: "700" },

  textInput: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 14, marginTop: 8,
  },
  walletBalanceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  walletAmount: { fontSize: 22, fontWeight: "700" },
  statusPill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },

  cartCard: {
    flexDirection: "row", gap: 14, borderRadius: 16,
    borderWidth: 1, padding: 14, marginBottom: 12,
  },
  cartItemIcon: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cartItemName: { fontSize: 15, fontWeight: "700" },
  cartItemProvider: { fontSize: 12, marginTop: 2 },
  cartItemTotal: { fontSize: 16, fontWeight: "700" },
  qtyControl: { flexDirection: "row", alignItems: "center", borderRadius: 10, borderWidth: 1, overflow: "hidden" },
  qtyBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  qtyNum: { fontSize: 15, fontWeight: "700", paddingHorizontal: 12 },

  orderCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  orderItemRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1 },
  orderItemIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  orderItemName: { flex: 1, fontSize: 13 },
  orderItemPrice: { fontSize: 13, fontWeight: "600" },
  successPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(16,185,129,0.15)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  successPillText: { fontSize: 11, fontWeight: "600", color: "#10B981" },
  monoText: { fontSize: 13, fontWeight: "600", fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" },

  successCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: "#10B981", alignItems: "center",
    justifyContent: "center", marginBottom: 20,
  },
  successTitle: { fontSize: 24, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  mutedText: { fontSize: 14, textAlign: "center", marginBottom: 24 },
  summaryCard: { width: "100%", borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  summaryLabel: { fontSize: 13 },
  summaryValue: { fontSize: 14, fontWeight: "500" },
  summaryValueBold: { fontSize: 18, fontWeight: "700" },

  pinAmountCard: { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: "center", width: "100%", marginBottom: 28 },
  pinAmountLabel: { fontSize: 13, fontWeight: "500", marginBottom: 6 },
  pinAmountValue: { fontSize: 36, fontWeight: "700" },
  pinHint: { fontSize: 14, marginBottom: 24 },
  pinDots: { flexDirection: "row", gap: 16, marginBottom: 36 },
  pinDot: { width: 56, height: 56, borderRadius: 14, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  pinDotFill: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#7C3AED" },
  numpad: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12, maxWidth: 280, alignSelf: "center" },
  numpadBtn: { width: 80, height: 64, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  numpadText: { fontSize: 22, fontWeight: "600" },

  primaryButton: {
    backgroundColor: "#7C3AED", borderRadius: 14, height: 52,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  outlineButton: { borderRadius: 14, height: 52, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  outlineBtnText: { fontSize: 16, fontWeight: "600" },

  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1,
  },
});
