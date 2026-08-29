import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from "../constants/theme";
import { SectionCard } from "./UIComponents";

export function PlusBadge({ colors = COLORS }) {
  return (
    <View style={[styles.badge, { backgroundColor: colors.gold }]}>
      <Text style={styles.badgeText}>Plus</Text>
    </View>
  );
}

export default function PlusGate({
  unlocked,
  colors = COLORS,
  title,
  body,
  onUnlock,
  children,
}) {
  if (unlocked) return children;

  return (
    <SectionCard style={{ backgroundColor: colors.bgWarm, borderColor: colors.goldLight }}>
      <View style={styles.row}>
        <Text style={styles.lock}>✦</Text>
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>{body}</Text>
        </View>
      </View>
      {!!onUnlock && (
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={onUnlock}>
          <Text style={styles.btnText}>Plus डेमो सुरू करा</Text>
        </TouchableOpacity>
      )}
      <Text style={[styles.note, { color: colors.textLight }]}>
        स्टोअर बिलिंग नंतर जोडले जाईल. डेमो फक्त या खात्यावर क्लाउडमध्ये जतन होते.
      </Text>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { color: COLORS.textWhite, fontSize: FONTS.tiny, fontWeight: "800" },
  row: { flexDirection: "row", gap: SPACING.sm, alignItems: "flex-start" },
  lock: { fontSize: 22 },
  textWrap: { flex: 1 },
  title: { fontSize: FONTS.h4, fontWeight: "800", marginBottom: 4 },
  body: { fontSize: FONTS.small, lineHeight: 20 },
  btn: {
    marginTop: SPACING.md,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm,
    alignItems: "center",
    ...SHADOWS.sm,
  },
  btnText: { color: COLORS.textWhite, fontWeight: "800", fontSize: FONTS.small },
  note: { marginTop: SPACING.sm, fontSize: FONTS.tiny, lineHeight: 16 },
});
