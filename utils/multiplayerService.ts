import { Difficulty } from '../types/game';
import { supabase } from './supabaseClient';

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: number;
}

export interface MultiplayerGame {
  id: string;
  channelName: string;
  hostId: string;
  difficulty: Difficulty;
  lives: number;
  status: 'waiting' | 'playing' | 'finished';
  players: Player[];
  createdAt: number;
}

export interface MultiplayerMove {
  playerId: string;
  row: number;
  col: number;
  number: number;
  timestamp: number;
}

export type MultiplayerCallback = (data: any) => void;

class MultiplayerService {
  public currentChannel: any = null;
  private gameId: string | null = null;
  private playerId: string | null = null;
  private hostId: string | null = null;
  public currentPlayerName: string | null = null;
  private playerListCallback: ((players: Player[]) => void) | null = null;
  private knownPlayers: Player[] = [];

  /**
   * Reset any existing channel and local state before switching games
   */
  private async resetForNewGame(): Promise<void> {
    try {
      if (this.currentChannel) {
        await this.currentChannel.unsubscribe();
      }
    } catch (e) {
      console.log('Error unsubscribing previous channel:', e);
    } finally {
      this.currentChannel = null;
    }
    // Do not reset playerId so a user keeps their identity across games
    this.gameId = null;
    // Keep playerId stable, but reset role/name/game-local state
    this.hostId = null;
    this.currentPlayerName = null;
    this.playerListCallback = null;
    this.knownPlayers = [];
  }

  /**
   * Generate a unique player ID
   */
  private generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Get the current player ID
   */
  getPlayerId(): string {
    if (!this.playerId) {
      this.playerId = this.generatePlayerId();
    }
    return this.playerId;
  }

