import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui";
import { Raffle } from "@/hooks/use-admin-api";
import * as ImagePicker from "expo-image-picker";

interface EditRaffleBottomSheetProps {
  raffle: Raffle | null;
  isVisible: boolean;
  onClose: () => void;
  onSave: (updatedRaffle: Partial<Raffle>) => Promise<void>;
}

const RAFFLE_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "completed", label: "Completed" },
];

export function EditRaffleBottomSheet({
  raffle,
  isVisible,
  onClose,
  onSave,
}: EditRaffleBottomSheetProps) {
  const [title, setTitle] = useState(raffle?.title || "");
  const [description, setDescription] = useState(raffle?.description || "");
  const [ticketPrice, setTicketPrice] = useState(
    raffle?.ticket_price?.toString() || ""
  );
  const [status, setStatus] = useState(raffle?.status || "draft");
  const [maxDigits, setMaxDigits] = useState(
    raffle?.max_ticket_digits?.toString() || "6"
  );
  const [imageBase64, setImageBase64] = useState(raffle?.image_url || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  React.useEffect(() => {
    if (raffle) {
      setTitle(raffle.title || "");
      setDescription(raffle.description || "");
      setTicketPrice(raffle.ticket_price?.toString() || "");
      setStatus(raffle.status || "draft");
      setMaxDigits(raffle.max_ticket_digits?.toString() || "6");
      setImageBase64(raffle.image_url || "");
    } else {
      // Reset form for new raffle
      setTitle("");
      setDescription("");
      setTicketPrice("");
      setStatus("draft");
      setMaxDigits("6");
      setImageBase64("");
    }
  }, [raffle]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        setImageBase64(`data:image/jpeg;base64,${asset.base64}`);
      }
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Title is required");
      return;
    }

    if (!ticketPrice.trim() || isNaN(parseFloat(ticketPrice))) {
      Alert.alert("Error", "Valid ticket price is required");
      return;
    }

    const price = parseFloat(ticketPrice);
    if (price <= 0) {
      Alert.alert("Error", "Ticket price must be greater than 0");
      return;
    }

    if (!raffle && (!maxDigits.trim() || isNaN(parseInt(maxDigits)))) {
      Alert.alert("Error", "Valid max digits is required");
      return;
    }

    const digits = parseInt(maxDigits);
    if (!raffle && (digits < 1 || digits > 10)) {
      Alert.alert("Error", "Max digits must be between 1 and 10");
      return;
    }

    setIsSaving(true);
    try {
      const raffleData: Partial<Raffle> = {
        title: title.trim(),
        description: description.trim() || null,
        ticket_price: price,
        status: status as any,
        image_url: imageBase64 || null,
        ...(raffle ? {} : { max_ticket_digits: digits }), // Only include for new raffles
      };

      await onSave(raffleData);
      Alert.alert(
        "Success",
        raffle ? "Raffle updated successfully" : "Raffle created successfully"
      );
      onClose();
    } catch (error: any) {
      console.error("Error saving raffle:", error);

      // Extract the specific error message
      let errorMessage = "An unexpected error occurred";

      // Handle different error response structures
      if (error?.error) {
        // Direct error message from API
        errorMessage = error.error;
      } else if (error?.message) {
        // Error message from exception
        errorMessage = error.message;
      } else if (typeof error === "string") {
        // String error
        errorMessage = error;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setIsSaving(false);
    }
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
          <Text style={styles.title}>
            {raffle ? "Edit Raffle" : "Create Raffle"}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter raffle title"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter raffle description"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ticket Price *</Text>
              <TextInput
                style={styles.input}
                value={ticketPrice}
                onChangeText={setTicketPrice}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Status</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowStatusDropdown(!showStatusDropdown)}
              >
                <Text style={styles.dropdownButtonText}>
                  {RAFFLE_STATUSES.find((s) => s.value === status)?.label ||
                    "Select Status"}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>

              {showStatusDropdown && (
                <View style={styles.dropdown}>
                  {RAFFLE_STATUSES.map((statusOption) => (
                    <TouchableOpacity
                      key={statusOption.value}
                      style={[
                        styles.dropdownItem,
                        status === statusOption.value &&
                          styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setStatus(statusOption.value as typeof status);
                        setShowStatusDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          status === statusOption.value &&
                            styles.dropdownItemTextActive,
                        ]}
                      >
                        {statusOption.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Max Ticket Digits {raffle ? "(Read-only)" : "*"}
              </Text>
              <TextInput
                style={[styles.input, raffle && styles.readOnlyInput]}
                value={raffle ? raffle.max_ticket_digits.toString() : maxDigits}
                onChangeText={raffle ? undefined : setMaxDigits}
                placeholder="6"
                keyboardType="numeric"
                editable={!raffle}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Raffle Image</Text>

            {imageBase64 ? (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: imageBase64 }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setImageBase64("")}
                >
                  <Text style={styles.removeImageText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <Button
              title={imageBase64 ? "Change Image" : "Upload Image"}
              onPress={pickImage}
              variant="outline"
              style={styles.uploadButton}
            />
          </View>
        </ScrollView>

        <View style={styles.actionButtons}>
          <Button
            title="Cancel"
            onPress={onClose}
            variant="outline"
            style={styles.actionButton}
          />
          <Button
            title={raffle ? "Save Changes" : "Create Raffle"}
            onPress={handleSave}
            loading={isSaving}
            style={styles.actionButton}
          />
        </View>
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
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#ffffff",
  },
  textArea: {
    minHeight: 100,
  },
  readOnlyInput: {
    backgroundColor: "#f9fafb",
    color: "#6b7280",
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#ffffff",
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#111827",
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#6b7280",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    marginTop: 4,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dropdownItemActive: {
    backgroundColor: "#f0f9ff",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#111827",
  },
  dropdownItemTextActive: {
    color: "#0284c7",
    fontWeight: "600",
  },
  imageContainer: {
    marginBottom: 12,
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  removeImageButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fee2e2",
    borderRadius: 6,
  },
  removeImageText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "500",
  },
  uploadButton: {
    marginTop: 8,
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
});
