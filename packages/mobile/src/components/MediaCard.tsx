// ─── ICKAR Mobile — MediaCard Component ───────────────────────────────────────
import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  Image,
  StyleSheet,
} from 'react-native';
import { Colors, Spacing, FontSize, Radius, Shadow } from '../types/theme';
import type { MediaItem } from '../types';

interface Props {
  item: MediaItem;
  onPress: () => void;
  horizontal?: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  audiobook: '🎧 Audiobook',
  ebook:     '📖 eBook',
  pdf:       '📄 PDF',
};

export function MediaCard({ item, onPress, horizontal = false }: Props) {
  const priceNaira = (item.priceKobo / 100).toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  });

  if (horizontal) {
    return (
      <TouchableOpacity style={[styles.cardH, Shadow.card]} onPress={onPress} activeOpacity={0.85}>
        <Image source={{ uri: item.coverUrl }} style={styles.coverH} />
        <View style={styles.infoH}>
          <Text style={styles.typeLabel}>{TYPE_LABEL[item.type] ?? item.type}</Text>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.author} numberOfLines={1}>{item.author}</Text>
          <Text style={styles.price}>{priceNaira}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.card, Shadow.card]} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: item.coverUrl }} style={styles.cover} />
      <View style={styles.info}>
        <Text style={styles.typeLabel}>{TYPE_LABEL[item.type] ?? item.type}</Text>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.author} numberOfLines={1}>{item.author}</Text>
        <Text style={styles.price}>{priceNaira}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Vertical card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
    width: 160,
    marginRight: Spacing.md,
  },
  cover: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.surfaceAlt,
  },
  info: {
    padding: Spacing.sm,
  },
  // Horizontal card
  cardH: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  coverH: {
    width: 80,
    height: 100,
    backgroundColor: Colors.surfaceAlt,
  },
  infoH: {
    flex: 1,
    padding: Spacing.sm,
    justifyContent: 'center',
  },
  // Shared
  typeLabel: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    marginBottom: 2,
    fontWeight: '600',
  },
  title: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: 2,
  },
  author: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  price: {
    fontSize: FontSize.sm,
    color: Colors.success,
    fontWeight: '700',
  },
});
