import React, { useState, useEffect, useCallback } from "react";
import {
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Booking } from "@/types";
import { styles, bookingStyles } from "@/app/styles/index";

const BookingCard = ({
  booking,
  onCancel,
}: {
  booking: Booking;
  onCancel: (id: string) => void;
}) => (
  <ThemedView style={bookingStyles.bookingCard}>
    <ThemedText type="subtitle">{booking.movie.title}</ThemedText>

    <ThemedView style={bookingStyles.bookingDetails}>
      <ThemedText>
        {booking.screening.date} • {booking.screening.time}
      </ThemedText>
      <ThemedText>{booking.screening.hall}</ThemedText>
    </ThemedView>

    <ThemedView style={bookingStyles.seatContainer}>
      <ThemedText type="defaultSemiBold">Seats: </ThemedText>
      <ThemedText>{booking.seats.join(", ")}</ThemedText>
    </ThemedView>

    {/* FnB Items Section */}
    {booking.fnbItems && booking.fnbItems.length > 0 && (
      <ThemedView style={bookingStyles.fnbContainer}>
        <ThemedText type="defaultSemiBold" style={bookingStyles.fnbTitle}>
          Food & Beverages:
        </ThemedText>

        {booking.fnbItems.map((item, index) => (
          <ThemedView key={`fnb-${index}`} style={bookingStyles.fnbItem}>
            <ThemedText>
              {item.quantity}x {item.name}
            </ThemedText>
          </ThemedView>
        ))}
      </ThemedView>
    )}

    <ThemedView style={bookingStyles.summaryContainer}>
      <ThemedText type="defaultSemiBold" style={{ marginTop: 10 }}>
        Total: ${booking.grandTotal?.toFixed(2) || booking.subtotal.toFixed(2)}
      </ThemedText>
    </ThemedView>

    <ThemedText style={bookingStyles.bookingTime}>
      Booked on: {new Date(booking.bookingTime).toLocaleString()}
    </ThemedText>

    <TouchableOpacity
      style={bookingStyles.cancelButton}
      onPress={() => onCancel(booking.id)}
    >
      <ThemedText style={bookingStyles.cancelButtonText}>Cancel Booking</ThemedText>
    </TouchableOpacity>
  </ThemedView>
);

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadBookings = useCallback(async () => {
    try {
      const storedBookings = await AsyncStorage.getItem("bookings");
      if (storedBookings) {
        setBookings(JSON.parse(storedBookings));
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
      Alert.alert("Error", "Failed to load your bookings. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadBookings();
  };

  const handleCancelBooking = (bookingId: string) => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              // Remove the booking from the list
              const updatedBookings = bookings.filter(
                (booking) => booking.id !== bookingId
              );
              setBookings(updatedBookings);

              // Save to AsyncStorage
              await AsyncStorage.setItem(
                "bookings",
                JSON.stringify(updatedBookings)
              );
              Alert.alert("Success", "Your booking has been cancelled.");
            } catch (error) {
              console.error("Error cancelling booking:", error);
              Alert.alert(
                "Error",
                "Failed to cancel your booking. Please try again."
              );
              // Reload bookings to ensure UI is in sync with storage
              loadBookings();
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>
          Loading your bookings...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">My Bookings</ThemedText>
      </ThemedView>

      {bookings.length > 0 ? (
        <FlatList
          data={bookings}
          renderItem={({ item }) => (
            <BookingCard booking={item} onCancel={handleCancelBooking} />
          )}
          keyExtractor={(item) => item.id || `booking-${item.bookingTime}`}
          contentContainerStyle={bookingStyles.bookingList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
        />
      ) : (
        <ThemedView style={bookingStyles.noBookings}>
          <ThemedText type="subtitle">No bookings found</ThemedText>
          <ThemedText>Your booked tickets will appear here</ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}
