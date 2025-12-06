import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Moon, Palette, Sun, Trophy, User, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const { theme, setTheme, colors, typography, spacing, colorScheme } = useTheme();
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const { width } = useWindowDimensions();
  
  // Responsive max width: 600px for phones, 1000px for tablets/web
  const maxContentWidth = width >= 768 ? 1000 : 600;


  const Divider = () => (
    <View style={styles.dividerContainer}>
      <View style={[styles.divider, { backgroundColor: colors.divider }]} />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.backgroundGradientFrom, colors.backgroundGradientTo]}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.contentWrapper, { maxWidth: maxContentWidth }]}>
            {/* Masthead Section */}
            <View style={[styles.masthead, { marginBottom: spacing.xl3 }]}>
              <Text 
                style={[
                  styles.establishedLabel, 
                  { 
                    color: colors.textLabel,
                    fontFamily: typography.fontBody,
                    fontSize: typography.textXs,
                    letterSpacing: typography.textXs * typography.trackingWide,
                    marginBottom: spacing.sm,
                  }
                ]}
              >
                EST. 2025
              </Text>
              
              <Text 
                style={[
                  styles.mainTitle, 
                  { 
                    fontFamily: typography.fontSerif,
                    fontSize: typography.text8xl,
                    letterSpacing: typography.text8xl * typography.trackingTight,
                    lineHeight: typography.text8xl * typography.leadingTight,
                    marginBottom: spacing.sm,
                    color: colors.textPrimary,
                  }
                ]}
              >
                Sudoku
              </Text>
              
              <Divider />
              
              <Text 
                style={[
                  styles.subtitle, 
                  { 
                    color: colors.textSubtitle,
                    fontFamily: typography.fontBody,
                    fontSize: typography.textSm,
                    letterSpacing: typography.textSm * typography.trackingNormal,
                    marginTop: spacing.md,
                  }
                ]}
              >
                THE DAILY PUZZLE
              </Text>
            </View>

            {/* Theme Selector Modal */}
            {showThemeSelector && (
              <View style={[styles.selectorOverlay, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                <Text style={[styles.selectorLabel, { fontFamily: typography.fontBody, fontSize: typography.textXs, letterSpacing: typography.textXs * typography.trackingNormal, color: colors.textLabel, marginBottom: spacing.md }]}>
                  APPEARANCE
                </Text>
                {(['light', 'system', 'dark'] as const).map((themeOption) => (
                  <TouchableOpacity
                    key={themeOption}
                    style={[
                      styles.themeOption,
                      { 
                        borderColor: colors.cardBorder,
                        backgroundColor: theme === themeOption ? colors.primary : 'transparent',
                        marginBottom: spacing.sm,
                      }
                    ]}
                    onPress={() => setTheme(themeOption)}
                  >
                    <View style={styles.themeOptionContent}>
                      {themeOption === 'light' && <Sun size={20} color={theme === themeOption ? colors.cardBackground : colors.textSecondary} />}
                      {themeOption === 'dark' && <Moon size={20} color={theme === themeOption ? colors.cardBackground : colors.textSecondary} />}
                      <Text style={[
                        styles.themeOptionText,
                        {
                          fontFamily: typography.fontBody,
                          fontSize: typography.textBase,
                          color: theme === themeOption ? colors.cardBackground : colors.textPrimary,
                          marginLeft: spacing.sm,
                        }
                      ]}>
                        {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.buttonBackground, marginTop: spacing.md }]}
                  onPress={() => setShowThemeSelector(false)}
                >
                  <Text style={[styles.cancelButtonText, { fontFamily: typography.fontBody, fontSize: typography.textSm, letterSpacing: typography.textSm * typography.trackingNormal, color: colors.textSecondary }]}>
                    CLOSE
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {!showThemeSelector && (
              <>
                {/* Main Content Cards */}
                <View style={{ marginBottom: spacing.xl }}>
                  {/* Featured - Single Player Card */}
                  <TouchableOpacity
                    style={[
                      styles.featuredCard,
                      { 
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.cardBorder,
                        marginBottom: spacing.lg,
                        shadowColor: colors.cardShadow,
                      }
                    ]}
                    onPress={() => router.push('/difficulty')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.featuredCardContent}>
                      <View style={[styles.featuredCardHeader, { marginBottom: spacing.md }]}>
                        <View style={styles.featuredCardText}>
                          <Text style={[styles.cardLabel, { fontFamily: typography.fontBody, fontSize: typography.textXs, letterSpacing: typography.textXs * typography.trackingNormal, color: colors.textLabel, marginBottom: spacing.sm }]}>
                            FEATURED
                          </Text>
                          <Text style={[styles.featuredCardTitle, { fontFamily: typography.fontSerif, fontSize: typography.text5xl, lineHeight: typography.text5xl * typography.leadingTight, color: colors.textPrimary, marginBottom: spacing.md }]}>
                            Single Player
                          </Text>
                        </View>
                        <View style={[styles.featuredCardIcon, { backgroundColor: colors.buttonBackground }]}>
                          <User size={40} color={colors.textPrimary} strokeWidth={1.5} />
                        </View>
                      </View>
                      <Text style={[styles.featuredCardDescription, { fontFamily: typography.fontBody, fontSize: typography.textLg, lineHeight: typography.textLg * typography.leadingRelaxed, color: colors.textSecondary, width: '100%' }]}>
                        Challenge yourself with our curated selection of puzzles. From beginner to master difficulty.
                      </Text>
                    </View>
                    </TouchableOpacity>

                  {/* Two Column Cards */}
                  <View style={styles.twoColumnContainer}>
                    {/* Multiplayer Card */}
                    <TouchableOpacity
                      style={[
                        styles.smallCard,
                        { 
                          backgroundColor: colors.cardBackground,
                          borderColor: colors.cardBorder,
                          shadowColor: colors.cardShadow,
                        }
                      ]}
                      onPress={() => router.push('/multiplayer')}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.cardLabel, { fontFamily: typography.fontBody, fontSize: typography.textXs, letterSpacing: typography.textXs * typography.trackingNormal, color: colors.textLabel, marginBottom: spacing.sm }]}>
                        COMPETITION
                      </Text>
                      <Text style={[styles.smallCardTitle, { fontFamily: typography.fontSerif, fontSize: typography.text3xl, lineHeight: typography.text3xl * typography.leadingTight, color: colors.textPrimary, marginBottom: spacing.sm }]}>
                        Face Off
                      </Text>
                      <Text style={[styles.smallCardDescription, { fontFamily: typography.fontBody, fontSize: typography.textSm, lineHeight: typography.textSm * typography.leadingRelaxed, color: colors.textSecondary, marginBottom: spacing.lg }]}>
                        Race against opponents in real-time
                      </Text>
                      <View style={[styles.smallCardIcon, { backgroundColor: colors.buttonBackground }]}>
                        <Users size={28} color={colors.textPrimary} strokeWidth={1.5} />
                      </View>
                    </TouchableOpacity>

                    {/* Highscores Card */}
                    <TouchableOpacity
                      style={[
                        styles.smallCard,
                        { 
                          backgroundColor: colors.cardBackground,
                          borderColor: colors.cardBorder,
                          shadowColor: colors.cardShadow,
                        }
                      ]}
                      onPress={() => router.push('/highscores')}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.cardLabel, { fontFamily: typography.fontBody, fontSize: typography.textXs, letterSpacing: typography.textXs * typography.trackingNormal, color: colors.textLabel, marginBottom: spacing.sm }]}>
                        LEADERBOARD
                      </Text>
                      <Text 
                        numberOfLines={2}
                        adjustsFontSizeToFit={true}
                        minimumFontScale={0.85}
                        style={[styles.smallCardTitle, { fontFamily: typography.fontSerif, fontSize: typography.text3xl, lineHeight: typography.text3xl * typography.leadingTight, color: colors.textPrimary, marginBottom: spacing.sm }]}>
                        High Scores
                      </Text>
                      <Text style={[styles.smallCardDescription, { fontFamily: typography.fontBody, fontSize: typography.textSm, lineHeight: typography.textSm * typography.leadingRelaxed, color: colors.textSecondary, marginBottom: spacing.lg }]}>
                        View the top performers
                      </Text>
                      <View style={[styles.smallCardIcon, { backgroundColor: colors.buttonBackground }]}>
                        <Trophy size={28} color={colors.textPrimary} strokeWidth={1.5} />
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Appearance Settings Button */}
                  <TouchableOpacity
                    style={[styles.darkButton, { marginTop: spacing.lg }]}
                    onPress={() => setShowThemeSelector(true)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[colors.buttonBackgroundDarkFrom, colors.buttonBackgroundDarkTo]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.darkButtonGradient}
                    >
                      <Palette size={20} color={colorScheme === 'dark' ? colors.textPrimary : '#FFFFFF'} strokeWidth={1.5} />
                      <Text style={[styles.darkButtonText, { fontFamily: typography.fontBody, fontSize: typography.textSm, letterSpacing: typography.textSm * typography.trackingNormal, color: colorScheme === 'dark' ? colors.textPrimary : '#FFFFFF' }]}>
                        APPEARANCE SETTINGS
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Footer */}
            <View style={[styles.footer, { marginTop: spacing.xl2 }]}>
              <Text style={[styles.footerText, { fontFamily: typography.fontBody, fontSize: typography.textXs, letterSpacing: typography.textXs * typography.trackingNormal, color: colors.textLabel }]}>
                © 2025 THE SUDOKU TIMES • ALL RIGHTS RESERVED
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
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
  },
  contentWrapper: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
    paddingBottom: 80,
  },
  masthead: {
    alignItems: 'center',
  },
  establishedLabel: {
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  mainTitle: {
    textAlign: 'center',
    fontWeight: '400',
  },
  dividerContainer: {
    width: 96,
    height: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    width: '100%',
    height: 1,
  },
  subtitle: {
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  featuredCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  featuredCardContent: {
    width: '100%',
  },
  featuredCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  featuredCardText: {
    flex: 1,
    marginRight: 16,
  },
  cardLabel: {
    textTransform: 'uppercase',
  },
  featuredCardTitle: {
    fontWeight: '400',
  },
  featuredCardDescription: {
    fontWeight: '400',
  },
  featuredCardIcon: {
    width: 72,
    height: 72,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  twoColumnContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  smallCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  smallCardTitle: {
    fontWeight: '400',
    flexShrink: 1,
  },
  smallCardDescription: {
    fontWeight: '400',
    flex: 1,
  },
  smallCardIcon: {
    width: 52,
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  darkButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  darkButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  darkButtonText: {
    textTransform: 'uppercase',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  selectorOverlay: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    marginVertical: 32,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  selectorLabel: {
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  themeOption: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  themeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeOptionText: {
    fontWeight: '400',
  },
  cancelButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  cancelButtonText: {
    textTransform: 'uppercase',
  },
});
