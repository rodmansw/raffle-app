import React, { useState, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, Badge } from "@/components/ui";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { EditRaffleBottomSheet } from "@/components/EditRaffleBottomSheet";
import {
  useRaffles,
  useCreateRaffle,
  useUpdateRaffle,
  Raffle,
} from "@/hooks/use-admin-api";
import { useQueryClient } from "@tanstack/react-query";

export default function RafflesScreen() {
  const [selectedRaffle, setSelectedRaffle] = useState<Raffle | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Clear query cache on mount to ensure fresh data
  useEffect(() => {
    queryClient.removeQueries({ queryKey: ["raffles"] });
  }, [queryClient]);

  const {
    data: raffles,
    isLoading: rafflesLoading,
    refetch: refetchRaffles,
    fetchNextPage: fetchNextRaffles,
    isFetchingNextPage: isFetchingNextRaffles,
  } = useRaffles();

  const createRaffle = useCreateRaffle();
  const updateRaffle = useUpdateRaffle();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchRaffles();
    } catch (error) {
      console.error("Error refreshing raffles:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateRaffle = () => {
    setSelectedRaffle(null);
    setIsCreateModalVisible(true);
  };

  const handleEditRaffle = (raffle: Raffle) => {
    setSelectedRaffle(raffle);
    setIsEditModalVisible(true);
  };

  const handleCreateSave = async (raffleData: Partial<Raffle>) => {
    await createRaffle.mutateAsync(raffleData);
    setIsCreateModalVisible(false);
  };

  const handleEditSave = async (raffleData: Partial<Raffle>) => {
    if (!selectedRaffle) return;
    await updateRaffle.mutateAsync({
      raffleId: selectedRaffle.id,
      data: raffleData,
    });
    setIsEditModalVisible(false);
  };

  const handleModalClose = () => {
    setIsEditModalVisible(false);
    setIsCreateModalVisible(false);
    setSelectedRaffle(null);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "draft":
        return "default";
      case "open":
        return "success";
      case "closed":
        return "error";
      case "drawn":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return "Draft";
      case "open":
        return "Open";
      case "closed":
        return "Closed";
      case "drawn":
        return "Drawn";
      default:
        return status;
    }
  };

  const renderRaffleCard = (raffle: Raffle) => (
    <TouchableOpacity key={raffle.id} onPress={() => handleEditRaffle(raffle)}>
      <Card style={styles.raffleCard}>
        {/* Image */}
        {raffle.image_url && (
          <Image
            source={{ uri: raffle.image_url }}
            style={styles.raffleImage}
            resizeMode="cover"
          />
        )}

        {/* Content */}
        <View style={styles.raffleContent}>
          {/* Header */}
          <View style={styles.raffleHeader}>
            <View style={styles.raffleInfo}>
              <Text style={styles.raffleTitle}>{raffle.title}</Text>
              <Badge
                label={getStatusLabel(raffle.status)}
                variant={getStatusVariant(raffle.status)}
              />
            </View>
          </View>

          {/* Description */}
          {raffle.description && (
            <Text style={styles.raffleDescription} numberOfLines={2}>
              {raffle.description}
            </Text>
          )}

          {/* Details */}
          <View style={styles.raffleDetails}>
            <View style={styles.detailRow}>
              <IconSymbol name="ticket" size={16} color="#6b7280" />
              <Text style={styles.detailText}>
                {raffle.max_ticket_digits}-digit numbers
              </Text>
            </View>
            <View style={styles.detailRow}>
              <IconSymbol name="creditcard" size={16} color="#6b7280" />
              <Text style={styles.detailText}>
                ${raffle.ticket_price ? raffle.ticket_price.toFixed(2) : "0.00"}
              </Text>
            </View>
          </View>

          {/* Dates */}
          <View style={styles.dateInfo}>
            <Text style={styles.dateLabel}>Created:</Text>
            <Text style={styles.dateText}>
              {new Date(raffle.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderRafflesList = () => {
    if (rafflesLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Card style={styles.loadingCard}>
            <Text style={styles.loadingText}>Loading raffles...</Text>
          </Card>
        </View>
      );
    }

    const allRaffles = raffles?.pages?.flatMap((page) => page.raffles) || [];

    if (allRaffles.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Card style={styles.emptyCard}>
            <IconSymbol name="ticket" size={48} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No raffles found</Text>
            <Text style={styles.emptyText}>
              Create your first raffle to get started.
            </Text>
            <Button
              title="Create Raffle"
              onPress={handleCreateRaffle}
              style={styles.createButton}
            />
          </Card>
        </View>
      );
    }

    return (
      <View style={styles.rafflesContainer}>
        {allRaffles.map((raffle) => renderRaffleCard(raffle))}
        {isFetchingNextRaffles && (
          <View style={styles.loadingCard}>
            <Text style={styles.loadingText}>Loading more...</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onScroll={(event) => {
          const { layoutMeasurement, contentOffset, contentSize } =
            event.nativeEvent;
          const paddingToBottom = 100;
          const isNearBottom =
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - paddingToBottom;

          if (isNearBottom && !isFetchingNextRaffles) {
            fetchNextRaffles();
          }
        }}
        scrollEventThrottle={400}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <View style={styles.section}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Raffles</Text>
            <Text style={styles.subtitle}>Manage all your raffles</Text>
          </View>

          {/* Create Button */}
          <Button
            title="Create New Raffle"
            onPress={handleCreateRaffle}
            style={styles.createButton}
          />

          {/* Raffles List */}
          {renderRafflesList()}
        </View>
      </ScrollView>

      {/* Edit Raffle Modal */}
      <EditRaffleBottomSheet
        raffle={selectedRaffle}
        isVisible={isEditModalVisible}
        onClose={handleModalClose}
        onSave={handleEditSave}
      />

      {/* Create Raffle Modal */}
      <EditRaffleBottomSheet
        raffle={null}
        isVisible={isCreateModalVisible}
        onClose={handleModalClose}
        onSave={handleCreateSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    gap: 24,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
  },
  createButton: {
    marginBottom: 16,
  },
  rafflesContainer: {
    gap: 16,
  },
  raffleCard: {
    overflow: "hidden",
  },
  raffleImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
  },
  raffleContent: {
    padding: 16,
    gap: 12,
  },
  raffleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  raffleInfo: {
    flex: 1,
    gap: 8,
  },
  raffleTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  raffleDescription: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  raffleDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: "#6b7280",
  },
  dateInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateLabel: {
    fontSize: 12,
    color: "#9ca3af",
  },
  dateText: {
    fontSize: 12,
    color: "#6b7280",
  },

  loadingContainer: {
    gap: 16,
  },
  loadingCard: {
    alignItems: "center",
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
  },
  emptyContainer: {
    gap: 16,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 16,
  },
  emptyText: {
    color: "#6b7280",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 16,
  },
});