  /**
   * Create a new multiplayer game
   */
  async createGame(
    channelName: string,
    playerName: string,
    difficulty: Difficulty,
    lives: number
  ): Promise<MultiplayerGame> {
    // Ensure we start clean if a previous game was active
    await this.resetForNewGame();

    const gameId = `game_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const hostId = this.getPlayerId();
    this.hostId = hostId; // Store host ID
    this.currentPlayerName = playerName;
    
    const game: MultiplayerGame = {
      id: gameId,
      channelName,
      hostId,
      difficulty,
      lives,
      status: 'waiting',
      players: [
        {
          id: hostId,
          name: playerName,
          isHost: true,
          joinedAt: Date.now(),
        },
      ],
      createdAt: Date.now(),
    };

    // Store game metadata in Supabase
    const { error } = await supabase
      .from('multiplayer_games')
      .upsert({
        id: gameId,
        channel_name: channelName,
        host_id: hostId,
        difficulty,
        lives,
        status: 'waiting',
        created_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Failed to create game: ${error.message}`);
    }

    // Connect to the game channel for the host
    this.currentChannel = supabase.channel(`game:${gameId}`);
    this.gameId = gameId;

    // Subscribe to game updates
    this.currentChannel.on('broadcast', { event: 'game-update' }, (payload: any) => {
      console.log('Game update received:', payload);
    });

    await this.currentChannel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        console.log('Host channel SUBSCRIBED status:', status);
        
        // Announce host joining
        await this.currentChannel.send({
          type: 'broadcast',
          event: 'player-joined',
          payload: { playerId: hostId, playerName },
        });
        
        console.log('Host announced themselves');
      }
    });

    return game;
  }

  /**
   * Join an existing multiplayer game
   */
  async joinGame(channelName: string, playerName: string): Promise<MultiplayerGame> {
    // Ensure we start clean if a previous game was active
    await this.resetForNewGame();

    // Find the game by channel name
    const { data: gameData, error } = await supabase
      .from('multiplayer_games')
      .select('*')
      .eq('channel_name', channelName)
      .eq('status', 'waiting')
      .single();

    if (error || !gameData) {
      throw new Error('Game not found or has already started');
    }

    const playerId = this.getPlayerId();
    const gameId = gameData.id;
    this.hostId = gameData.host_id; // Store host ID
    this.currentPlayerName = playerName;

    // Connect to the game channel
    this.currentChannel = supabase.channel(`game:${gameId}`);
    this.gameId = gameId;

    // Subscribe to game updates
    this.currentChannel.on('broadcast', { event: 'game-update' }, (payload: any) => {
      console.log('Game update received:', payload);
    });

    this.currentChannel.on('presence', { event: 'sync' }, () => {
      console.log('Presence sync');
    });

    await this.currentChannel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        console.log('Player channel SUBSCRIBED status:', status);
        
        // Broadcast player joined event
        await this.currentChannel.send({
          type: 'broadcast',
          event: 'player-joined',
          payload: { playerId, playerName },
        });
        
        console.log('Player announced themselves');
      }
    });

    return {
      id: gameId,
      channelName,
      hostId: gameData.host_id,
      difficulty: gameData.difficulty as Difficulty,
      lives: gameData.lives,
      status: gameData.status as any,
      players: [
        {
          id: gameData.host_id,
          name: 'Host',
          isHost: true,
          joinedAt: Date.now(),
        },
        {
          id: playerId,
          name: playerName,
          isHost: false,
          joinedAt: Date.now(),
        },
      ],
      createdAt: Date.now(),
    };
  }

  /**
   * Subscribe to player list updates
   */
  subscribeToPlayers(callback: (players: Player[]) => void): () => void {
    if (!this.currentChannel || !this.gameId) return () => {};
    
    // Capture the channel reference at subscription time, not cleanup time
    // This ensures we remove listeners from the correct channel
    const channel = this.currentChannel;
    
    this.playerListCallback = callback;
    // Fresh list for this subscription to avoid leaking players from previous games
    this.knownPlayers = [];

    // Send current player list via broadcast to request sync
    const requestPlayerList = () => {
      channel.send({
        type: 'broadcast',
        event: 'request-player-list',
        payload: {
          playerId: this.playerId,
          playerName: this.currentPlayerName,
          isHost: this.playerId === this.hostId,
        },
      });
    };

    const handlePlayerJoined = (payload: any) => {
      console.log('Player joined broadcast:', payload);
      const { playerId: joinedId, playerName: joinedName } = payload;
      
      // Check if player already exists
      if (!this.knownPlayers.find(p => p.id === joinedId)) {
        this.knownPlayers.push({
          id: joinedId,
          name: joinedName,
          isHost: joinedId === this.hostId,
          joinedAt: Date.now(),
        });
        console.log('Updated players list:', this.knownPlayers);
        callback([...this.knownPlayers]);
      }
    };

    // Listener handlers so we can remove them on unsubscribe
    const playerJoinedHandler = ({ payload }: any) => handlePlayerJoined(payload);
    const requestPlayerListHandler = ({ payload }: any) => {
      console.log('Request for player list received from:', payload);
      // Respond with our current state
      channel.send({
        type: 'broadcast',
        event: 'my-player-info',
        payload: {
          playerId: this.playerId,
          playerName: this.currentPlayerName,
          isHost: this.playerId === this.hostId,
        },
      });
    };
    const myPlayerInfoHandler = ({ payload }: any) => {
      console.log('Received player info:', payload);
      const { playerId: otherId, playerName: otherName, isHost: otherIsHost } = payload;
      
      if (!this.knownPlayers.find(p => p.id === otherId) && otherId !== this.playerId) {
        this.knownPlayers.push({
          id: otherId,
          name: otherName,
          isHost: otherIsHost,
          joinedAt: Date.now(),
        });
        console.log('Updated players list from broadcast:', this.knownPlayers);
        callback([...this.knownPlayers]);
      }
    };

    // Listen for broadcast events on the captured channel
    channel.on('broadcast', { event: 'player-joined' }, playerJoinedHandler);
    channel.on('broadcast', { event: 'request-player-list' }, requestPlayerListHandler);
    channel.on('broadcast', { event: 'my-player-info' }, myPlayerInfoHandler);

    // Send initial request and announce ourself
    setTimeout(() => {
      requestPlayerList();
      if (this.playerId && this.currentPlayerName) {
        this.knownPlayers.push({
          id: this.playerId,
          name: this.currentPlayerName,
          isHost: this.playerId === this.hostId,
          joinedAt: Date.now(),
        });
        callback([...this.knownPlayers]);
      }
    }, 100);

    // Return unsubscribe function
    return () => {
      // Remove listeners from the captured channel reference
      if (channel && typeof channel.off === 'function') {
        try {
          channel.off('broadcast', { event: 'player-joined' }, playerJoinedHandler);
          channel.off('broadcast', { event: 'request-player-list' }, requestPlayerListHandler);
          channel.off('broadcast', { event: 'my-player-info' }, myPlayerInfoHandler);
        } catch (error) {
          console.log('Error during cleanup of player listeners:', error);
        }
      }
      this.playerListCallback = null;
      this.knownPlayers = [];
    };
  }

  /**
   * Broadcast a move to all players
   */
  async broadcastMove(move: MultiplayerMove): Promise<void> {
    if (!this.currentChannel) return;

    await this.currentChannel.send({
      type: 'broadcast',
      event: 'player-move',
      payload: move,
    });
  }

  /**
   * Subscribe to moves from other players
   */
  subscribeToMoves(callback: (move: MultiplayerMove) => void): () => void {
    if (!this.currentChannel) return () => {};

    this.currentChannel.on('broadcast', { event: 'player-move' }, (payload: any) => {
      callback(payload.payload);
    });

    return () => {};
  }

  /**
   * Start the game (host only)
   */
  async startGame(): Promise<void> {
    if (!this.currentChannel || !this.gameId) return;

    // Update game status in database
    await supabase
      .from('multiplayer_games')
      .update({ status: 'playing', channel_name: null })
      .eq('id', this.gameId);

    // Broadcast start event (without game board - will be handled in GameContext)
    await this.currentChannel.send({
      type: 'broadcast',
      event: 'game-started',
      payload: {},
    });
  }

  /**
   * Subscribe to game state changes
   */
  subscribeToGameState(callback: (status: string) => void): () => void {
    if (!this.currentChannel) return () => {};

    this.currentChannel.on('broadcast', { event: 'game-started' }, () => {
      callback('playing');
    });

    this.currentChannel.on('broadcast', { event: 'game-paused' }, () => {
      callback('paused');
    });

    this.currentChannel.on('broadcast', { event: 'game-resumed' }, () => {
      callback('playing');
    });

    this.currentChannel.on('broadcast', { event: 'game-finished' }, () => {
      callback('finished');
    });

    return () => {};
  }

  /**
   * Subscribe to shared game boards
   */
  subscribeToGameBoard(callback: (payload: any) => void): () => void {
    if (!this.currentChannel) return () => {};

    const handler = ({ payload }: any) => {
      callback(payload);
    };

    this.currentChannel.on('broadcast', { event: 'game-board-shared' }, handler);

    return () => {
      if (this.currentChannel && typeof this.currentChannel.off === 'function') {
        try {
          this.currentChannel.off('broadcast', { event: 'game-board-shared' }, handler);
        } catch (error) {
          console.log('Error during cleanup of game board listener:', error);
        }
      }
    };
  }

  /**
   * Leave the current game
   */
  async leaveGame(): Promise<void> {
    if (this.currentChannel) {
      await this.currentChannel.unsubscribe();
      this.currentChannel = null;
    }
    this.gameId = null;
    this.hostId = null;
    this.currentPlayerName = null;
    this.playerListCallback = null;
    this.knownPlayers = [];
  }

  /**
   * Get current game ID
   */
  getCurrentGameId(): string | null {
    return this.gameId;
  }
}

export const multiplayerService = new MultiplayerService();

