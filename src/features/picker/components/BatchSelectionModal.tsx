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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/theme/colors";
import { OrderItem, BatchRow } from "@/src/features/picker/types/order.types";
import { validateBatches } from "@/src/features/picker/services/batch.validation";
import {
  applyBatchSelection,
  applyQuantityChange,
  isSystemAssignedRow,
} from "@/src/features/picker/services/batch.selection";
import {
  inventoryApi,
  InventoryBatch,
} from "@/src/features/picker/api/inventory.api";
import { formatExpiryDate } from "@/src/utils/dateUtils";
import InputError from "@/src/components/common/InputError";

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
  const [availableBatches, setAvailableBatches] = useState<InventoryBatch[]>(
    [],
  );
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    if (!isVisible) {
      setOpenDropdownId(null);
      return;
    }

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

    if (item?.medicineId) {
      setLoadingBatches(true);
      inventoryApi
        .getBatches(item.medicineId)
        .then((data) => setAvailableBatches(data))
        .catch(() => setAvailableBatches([]))
        .finally(() => setLoadingBatches(false));
    } else {
      setAvailableBatches([]);
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

  const orderedQty = item?.requiredQty ?? 0;

  const updateQuantity = (id: string, value: string) => {
    setBatches((prev) => applyQuantityChange(prev, id, value, orderedQty));
  };

  const selectBatch = (rowId: string, batch: InventoryBatch) => {
    setBatches((prev) => applyBatchSelection(prev, rowId, batch, orderedQty));
    setOpenDropdownId(null);
  };
  const validation = validateBatches(batches, orderedQty);
  const canSave = validation.isValid;
  const exceedsOrdered = validation.error === "EXCEEDS_ORDERED";

  const handleSave = () => {
    if (!canSave) return;
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

          {loadingBatches && (
            <View style={{ alignItems: "center", paddingVertical: 12 }}>
              <ActivityIndicator color={colors.brand.primary} />
            </View>
          )}

          {/* Batch Rows */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 260 }}
          >
            {batches.map((batch, rowIndex) => {
              const isSystemRow = isSystemAssignedRow(rowIndex, item);
              const isOpen = openDropdownId === batch.id;
              return (
                <View key={batch.id}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    {isSystemRow ? (
                      /* System-assigned batch — read-only */
                      <View
                        testID="batch-readonly"
                        style={{
                          flex: 1,
                          height: 54,
                          borderWidth: 1.5,
                          borderColor: "#E0E0E0",
                          borderRadius: 12,
                          paddingHorizontal: 14,
                          justifyContent: "center",
                          marginRight: 12,
                          backgroundColor: "#F2F2F2",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 15,
                            fontFamily: "Inter_600SemiBold",
                            color: colors.text.DEFAULT,
                          }}
                        >
                          {batch.batchNo}
                        </Text>
                      </View>
                    ) : (
                      /* Batch Dropdown Trigger */
                      <TouchableOpacity
                        testID="batch-dropdown"
                        style={{
                          flex: 1,
                          height: 54,
                          borderWidth: 1.5,
                          borderColor: isOpen
                            ? colors.brand.primary
                            : "#E0E0E0",
                          borderRadius: 12,
                          paddingHorizontal: 14,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginRight: 12,
                          backgroundColor: "#fff",
                        }}
                        onPress={() =>
                          setOpenDropdownId((prev) =>
                            prev === batch.id ? null : batch.id,
                          )
                        }
                      >
                        <Text
                          style={{
                            fontSize: 15,
                            fontFamily: "Inter_600SemiBold",
                            color: batch.batchNo
                              ? colors.text.DEFAULT
                              : "#BBBBBB",
                            flex: 1,
                          }}
                        >
                          {batch.batchNo || "Select batch"}
                        </Text>
                        <Ionicons
                          name={isOpen ? "caret-up" : "caret-down"}
                          size={13}
                          color={
                            isOpen ? colors.brand.primary : colors.text.DEFAULT
                          }
                        />
                      </TouchableOpacity>
                    )}

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
                        onChangeText={(val) => updateQuantity(batch.id, val)}
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

                    {/* Remove row — only when more than one; system batch stays */}
                    {batches.length > 1 && !isSystemRow && (
                      <TouchableOpacity
                        onPress={() => removeBatch(batch.id)}
                        style={{ marginLeft: 8, padding: 4 }}
                      >
                        <Ionicons
                          name="close-circle"
                          size={22}
                          color="#BBBBBB"
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Dropdown Options */}
                  {isOpen && (
                    <View
                      style={{
                        marginRight: 80,
                        marginBottom: 8,
                        borderWidth: 1.5,
                        borderColor: "#E0E0E0",
                        borderRadius: 12,
                        overflow: "hidden",
                        backgroundColor: "#fff",
                      }}
                    >
                      {availableBatches.length === 0 ? (
                        <View style={{ padding: 14 }}>
                          <Text
                            style={{
                              color: colors.text.muted,
                              fontSize: 14,
                              fontFamily: "Inter_400Regular",
                              textAlign: "center",
                            }}
                          >
                            {loadingBatches
                              ? "Loading..."
                              : "No batches available"}
                          </Text>
                        </View>
                      ) : (
                        availableBatches.map((b, index) => (
                          <TouchableOpacity
                            key={b.id}
                            onPress={() => selectBatch(batch.id, b)}
                            style={{
                              paddingHorizontal: 14,
                              paddingVertical: 12,
                              borderBottomWidth:
                                index < availableBatches.length - 1 ? 1 : 0,
                              borderBottomColor: "#F0F0F0",
                              backgroundColor:
                                batch.batchNo === b.batchNumber
                                  ? colors.brand.primarySoft
                                  : "#fff",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 14,
                                fontFamily:
                                  batch.batchNo === b.batchNumber
                                    ? "Inter_600SemiBold"
                                    : "Inter_400Regular",
                                color: colors.text.DEFAULT,
                              }}
                            >
                              {b.batchNumber}
                            </Text>
                            {b.expiryDate && (
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontFamily: "Inter_400Regular",
                                  color: colors.text.muted,
                                  marginTop: 2,
                                }}
                              >
                                EXP {formatExpiryDate(b.expiryDate)} · Qty:{" "}
                                {b.quantity}
                              </Text>
                            )}
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          <InputError
            visible={exceedsOrdered}
            message={`Total quantity (${validation.total}) cannot exceed ordered units (${orderedQty})`}
          />

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
