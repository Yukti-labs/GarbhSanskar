import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, FONTS, SPACING, RADIUS } from "../constants/theme";

function parseMinutes(durationText, fallback = 5) {
  const match = String(durationText || "").match(/(\d+)/);
  const value = match ? Number(match[1]) : fallback;
  if (!Number.isFinite(value) || value <= 0) return fallback * 60;
  if (value > 90) return fallback * 60;
  return value * 60;
}

export default function SessionTimer({
  label = "सराव",
  durationText,
  minutes,
  colors = COLORS,
}) {
  const total = minutes ? minutes * 60 : parseMinutes(durationText);
  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    setRemaining(total);
    setRunning(false);
  }, [total]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bgMuted, borderColor: colors.borderLight }]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.time, { color: colors.textPrimary }]}>{mm}:{ss}</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={() => setRunning((prev) => !prev)}
        >
          <Text style={styles.btnText}>{running ? "विराम" : remaining === 0 ? "पुन्हा" : "सुरू"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.borderLight }]}
          onPress={() => {
            setRunning(false);
            setRemaining(total);
          }}
        >
          <Text style={[styles.resetText, { color: colors.textPrimary }]}>रीसेट</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    alignItems: "center",
  },
  label: { fontSize: FONTS.tiny, fontWeight: "700" },
  time: { fontSize: 28, fontWeight: "800", marginVertical: SPACING.xs },
  row: { flexDirection: "row", gap: SPACING.sm },
  btn: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  btnText: { color: COLORS.textWhite, fontWeight: "800", fontSize: FONTS.small },
  resetText: { fontWeight: "800", fontSize: FONTS.small },
});
