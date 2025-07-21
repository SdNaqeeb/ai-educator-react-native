import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { height } = Dimensions.get("window");

const CustomPicker = ({
  selectedValue,
  onValueChange,
  items = [],
  placeholder = "Select an option",
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const selectedItem = items.find((item) => item.value === selectedValue);

  const openPicker = () => {
    if (!disabled && items.length > 0) {
      setIsVisible(true);
    }
  };

  const selectItem = (item) => {
    onValueChange(item.value);
    setIsVisible(false);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.item, selectedValue === item.value && styles.selectedItem]}
      onPress={() => selectItem(item)}
    >
      <Text
        style={[
          styles.itemText,
          selectedValue === item.value && styles.selectedItemText,
        ]}
      >
        {item.label}
      </Text>
      {selectedValue === item.value && (
        <Ionicons name="checkmark" size={20} color="#667eea" />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        style={[styles.picker, disabled && styles.pickerDisabled]}
        onPress={openPicker}
        disabled={disabled}
      >
        <Text
          style={[styles.pickerText, !selectedItem && styles.placeholderText]}
        >
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={disabled ? "#94a3b8" : "#667eea"}
        />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select an option</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsVisible(false)}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={items}
              keyExtractor={(item) => item.value.toString()}
              renderItem={renderItem}
              style={styles.list}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  picker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 56,
  },
  pickerDisabled: {
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0",
    opacity: 0.6,
  },
  pickerText: {
    fontSize: 16,
    color: "#2d3748",
    fontWeight: "500",
    flex: 1,
  },
  placeholderText: {
    color: "#94a3b8",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
  },
  closeButton: {
    padding: 4,
  },
  list: {
    paddingHorizontal: 20,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  selectedItem: {
    backgroundColor: "rgba(102, 126, 234, 0.1)",
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  itemText: {
    fontSize: 16,
    color: "#374151",
    flex: 1,
  },
  selectedItemText: {
    color: "#667eea",
    fontWeight: "600",
  },
});

export default CustomPicker;
