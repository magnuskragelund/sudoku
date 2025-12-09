import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Clock } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfigCard from '../components/ConfigCard';
import ContentBox from '../components/ContentBox';
import ContentSection from '../components/ContentSection';
import Divider from '../components/Divider';
import Modal from '../components/Modal';
import ParticipantCard from '../components/ParticipantCard';
import RoomIdentifier from '../components/RoomIdentifier';
import SectionLabel from '../components/SectionLabel';
import StatusRow from '../components/StatusRow';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { multiplayerService, Player } from '../utils/multiplayerService';

export default function LobbyScreen() {
  const router = useRouter();
  const { colors, typography, spacing, colorScheme } = useTheme();
  const { multiplayer, startMultiplayerGame, leaveMultiplayerGame } = useGame();
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const { width } = useWindowDimensions();
  
  // Responsive max width: 600px for phones, 1000px for tablets/web
  const maxContentWidth = width >= 768 ? 1000 : 600;
  
  // Max players for this game (2 players based on design)
  const maxPlayers = 2;

  const difficulties: { label: string; edition: string; value: string }[] = [
    { label: 'Easy', edition: 'MORNING EDITION', value: 'easy' },
    { label: 'Medium', edition: 'AFTERNOON EDITION', value: 'medium' },
    { label: 'Hard', edition: 'EVENING EDITION', value: 'hard' },
    { label: 'Master', edition: 'WEEKEND EDITION', value: 'master' },
  ];

  // Subscribe once on mount, never re-subscribe
  useEffect(() => {
    // Subscribe to player updates - managed by the service, won't reset on re-subscription
    const unsubscribe = multiplayerService.subscribeToPlayers((updatedPlayers) => {
      setPlayers(updatedPlayers);
      setPlayerCount(updatedPlayers.length);
    });

    // Subscribe to game board shared events to auto-navigate when game starts
    const unsubscribeGameBoard = multiplayerService.subscribeToGameBoard(() => {
      // Use replace instead of push to unmount lobby and clean up its subscriptions
      // This prevents duplicate game board loading when host starts new rounds
      setTimeout(() => {
        router.replace('/game');
      }, 500);
    });

    // Cleanup subscriptions ONLY on actual unmount
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
      if (typeof unsubscribeGameBoard === 'function') {
        unsubscribeGameBoard();
      }
    };
  }, []);

  // Separate effect to redirect if multiplayer is null
  useEffect(() => {
    if (!multiplayer) {
      router.replace('/');
    }
  }, [multiplayer, router]);

  const isHost = multiplayer?.hostId === multiplayerService.getPlayerId();

  const handleStartGame = async () => {
    try {
      // Start the game - this will generate puzzle and broadcast it
      await startMultiplayerGame?.();
      
      // Wait a moment for the game to load, then navigate
      setTimeout(() => {
        router.push('/game');
      }, 500);
    } catch (error) {
      // Error starting game - handled by modal
      setShowErrorModal(true);
    }
  };

  const handleLeave = async () => {
    await leaveMultiplayerGame?.();
    router.replace('/');
  };


  const handleToggleReady = () => {
    setIsReady(!isReady);
  };

  const getDifficultyInfo = () => {
    const diff = difficulties.find(d => d.value === multiplayer?.difficulty);
    return diff || difficulties[1]; // Default to Medium
  };

  if (!multiplayer) {
    return null;
  }

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
          <View style={[
            styles.contentWrapper,
            { maxWidth: maxContentWidth },
            width < 400 && styles.contentWrapperMobile
          ]}>
            {/* Header */}
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={[styles.backButton, { marginBottom: spacing.lg }]}
            >
              <ChevronLeft size={16} color={colors.textSecondary} strokeWidth={1.5} />
              <Text 
                style={[
                  styles.backButtonText,
                  {
                    fontFamily: typography.fontBody,
                    fontSize: typography.textSm,
                    letterSpacing: typography.textSm * typography.trackingNormal,
                    color: colors.textSecondary,
                    marginLeft: spacing.xs,
                  }
                ]}
              >
                RETURN
              </Text>
            </TouchableOpacity>

            <View style={[styles.masthead, { marginBottom: spacing.xl2 }]}>
              <Text 
                style={[
                  styles.label,
                  {
                    fontFamily: typography.fontBody,
                    fontSize: typography.textXs,
                    letterSpacing: typography.textXs * typography.trackingWide,
                    color: colors.textLabel,
                    marginBottom: spacing.sm,
                  }
                ]}
              >
                COMPETITION ROOM
              </Text>
              
              <Text 
                style={[
                  styles.title,
                  {
                    fontFamily: typography.fontSerif,
                    fontSize: typography.text5xl * 1.5,
                    letterSpacing: (typography.text5xl * 1.5) * typography.trackingTight,
                    lineHeight: (typography.text5xl * 1.5) * typography.leadingTight,
                    color: colors.textPrimary,
                    marginBottom: spacing.md,
                  }
                ]}
              >
                Multiplayer Lobby
              </Text>
              
              <View style={[styles.titleUnderline, { backgroundColor: colors.divider, marginBottom: spacing.md }]} />
              
              <Text 
                style={[
                  styles.statusText,
                  {
                    fontFamily: typography.fontBody,
                    fontSize: typography.textSm,
                    letterSpacing: typography.textSm * typography.trackingNormal,
                    color: colors.textSecondary,
                  }
                ]}
              >
                LET CHALLENGERS JOIN
              </Text>
            </View>

            {/* Main Content Box - All content in one box */}
            <ContentBox style={{ marginBottom: spacing.xl2 }}>
              {/* Room Identifier Section - Dark Background */}
              <ContentSection 
                isDark 
                style={{ backgroundColor: colors.primary }}
              >
                <SectionLabel>ROOM IDENTIFIER</SectionLabel>
                <RoomIdentifier roomCode={multiplayer?.channelName || ''} />
              </ContentSection>

              <Divider />

              {/* Match Configuration Section */}
              <ContentSection>
                <SectionLabel>MATCH CONFIGURATION</SectionLabel>
                <View style={[
                  styles.configContainer,
                  width < 400 && styles.configContainerMobile,
                ]}>
                  <ConfigCard
                    label="DIFFICULTY"
                    value={getDifficultyInfo().label}
                    subtext={getDifficultyInfo().edition}
                    isLeft
                  />
                  <ConfigCard
                    label="LIVES"
                    value={String(multiplayer?.lives || 3)}
                    subtext="MISTAKES ALLOWED"
                    isRight
                    isLast
                  />
                </View>
              </ContentSection>

              <Divider />

              {/* Participants Section */}
              <ContentSection>
                <SectionLabel style={{ marginBottom: spacing.md }}>
                  PARTICIPANTS ({playerCount}/{maxPlayers})
                </SectionLabel>
                
                {/* Current Player Card */}
                <ParticipantCard
                  name={players.find(p => p.id === multiplayerService.getPlayerId())?.name || 'You'}
                  isReady={isReady}
                  onToggleReady={handleToggleReady}
                  isTop
                />
                
                {/* Opponent Card(s) */}
                {players.filter(p => p.id !== multiplayerService.getPlayerId()).map((player, index, array) => (
                  <ParticipantCard
                    key={player.id}
                    name={player.name}
                    isMiddle={index < array.length - 1 || playerCount < maxPlayers}
                    isBottom={index === array.length - 1 && playerCount >= maxPlayers}
                  />
                ))}
                
                {/* Awaiting Opponent Placeholder */}
                {playerCount < maxPlayers && (
                  <ParticipantCard
                    name="Awaiting opponent..."
                    isBottom
                    isPlaceholder
                  />
                )}
              </ContentSection>

              <Divider />

              {/* Status Section */}
              <ContentSection>
                <StatusRow 
                  icon={Clock}
                  text="WAITING FOR OPPONENT TO JOIN"
                />
              </ContentSection>

              <Divider />

              {/* Awaiting Full Roster Button */}
              <ContentSection>
                <TouchableOpacity
                  style={[
                    styles.fullRosterButton,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.cardBorder,
                    },
                    playerCount < maxPlayers && styles.fullRosterButtonDisabled,
                  ]}
                  onPress={playerCount >= maxPlayers ? handleStartGame : undefined}
                  disabled={playerCount < maxPlayers}
                  activeOpacity={0.7}
                >
                  <Text 
                    style={[
                      styles.fullRosterButtonText,
                      {
                        fontFamily: typography.fontBody,
                        fontSize: typography.textSm,
                        letterSpacing: typography.textSm * typography.trackingNormal,
                        color: playerCount < maxPlayers ? colors.textTertiary : colors.textPrimary,
                      }
                    ]}
                  >
                    AWAITING FULL ROSTER
                  </Text>
                </TouchableOpacity>
              </ContentSection>
            </ContentBox>
            
            {/* Coming Soon Message */}
            <View style={styles.comingSoonSection}>
              <Text 
                style={[
                  styles.comingSoonText,
                  {
                    fontFamily: typography.fontBody,
                    fontSize: typography.textXs,
                    letterSpacing: typography.textXs * typography.trackingWide,
                    color: colors.textLabel,
                    textAlign: 'center',
                  }
                ]}
              >
                MULTIPLAYER MODE COMING SOON
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
      
      
      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        title="Error"
        subtitle="Failed to start the game"
        primaryButton={{
          text: 'OK',
          onPress: () => setShowErrorModal(false),
        }}
        onClose={() => setShowErrorModal(false)}
      />
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
    paddingBottom: 80,
  },
  contentWrapper: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  contentWrapperMobile: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  backButtonText: {
    textTransform: 'uppercase',
  },
  masthead: {
    alignItems: 'center',
  },
  label: {
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  title: {
    textAlign: 'center',
    fontWeight: '400',
  },
  titleUnderline: {
    width: 96,
    height: 1,
  },
  statusText: {
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  configContainer: {
    flexDirection: 'row',
    gap: 0,
  },
  configContainerMobile: {
    flexDirection: 'column',
    gap: 0,
  },
  fullRosterButton: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  fullRosterButtonDisabled: {
    opacity: 0.5,
  },
  fullRosterButtonText: {
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  comingSoonSection: {
    width: '100%',
    paddingTop: 24,
  },
  comingSoonText: {
    textTransform: 'uppercase',
  },
});
