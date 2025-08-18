import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  Alert,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Badge } from "@/components/ui";
import {
  Submission,
  useUpdateSubmission,
  generateRandomTicketNumbers,
} from "@/hooks/use-admin-api";

interface SubmissionBottomSheetProps {
  submission: Submission | null;
  isVisible: boolean;
  onClose: () => void;
  raffleMaxDigits?: number;
  existingTicketNumbers?: string[];
}

export function SubmissionBottomSheet({
  submission,
  isVisible,
  onClose,
  raffleMaxDigits = 3,
  existingTicketNumbers = [],
}: SubmissionBottomSheetProps) {
  const updateSubmission = useUpdateSubmission();

  const [ticketNumbers, setTicketNumbers] = useState<string[]>([]);
  const [rejectionNote, setRejectionNote] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // Reset ticket numbers when bottom sheet opens
  React.useEffect(() => {
    if (isVisible && submission) {
      setTicketNumbers([]);
      setRejectionNote("");
    }
  }, [isVisible, submission]);

  React.useEffect(() => {
    if (
      submission &&
      submission.ticket_quantity &&
      ticketNumbers.length === 0
    ) {
      const randomNumbers = generateRandomTicketNumbers(
        submission.ticket_quantity,
        raffleMaxDigits,
        existingTicketNumbers
      );
      setTicketNumbers(randomNumbers);
    }
  }, [
    existingTicketNumbers,
    raffleMaxDigits,
    submission,
    ticketNumbers.length,
  ]); // Regenerate when submission changes or when ticketNumbers is empty

  const handleApprove = async () => {
    if (!submission) return;

    // Validate ticket numbers
    const invalidNumbers = ticketNumbers.filter(
      (number) =>
        !number || number.length !== raffleMaxDigits || isNaN(Number(number))
    );

    if (invalidNumbers.length > 0) {
      Alert.alert(
        "Error",
        `Please ensure all ticket numbers are ${raffleMaxDigits}-digit numbers`
      );
      return;
    }

    // Check for duplicates
    const uniqueNumbers = new Set(ticketNumbers);
    if (uniqueNumbers.size !== ticketNumbers.length) {
      Alert.alert("Error", "Please ensure all ticket numbers are unique");
      return;
    }

    // Check for conflicts with existing numbers
    const conflicts = ticketNumbers.filter((number) =>
      existingTicketNumbers.includes(number)
    );
    if (conflicts.length > 0) {
      Alert.alert(
        "Error",
        `Ticket number(s) ${conflicts.join(", ")} already exist`
      );
      return;
    }

    setIsApproving(true);
    try {
      await updateSubmission.mutateAsync({
        id: submission.id,
        data: {
          status: "approved",
          assignTickets: true,
          ticketNumbers: ticketNumbers,
        },
      });
      Alert.alert("Success", "Submission approved successfully");
      onClose();
    } catch (error) {
      console.error("Error approving submission:", error);
      Alert.alert("Error", "Failed to approve submission");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!submission) return;

    if (!rejectionNote.trim()) {
      Alert.alert("Error", "Please provide a rejection reason");
      return;
    }

    setIsRejecting(true);
    try {
      await updateSubmission.mutateAsync({
        id: submission.id,
        data: {
          status: "rejected",
          admin_notes: rejectionNote,
        },
      });
      Alert.alert("Success", "Submission rejected successfully");
      onClose();
    } catch (error) {
      console.error("Error rejecting submission:", error);
      Alert.alert("Error", "Failed to reject submission");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleTicketNumberChange = (index: number, value: string) => {
    const newNumbers = [...ticketNumbers];
    newNumbers[index] = value;
    setTicketNumbers(newNumbers);
  };

  const generateNewNumbers = () => {
    if (!submission) return;

    const randomNumbers = generateRandomTicketNumbers(
      submission.ticket_quantity,
      raffleMaxDigits,
      existingTicketNumbers
    );
    setTicketNumbers(randomNumbers);
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Submission Details</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {submission && (
            <>
              <View style={styles.statusSection}>
                <Badge
                  label={submission.status.toUpperCase()}
                  variant={
                    submission.status === "pending"
                      ? "warning"
                      : submission.status === "approved"
                      ? "success"
                      : "error"
                  }
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Name:</Text>
                  <Text style={styles.value}>{submission.full_name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Email:</Text>
                  <Text style={styles.value}>{submission.email}</Text>
                </View>
                {submission.phone && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Phone:</Text>
                    <Text style={styles.value}>{submission.phone}</Text>
                  </View>
                )}
                {submission.account_holder_name && (
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Account Holder:</Text>
                    <Text style={styles.value}>
                      {submission.account_holder_name}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment Information</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Method:</Text>
                  <Text style={styles.value}>{submission.payment_method}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Reference:</Text>
                  <Text style={styles.value}>{submission.reference_code}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Tickets:</Text>
                  <Text style={styles.value}>{submission.ticket_quantity}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Price per Ticket:</Text>
                  <Text style={styles.value}>
                    $
                    {submission.ticket_price
                      ? submission.ticket_price.toFixed(2)
                      : "0.00"}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Total Amount:</Text>
                  <Text style={[styles.value, styles.totalAmount]}>
                    $
                    {submission.ticket_price
                      ? (
                          submission.ticket_quantity * submission.ticket_price
                        ).toFixed(2)
                      : "0.00"}
                  </Text>
                </View>
              </View>

              {submission.payment_proof_base64 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Payment Proof</Text>
                  <Image
                    source={{
                      uri: submission.payment_proof_base64.startsWith("data:")
                        ? submission.payment_proof_base64
                        : `data:image/jpeg;base64,${submission.payment_proof_base64}`,
                    }}
                    style={styles.paymentImage}
                    resizeMode="contain"
                  />
                </View>
              )}

              {submission.status === "pending" && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Assign Ticket Numbers</Text>
                  <Button
                    title="Generate New Numbers"
                    onPress={generateNewNumbers}
                    variant="outline"
                    size="sm"
                    style={styles.generateButton}
                  />
                  {ticketNumbers.map((number, index) => (
                    <View key={index} style={styles.ticketInputContainer}>
                      <Text style={styles.ticketLabel}>
                        Ticket {index + 1}:
                      </Text>
                      <TextInput
                        style={styles.ticketInput}
                        value={number}
                        onChangeText={(value) =>
                          handleTicketNumberChange(index, value)
                        }
                        placeholder={`${"0".repeat(raffleMaxDigits)}`}
                        maxLength={raffleMaxDigits}
                        keyboardType="numeric"
                      />
                    </View>
                  ))}
                </View>
              )}

              {submission.status === "approved" && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Assigned Ticket Numbers
                  </Text>
                  <View style={styles.ticketNumbersContainer}>
                    {submission.tickets?.map((ticket: any, index: number) => (
                      <View key={ticket.id} style={styles.ticketNumberItem}>
                        <Text style={styles.ticketNumberLabel}>
                          Ticket {index + 1}:
                        </Text>
                        <Text style={styles.ticketNumberValue}>
                          #{ticket.ticket_number}
                        </Text>
                      </View>
                    )) || (
                      <Text style={styles.noTicketsText}>
                        No ticket numbers assigned yet.
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {submission.status === "rejected" && submission.admin_notes && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Rejection Reason</Text>
                  <Text style={styles.rejectionNote}>
                    {submission.admin_notes}
                  </Text>
                </View>
              )}

              {submission.status === "pending" && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Rejection Note</Text>
                  <TextInput
                    style={styles.noteInput}
                    value={rejectionNote}
                    onChangeText={setRejectionNote}
                    placeholder="Enter rejection reason..."
                    multiline
                    numberOfLines={3}
                  />
                </View>
              )}
            </>
          )}
        </ScrollView>

        {submission && submission.status === "pending" && (
          <View style={styles.actionButtons}>
            <Button
              title="Reject"
              onPress={handleReject}
              variant="destructive"
              loading={isRejecting}
              style={styles.actionButton}
            />
            <Button
              title="Approve"
              onPress={handleApprove}
              loading={isApproving}
              style={styles.actionButton}
            />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 18,
    color: "#6b7280",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
    paddingBottom: 100, // Add extra padding to prevent content from going behind tab navigation
  },
  statusSection: {
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  value: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "400",
    flex: 1,
    textAlign: "right",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#16a34a",
  },
  paymentImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  ticketInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  ticketLabel: {
    fontSize: 14,
    color: "#374151",
    marginRight: 12,
    minWidth: 80,
  },
  ticketInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    textAlign: "center",
  },
  generateButton: {
    marginBottom: 16,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
  rejectionNote: {
    fontSize: 14,
    color: "#991b1b",
    backgroundColor: "#fee2e2",
    padding: 12,
    borderRadius: 6,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "white",
  },
  actionButton: {
    flex: 1,
  },
  ticketNumbersContainer: {
    gap: 8,
  },
  ticketNumberItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#0ea5e9",
  },
  ticketNumberLabel: {
    fontSize: 14,
    color: "#0c4a6e",
    fontWeight: "500",
  },
  ticketNumberValue: {
    fontSize: 16,
    color: "#0c4a6e",
    fontWeight: "bold",
  },
  noTicketsText: {
    fontSize: 14,
    color: "#6b7280",
    fontStyle: "italic",
  },
});
