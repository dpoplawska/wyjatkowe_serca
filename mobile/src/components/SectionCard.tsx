import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { colors } from '../theme/colors';

export function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.body}>{children}</View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16, backgroundColor: colors.cardBg },
  title: {
    fontWeight: '700',
    fontSize: 16,
    color: colors.red,
    paddingBottom: 10,
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.redTint,
  },
  body: { gap: 16 },
});
