import React, { useState, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, Badge } from "@/components/ui";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { SubmissionBottomSheet } from "@/components/SubmissionBottomSheet";
import { EditRaffleBottomSheet } from "@/components/EditRaffleBottomSheet";
import {
  useCurrentRaffle,
  useSubmissions,
  useStats,
  useUpdateRaffle,
  useExistingTicketNumbers,
  useApprovedTickets,
  Submission,
  Raffle,
  Ticket,
} from "@/hooks/use-admin-api";
import { useQueryClient } from "@tanstack/react-query";

type TabType = "pending" | "approved" | "rejected";

export default function DashboardScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [isEditRaffleVisible, setIsEditRaffleVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Clear query cache on mount to ensure fresh data with new cursor format
  useEffect(() => {
    queryClient.removeQueries({ queryKey: ["submissions"] });
    queryClient.removeQueries({ queryKey: ["approvedTickets"] });
  }, [queryClient]);

  const { data: currentRaffle, refetch: refetchRaffle } = useCurrentRaffle();
  const { data: stats, refetch: refetchStats } = useStats();

  const {
    data: submissions,
    isLoading: submissionsLoading,
    refetch: refetchSubmissions,
    fetchNextPage: fetchNextSubmissions,
    isFetchingNextPage: isFetchingNextSubmissions,
  } = useSubmissions(activeTab, currentRaffle?.id);
  const {
    data: approvedTickets,
    isLoading: ticketsLoading,
    refetch: refetchTickets,
    fetchNextPage: fetchNextTickets,
    isFetchingNextPage: isFetchingNextTickets,
  } = useApprovedTickets(currentRaffle?.id);
  const { data: existingTicketNumbers = [] } = useExistingTicketNumbers(
    currentRaffle?.id
  );
  const updateRaffle = useUpdateRaffle();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh all data in parallel
      await Promise.all([
        refetchRaffle(),
        refetchStats(),
        refetchSubmissions(),
        refetchTickets(),
      ]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmissionPress = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIsBottomSheetVisible(true);
  };

  const handleTicketPress = (ticket: Ticket) => {
    // Find the submission for this ticket and show it
    const allSubmissions =
      submissions?.pages?.flatMap((page) => page.submissions) || [];
    const submission = allSubmissions.find(
      (s: Submission) => s.id === ticket.submission_id
    );
    if (submission) {
      setSelectedSubmission(submission);
      setIsBottomSheetVisible(true);
    }
  };

  const handleBottomSheetClose = () => {
    setIsBottomSheetVisible(false);
    setSelectedSubmission(null);
  };

  const handleEditRaffle = () => {
    setIsEditRaffleVisible(true);
  };

  const handleEditRaffleClose = () => {
    setIsEditRaffleVisible(false);
  };

  const handleEditRaffleSave = async (updatedRaffle: Partial<Raffle>) => {
    if (!currentRaffle) return;
    await updateRaffle.mutateAsync({
      raffleId: currentRaffle.id,
      data: updatedRaffle,
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "approved":
        return "success";
      case "rejected":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 100; // Increased padding to trigger earlier
    const isNearBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    if (isNearBottom) {
      // Near bottom, load more
      if (activeTab === "approved" && !isFetchingNextTickets) {
        fetchNextTickets();
      } else if (
        (activeTab === "pending" || activeTab === "rejected") &&
        !isFetchingNextSubmissions
      ) {
        fetchNextSubmissions();
      }
    }
  };

  const renderActiveRaffle = (raffle: Raffle) => (
    <Card style={styles.raffleCard}>
      {/* Image on top */}
      {raffle.image_url && (
        <Image
          source={{ uri: raffle.image_url }}
          style={styles.raffleImage}
          resizeMode="cover"
        />
      )}

      {/* Content */}
      <View style={styles.raffleContent}>
        {/* Title */}
        <Text style={styles.raffleTitle}>{raffle.title}</Text>

        {/* Description */}
        {raffle.description && (
          <Text style={styles.raffleDescription}>{raffle.description}</Text>
        )}

        {/* Details */}
        <View style={styles.raffleDetails}>
          <View style={styles.raffleDetailRowLeft}>
            <Text style={styles.raffleDetailValue}>
              {raffle.max_ticket_digits}-digit numbers
            </Text>
          </View>
          <View style={styles.raffleDetailRow}>
            <Text style={styles.raffleDetailLabel}>Ticket Price:</Text>
            <Text style={styles.raffleDetailValue}>
              ${raffle.ticket_price ? raffle.ticket_price.toFixed(2) : "0.00"}
            </Text>
          </View>
        </View>

        {/* Edit Button */}
        <Button
          title="Edit Raffle"
          onPress={handleEditRaffle}
          variant="outline"
          style={styles.editButton}
        />
      </View>
    </Card>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <TouchableOpacity
        style={[
          styles.statsCard,
          activeTab === "pending" && styles.activeStatsCard,
        ]}
        onPress={() => setActiveTab("pending")}
      >
        <Text
          style={[
            styles.statsNumber,
            activeTab === "pending" && styles.activeStatsNumber,
          ]}
        >
          {stats?.pending_submissions || 0}
        </Text>
        <Text
          style={[
            styles.statsLabel,
            activeTab === "pending" && styles.activeStatsLabel,
          ]}
        >
          Pending
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.statsCard,
          activeTab === "approved" && styles.activeStatsCardApproved,
        ]}
        onPress={() => setActiveTab("approved")}
      >
        <Text
          style={[
            styles.statsNumberApproved,
            activeTab === "approved" && styles.activeStatsNumber,
          ]}
        >
          {stats?.approved_submissions || 0}
        </Text>
        <Text
          style={[
            styles.statsLabel,
            activeTab === "approved" && styles.activeStatsLabel,
          ]}
        >
          Approved
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.statsCard,
          activeTab === "rejected" && styles.activeStatsCardRejected,
        ]}
        onPress={() => setActiveTab("rejected")}
      >
        <Text
          style={[
            styles.statsNumberRejected,
            activeTab === "rejected" && styles.activeStatsNumber,
          ]}
        >
          {stats?.rejected_submissions || 0}
        </Text>
        <Text
          style={[
            styles.statsLabel,
            activeTab === "rejected" && styles.activeStatsLabel,
          ]}
        >
          Rejected
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSubmissions = () => {
    // For approved tab, show tickets instead of submissions
    if (activeTab === "approved") {
      if (ticketsLoading) {
        return (
          <View style={styles.submissionsContainer}>
            <Card style={styles.loadingCard}>
              <Text style={styles.loadingText}>Loading tickets...</Text>
            </Card>
          </View>
        );
      }

      const allTickets =
        approvedTickets?.pages?.flatMap((page) => page.tickets) || [];

      if (allTickets.length === 0) {
        return (
          <View style={styles.submissionsContainer}>
            <Card style={styles.emptyCard}>
              <IconSymbol name="ticket" size={48} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No approved tickets</Text>
              <Text style={styles.emptyText}>
                No approved tickets found for this raffle.
              </Text>
            </Card>
          </View>
        );
      }

      return (
        <View style={styles.submissionsContainer}>
          {allTickets.map((ticket) => (
            <Card key={ticket.id} style={styles.submissionCard}>
              <TouchableOpacity
                onPress={() => handleTicketPress(ticket)}
                style={styles.submissionContent}
              >
                <View style={styles.submissionHeader}>
                  <View style={styles.submissionInfo}>
                    <Text style={styles.ticketNumber}>
                      #{ticket.ticket_number}
                    </Text>
                    <Text style={styles.submissionName}>
                      {ticket.submission?.full_name}
                    </Text>
                    <Text style={styles.submissionEmail}>
                      {ticket.submission?.email}
                    </Text>
                  </View>
                  <Badge label="Approved" variant="success" />
                </View>

                <View style={styles.submissionDetails}>
                  <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                      <IconSymbol name="creditcard" size={16} color="#6b7280" />
                      <Text style={styles.detailText}>
                        {ticket.submission?.payment_method}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.submissionDate}>
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            </Card>
          ))}
          {isFetchingNextTickets && (
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText}>Loading more...</Text>
            </View>
          )}
        </View>
      );
    }

    // For pending and rejected tabs, show submissions as before
    if (submissionsLoading) {
      return (
        <View style={styles.submissionsContainer}>
          <Card style={styles.loadingCard}>
            <Text style={styles.loadingText}>Loading submissions...</Text>
          </Card>
        </View>
      );
    }

    const allSubmissions =
      submissions?.pages?.flatMap((page) => page.submissions) || [];

    if (allSubmissions.length === 0) {
      return (
        <View style={styles.submissionsContainer}>
          <Card style={styles.emptyCard}>
            <IconSymbol name="doc.text" size={48} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No {activeTab} submissions</Text>
            <Text style={styles.emptyText}>
              {activeTab === "pending"
                ? "When users submit raffle entries, they will appear here for review."
                : `No ${activeTab} submissions found.`}
            </Text>
          </Card>
        </View>
      );
    }

    return (
      <View style={styles.submissionsContainer}>
        {allSubmissions.map((submission) => (
          <Card key={submission.id} style={styles.submissionCard}>
            <TouchableOpacity
              onPress={() => handleSubmissionPress(submission)}
              style={styles.submissionContent}
            >
              <View style={styles.submissionHeader}>
                <View style={styles.submissionInfo}>
                  <Text style={styles.submissionName}>
                    {submission.full_name}
                  </Text>
                  <Text style={styles.submissionEmail}>{submission.email}</Text>
                </View>
                <Badge
                  label={getStatusLabel(submission.status)}
                  variant={getStatusVariant(submission.status)}
                />
              </View>

              <View style={styles.submissionDetails}>
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <IconSymbol name="ticket" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>
                      {submission.ticket_quantity} tickets
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <IconSymbol name="creditcard" size={16} color="#6b7280" />
                    <Text style={styles.detailText}>
                      {submission.payment_method}
                    </Text>
                  </View>
                </View>
                <Text style={styles.submissionDate}>
                  {new Date(submission.created_at).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          </Card>
        ))}
        {isFetchingNextSubmissions && (
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
        contentContainerStyle={[styles.content, styles.section]}
        stickyHeaderIndices={[2]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onScroll={handleScroll}
        scrollEventThrottle={400}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Raffle Admin</Text>
          <Text style={styles.subtitle}>
            Manage your raffles and submissions
          </Text>
        </View>

        {/* Active Raffle */}
        {currentRaffle ? (
          renderActiveRaffle(currentRaffle)
        ) : (
          <Card style={styles.noRaffleCard}>
            <Text style={styles.noRaffleTitle}>No Active Raffle</Text>
            <Text style={styles.noRaffleText}>
              There is currently no active raffle. Create a new raffle to get
              started.
            </Text>
          </Card>
        )}

        {/* Stats (Interactive Tabs) */}
        <View
          style={{
            backgroundColor: "#f9fafb",
            borderBottomWidth: 1,
            borderBottomColor: "#e5e7eb",
            paddingBottom: 8,
          }}
        >
          {renderStats()}
        </View>

        {/* Submissions */}
        {renderSubmissions()}
      </ScrollView>

      {/* Bottom Sheet - Rendered outside SafeAreaView to be at root level */}
      <SubmissionBottomSheet
        submission={selectedSubmission}
        isVisible={isBottomSheetVisible}
        onClose={handleBottomSheetClose}
        raffleMaxDigits={currentRaffle?.max_ticket_digits || 3}
        existingTicketNumbers={existingTicketNumbers}
      />

      {/* Edit Raffle Bottom Sheet */}
      <EditRaffleBottomSheet
        raffle={currentRaffle}
        isVisible={isEditRaffleVisible}
        onClose={handleEditRaffleClose}
        onSave={handleEditRaffleSave}
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
  headerSection: {
    padding: 16,
    gap: 24,
  },
  submissionsSection: {
    flex: 1,
  },
  submissionsContainer: {
    gap: 8,
  },
  flatList: {
    flex: 1,
  },
  submissionsFlatList: {
    flex: 1,
  },
  submissionsScrollView: {
    flex: 1,
    backgroundColor: "#f9fafb",
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
  raffleTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  raffleDescription: {
    fontSize: 16,
    color: "#6b7280",
    lineHeight: 24,
  },
  raffleDetails: {
    gap: 8,
  },
  raffleDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  raffleDetailRowLeft: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  raffleDetailLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  raffleDetailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#16a34a",
  },
  editButton: {
    marginTop: 8,
  },
  noRaffleCard: {
    alignItems: "center",
    paddingVertical: 32,
  },
  noRaffleTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  noRaffleText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f59e0b",
  },
  statsNumberApproved: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#059669",
  },
  statsNumberRejected: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#dc2626",
  },
  statsLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  activeStatsCard: {
    backgroundColor: "#fef3c7",
    borderColor: "#f59e0b",
  },
  activeStatsNumber: {
    color: "#92400e",
  },
  activeStatsLabel: {
    color: "#92400e",
  },
  activeStatsCardApproved: {
    backgroundColor: "#d1fae5",
    borderColor: "#059669",
  },
  activeStatsCardRejected: {
    backgroundColor: "#fee2e2",
    borderColor: "#dc2626",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#16a34a",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  activeTabText: {
    color: "#ffffff",
  },
  tabBadge: {
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  submissionsList: {
    gap: 16,
    paddingBottom: 100, // Add extra padding to prevent content from going behind tab navigation
  },
  submissionCard: {
    marginBottom: 12,
  },
  submissionContent: {
    gap: 4,
  },
  submissionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  submissionInfo: {
    flex: 1,
    gap: 4,
  },
  ticketNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#16a34a",
    marginBottom: 4,
  },
  submissionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  submissionEmail: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  submissionDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: "#6b7280",
  },
  submissionDate: {
    fontSize: 12,
    color: "#9ca3af",
  },
  loadingCard: {
    alignItems: "center",
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
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
  },
  errorCard: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#dc2626",
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
    marginBottom: 12,
  },
  errorDetail: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 12,
    color: "#dc2626",
    marginTop: 12,
    fontFamily: "monospace",
  },
});
