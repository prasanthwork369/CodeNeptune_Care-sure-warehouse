import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/theme/colors";
import { OrderItem, BatchRow } from "@/src/types/order.types";

interface BatchSelectionModalProps {
  isVisible: boolean;
  item: OrderItem | null;
  initialBatches?: BatchRow[];
  onClose: () => void;
  onSave: (batches: BatchRow[]) => void;
}

const BatchSelectionModal: React.FC<BatchSelectionModalProps> = ({
  isVisible,
  item,
  initialBatches,
  onClose,
  onSave,
}) => {
  const [batches, setBatches] = useState<BatchRow[]>([
    { id: "1", batchNo: "", quantity: "" },
  ]);

  useEffect(() => {
    if (!isVisible) return;

    if (initialBatches && initialBatches.length > 0) {
      setBatches(initialBatches);
    } else if (item) {
      setBatches([
        {
          id: "1",
          batchNo: item.batchNo || "",
          quantity: item.requiredQty.toString(),
        },
      ]);
    }
  }, [isVisible]);

  const addBatch = useCallback(() => {
    setBatches((prev) => [
      ...prev,
      { id: Date.now().toString(), batchNo: "", quantity: "" },
    ]);
  }, []);

  const removeBatch = (id: string) => {
    setBatches((prev) =>
      prev.length > 1 ? prev.filter((b) => b.id !== id) : prev,
    );
  };

  const updateBatch = (id: string, field: keyof BatchRow, value: string) => {
    setBatches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
    );
  };

  const canSave = batches.every(
    (b) => b.batchNo.trim().length > 0 && parseInt(b.quantity || "0", 10) > 0,
  );

  const handleSave = () => {
    if (!canSave) return;
    // TODO: validate entered batch numbers against the backend once the
    // batch-validation API is available; for now they are saved as typed.
    onSave(batches.map((b) => ({ ...b, batchNo: b.batchNo.trim() })));
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.4)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 24,
        }}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: "#fff",
            width: "100%",
            borderRadius: 28,
            padding: 24,
          }}
        >
          {/* Ordered Units */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                color: colors.text.DEFAULT,
                fontSize: 17,
                fontFamily: "Inter_700Bold",
              }}
            >
              Ordered Units
            </Text>
            <View
              style={{
                backgroundColor: "#F2F2F2",
                width: 72,
                height: 52,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: "#666666",
                  fontSize: 26,
                  fontFamily: "Inter_700Bold",
                }}
              >
                {item?.requiredQty ?? 0}
              </Text>
            </View>
          </View>

          {/* Batch Number label */}
          <Text
            style={{
              color: colors.text.DEFAULT,
              fontSize: 14,
              fontFamily: "Inter_500Medium",
              marginBottom: 12,
            }}
          >
            Batch Number
          </Text>

          {/* Batch Rows */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 260 }}
          >
            {batches.map((batch) => (
              <View
                key={batch.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                {/* Batch Number Input */}
                <TextInput
                  style={{
                    flex: 1,
                    height: 54,
                    borderWidth: 1.5,
                    borderColor: batch.batchNo.trim()
                      ? colors.text.DEFAULT
                      : "#E0E0E0",
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 0,
                    fontSize: 15,
                    fontFamily: "Inter_600SemiBold",
                    textAlignVertical: "center",
                    includeFontPadding: false,
                    color: colors.text.DEFAULT,
                    marginRight: 12,
                    backgroundColor: "#fff",
                  }}
                  value={batch.batchNo}
                  onChangeText={(val) => updateBatch(batch.id, "batchNo", val)}
                  placeholder="Enter batch no"
                  placeholderTextColor="#BBBBBB"
                  autoCapitalize="characters"
                  autoCorrect={false}
                />

                {/* Quantity — placeholder drawn as overlay: a native placeholder
                                    makes the caret stick to the right on Android when centered */}
                <View style={{ width: 68, height: 54 }}>
                  <TextInput
                    style={{
                      width: "100%",
                      height: "100%",
                      borderWidth: 1.5,
                      borderColor: colors.text.DEFAULT,
                      borderRadius: 12,
                      fontSize: 24,
                      fontFamily: "Inter_700Bold",
                      textAlign: "center",
                      textAlignVertical: "center",
                      paddingVertical: 0,
                      includeFontPadding: false,
                      color: colors.text.DEFAULT,
                    }}
                    value={batch.quantity}
                    onChangeText={(val) =>
                      updateBatch(
                        batch.id,
                        "quantity",
                        val.replace(/[^0-9]/g, ""),
                      )
                    }
                    keyboardType="numeric"
                    maxLength={4}
                  />
                  {!batch.quantity && (
                    <Text
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        textAlign: "center",
                        textAlignVertical: "center",
                        lineHeight: 54,
                        fontSize: 24,
                        fontFamily: "Inter_700Bold",
                        color: "#BBBBBB",
                      }}
                    >
                      0
                    </Text>
                  )}
                </View>

                {/* Remove row — only when more than one */}
                {batches.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeBatch(batch.id)}
                    style={{ marginLeft: 8, padding: 4 }}
                  >
                    <Ionicons name="close-circle" size={22} color="#BBBBBB" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Add Batch */}
          <TouchableOpacity
            onPress={addBatch}
            style={{ marginTop: 4, marginBottom: 24 }}
          >
            <Text
              style={{
                color: colors.text.blue,
                fontSize: 15,
                fontFamily: "Inter_700Bold",
              }}
            >
              + Add Batch
            </Text>
          </TouchableOpacity>

          {/* Save */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={!canSave}
            className="rounded-md"
            style={{
              backgroundColor: colors.brand.primary,
              paddingVertical: 18,
              alignItems: "center",
              opacity: canSave ? 1 : 0.4,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 18,
                fontFamily: "Inter_700Bold",
              }}
            >
              Save
            </Text>
          </TouchableOpacity>
        </Pressable>
      </View>
    </Modal>
  );
};

export default BatchSelectionModal;
