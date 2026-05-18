import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useReportStore } from '../../../../src/stores/reportStore';
import { Card, Button, Input } from '../../../../src/components/ui';
import { colors, spacing, fontSize, fontWeight } from '../../../../src/theme';

export default function BudgetManagerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { currentReport, fetchReport, addBudget, deleteBudget, isSaving, isLoading } = useReportStore();

  const [newItemName, setNewItemName] = useState('');
  const [newQuantity, setNewQuantity] = useState('1');
  const [newUnitCost, setNewUnitCost] = useState('');

  useEffect(() => {
    if (!currentReport || currentReport._id !== id) {
      fetchReport(id as string);
    }
  }, [id]);

  const handleAddBudget = async () => {
    const qty = parseInt(newQuantity, 10);
    const cost = parseFloat(newUnitCost);

    if (!newItemName || isNaN(qty) || isNaN(cost)) {
      Alert.alert('Validation Error', 'Please provide valid inputs for all fields.');
      return;
    }

    try {
      await addBudget(id as string, {
        item: newItemName,
        quantity: qty,
        unitCost: cost,
        totalCost: qty * cost,
      });
      setNewItemName('');
      setNewQuantity('1');
      setNewUnitCost('');
    } catch (e) {
      Alert.alert('Error', 'Failed to add budget item');
    }
  };

  const handleDeleteBudget = (budgetId: string) => {
    Alert.alert('Confirm Delete', 'Remove this budget line item?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', onPress: () => deleteBudget(budgetId), style: 'destructive' }
    ]);
  };

  const totalBudget = useMemo(() => {
    if (!currentReport?.budgets) return 0;
    return currentReport.budgets.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  }, [currentReport?.budgets]);

  if (isLoading || !currentReport) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      
      {/* Total Card */}
      <Card style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Estimated Budget</Text>
        <Text style={styles.totalValue}>${totalBudget.toFixed(2)}</Text>
      </Card>

      {/* List Existing Budgets */}
      <View style={styles.listContainer}>
        {(!currentReport.budgets || currentReport.budgets.length === 0) && (
          <Text style={styles.emptyText}>No budget items added yet.</Text>
        )}
        
        {currentReport.budgets?.map((budget, index) => (
          <View key={budget._id || index.toString()} style={styles.budgetItem}>
            <View style={styles.budgetInfo}>
              <Text style={styles.budgetName}>{budget.item}</Text>
              <Text style={styles.budgetDetails}>
                {budget.quantity} x ${budget.unitCost.toFixed(2)}
              </Text>
            </View>
            <View style={styles.budgetRight}>
              <Text style={styles.budgetTotal}>${budget.totalCost.toFixed(2)}</Text>
              <TouchableOpacity onPress={() => handleDeleteBudget(budget._id)} style={styles.deleteBtn}>
                <Ionicons name="close-circle" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Add New Budget Form */}
      <Card style={styles.addCard}>
        <Text style={styles.addTitle}>Add Line Item</Text>
        <Input
          label="Item Name"
          placeholder="e.g. Venue Booking, Catering"
          value={newItemName}
          onChangeText={setNewItemName}
        />
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Input
              label="Quantity"
              keyboardType="numeric"
              value={newQuantity}
              onChangeText={setNewQuantity}
            />
          </View>
          <View style={styles.flex1}>
            <Input
              label="Unit Cost ($)"
              keyboardType="numeric"
              placeholder="0.00"
              value={newUnitCost}
              onChangeText={setNewUnitCost}
            />
          </View>
        </View>
        
        <Button 
          title="Add Item" 
          onPress={handleAddBudget} 
          loading={isSaving}
          style={styles.addBtn}
          icon={<Ionicons name="add-circle-outline" size={20} color="#fff" />}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { justifyContent: 'center', alignItems: 'center' },
  totalCard: { padding: spacing.xl, marginBottom: spacing.lg, alignItems: 'center', backgroundColor: colors.primary },
  totalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: fontSize.md, marginBottom: spacing.xs },
  totalValue: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  listContainer: { marginBottom: spacing.xl },
  emptyText: { textAlign: 'center', color: colors.textMuted, fontStyle: 'italic', marginBottom: spacing.lg },
  budgetItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  budgetInfo: { flex: 1 },
  budgetName: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  budgetDetails: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  budgetRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  budgetTotal: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  deleteBtn: { padding: spacing.xs },
  addCard: { padding: spacing.lg, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  addTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginBottom: spacing.md, color: colors.text },
  row: { flexDirection: 'row', gap: spacing.md },
  flex1: { flex: 1 },
  addBtn: { marginTop: spacing.sm },
});
