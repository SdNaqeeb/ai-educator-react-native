import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Dimensions,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { height } = Dimensions.get("window");

const MultiSelectPicker = ({
  selectedValues = [],
  onValuesChange,
  items = [],
  placeholder = "Select options",
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const openPicker = () => {
    if (!disabled && items.length > 0) {
      setIsVisible(true);
    }
  };

  const toggleItem = (value) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onValuesChange(newValues);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return placeholder;
    }
    if (selectedValues.length === 1) {
      const item = items.find((i) => i.value === selectedValues[0]);
      return item ? item.label : placeholder;
    }
    return `${selectedValues.length} items selected`;
  };

  const renderSelectedItems = () => {
    if (selectedValues.length === 0) return null;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.selectedItemsContainer}
      >
        {selectedValues.map((value) => {
          const item = items.find((i) => i.value === value);
          if (!item) return null;

          return (
            <View key={value} style={styles.selectedChip}>
              <Text style={styles.selectedChipText} numberOfLines={1}>
                {item.label}
              </Text>
              <TouchableOpacity
                onPress={() => toggleItem(value)}
                style={styles.removeChip}
              >
                <Ionicons name="close" size={14} color="#667eea" />
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.item,
        selectedValues.includes(item.value) && styles.selectedItem,
      ]}
      onPress={() => toggleItem(item.value)}
    >
      <View style={styles.itemContent}>
        <Text
          style={[
            styles.itemText,
            selectedValues.includes(item.value) && styles.selectedItemText,
          ]}
        >
          {item.label}
        </Text>
        {selectedValues.includes(item.value) && (
          <Ionicons name="checkmark" size={20} color="#667eea" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        style={[styles.picker, disabled && styles.pickerDisabled]}
        onPress={openPicker}
        disabled={disabled}
      >
        <View style={styles.pickerContent}>
          <Text
            style={[
              styles.pickerText,
              selectedValues.length === 0 && styles.placeholderText,
            ]}
          >
            {getDisplayText()}
          </Text>
          <Ionicons
            name="chevron-down"
            size={20}
            color={disabled ? "#94a3b8" : "#667eea"}
          />
        </View>
      </TouchableOpacity>

      {renderSelectedItems()}

      <Modal
  visible={isVisible}
  transparent
  animationType="slide"
  onRequestClose={() => setIsVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>
          Select chapters ({selectedValues.length} selected)
        </Text>
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
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", padding: 20 }}>
            No chapters available
          </Text>
        }
      />

      <View style={styles.modalFooter}>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => onValuesChange(items.map((i) => i.value))}
        >
          <Text style={styles.footerButtonText}>Select All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => onValuesChange([])}
        >
          <Text style={styles.footerButtonText}>Clear All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.footerButton, styles.doneButton]}
          onPress={() => setIsVisible(false)}
        >
          <Text style={[styles.footerButtonText, styles.doneButtonText]}>
            Done
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

    </>
  );
};

const styles = StyleSheet.create({
  picker: {
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
  pickerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  selectedItemsContainer: {
    marginTop: 8,
    maxHeight: 100,
  },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#667eea",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    maxWidth: 150,
  },
  selectedChipText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  removeChip: {
    marginLeft: 6,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
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
    maxHeight: height * 0.85, // increased
    overflow: "hidden",
    flexGrow: 1,
  },
  
  list: {
    paddingHorizontal: 20,
    flexGrow: 1,
    marginBottom: 8,
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
  // list: {
  //   paddingHorizontal: 20,
  //   flex: 1,
  // },
  item: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  selectedItem: {
    backgroundColor: "rgba(102, 126, 234, 0.1)",
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  itemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemText: {
    fontSize: 15,
    color: "#374151",
    flex: 1,
    lineHeight: 20,
  },
  selectedItemText: {
    color: "#667eea",
    fontWeight: "600",
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 8,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
  },
  doneButton: {
    backgroundColor: "#667eea",
    borderColor: "#667eea",
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  doneButtonText: {
    color: "#ffffff",
  },
});

export default MultiSelectPicker;
