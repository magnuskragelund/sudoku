import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, Users } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import WebReturnBanner from '../components/WebReturnBanner';
import { useTheme } from '../context/ThemeContext';

export default function MultiplayerSelectScreen() {
  const router = useRouter();
  const { colors, typography, spacing } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Responsive max width: 600px for phones, 1000px for tablets/web
  const maxContentWidth = width >= 768 ? 1000 : 600;

  const handleCreateGame = () => {
    router.push({
      pathname: '/multiplayer',
      params: { mode: 'create' }
    });
  };

  const handleJoinGame = () => {
    router.push({
      pathname: '/multiplayer',
      params: { mode: 'join' }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <LinearGradient
        colors={[colors.backgroundGradientFrom, colors.backgroundGradientTo]}
        style={styles.gradient}
      >
        <WebReturnBanner />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.contentWrapper, { maxWidth: maxContentWidth }]}>
            <ScreenHeader
              label="COMPETITION MODE"
              title="Multiplayer"
              subtitle="CREATE OR JOIN A CHALLENGE"
            />

            {/* Create Game Card */}
            <TouchableOpacity
              style={[
                styles.selectionCard,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.cardBorder,
                  shadowColor: colors.cardShadow,
                  marginBottom: spacing.xl,
                }
              ]}
              onPress={handleCreateGame}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <View style={[styles.iconCircle, { backgroundColor: colors.buttonBackground }]}>
                  <Users size={32} color={colors.textSecondary} strokeWidth={1.5} />
                </View>
              </View>

              <Text
                style={[
                  styles.cardTitle,
                  {
                    fontFamily: typography.fontSerif,
                    fontSize: typography.text3xl,
                    color: colors.textPrimary,
                    marginTop: spacing.lg,
                    marginBottom: spacing.md,
                  }
                ]}
              >
                Create Game
              </Text>

              <Text
                style={[
                  styles.cardDescription,
                  {
                    fontFamily: typography.fontBody,
                    fontSize: typography.textBase,
                    color: colors.textSecondary,
                    marginBottom: spacing.lg,
                    textAlign: 'center',
                  }
                ]}
              >
                Host a new match and invite others to join your puzzle challenge
              </Text>

              <Text
                style={[
                  styles.editionLabel,
                  {
                    fontFamily: typography.fontBody,
                    fontSize: typography.textXs,
                    letterSpacing: typography.textXs * typography.trackingWide,
                    color: colors.textLabel,
                  }
                ]}
              >
                HOST EDITION
              </Text>
            </TouchableOpacity>

            {/* Join Game Card */}
            <TouchableOpacity
              style={[
                styles.selectionCard,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.cardBorder,
                  shadowColor: colors.cardShadow,
                  marginBottom: spacing.xl2,
                }
              ]}
              onPress={handleJoinGame}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <View style={[styles.iconCircle, { backgroundColor: colors.buttonBackground }]}>
                  <ArrowRight size={32} color={colors.textSecondary} strokeWidth={1.5} />
                </View>
              </View>

              <Text
                style={[
                  styles.cardTitle,
                  {
                    fontFamily: typography.fontSerif,
                    fontSize: typography.text3xl,
                    color: colors.textPrimary,
                    marginTop: spacing.lg,
                    marginBottom: spacing.md,
                  }
                ]}
              >
                Join Game
              </Text>

              <Text
                style={[
                  styles.cardDescription,
                  {
                    fontFamily: typography.fontBody,
                    fontSize: typography.textBase,
                    color: colors.textSecondary,
                    marginBottom: spacing.lg,
                    textAlign: 'center',
                  }
                ]}
              >
                Enter a room code to participate in an existing competition
              </Text>

              <Text
                style={[
                  styles.editionLabel,
                  {
                    fontFamily: typography.fontBody,
                    fontSize: typography.textXs,
                    letterSpacing: typography.textXs * typography.trackingWide,
                    color: colors.textLabel,
                  }
                ]}
              >
                CHALLENGER EDITION
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  contentWrapper: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  selectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontWeight: '400',
    textAlign: 'center',
  },
  cardDescription: {
    fontWeight: '400',
    lineHeight: 24,
  },
  editionLabel: {
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
