# Multiplayer Session State Flow

## Complete Session Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         HOME SCREEN                                 │
│                                                                     │
│  ┌─────────────────┐         ┌─────────────────┐                  │
│  │  Create Game    │         │   Join Game     │                  │
│  └────────┬────────┘         └────────┬────────┘                  │
│           │                           │                            │
└───────────┼───────────────────────────┼────────────────────────────┘
            │                           │
            │                           │
            ▼                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         LOBBY SCREEN                                │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  Game: cool-game-123                                       │   │
│  │  2 players connected                                       │   │
│  │                                                            │   │
│  │  Players:                                                  │   │
│  │  • Alice (You) (Host)                                      │   │
│  │  • Bob (Player)                                            │   │
│  │                                                            │   │
│  │  [Host Only]                                               │   │
│  │  ┌──────────────────────────────┐                         │   │
│  │  │  Start Game  (min 2 players) │                         │   │
│  │  └──────────────────────────────┘                         │   │
│  │                                                            │   │
│  │  ┌──────────────────────────────┐                         │   │
│  │  │      Leave Game              │                         │   │
│  │  └──────────────────────────────┘                         │   │
│  └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              │ Host clicks "Start Game"
                              │ (Broadcasts game board to all)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       GAME SCREEN (Playing)                         │
│  ╔══════════════════════════════════════════════════════════════╗  │
│  ║  You're hosting: cool-game-123  (HOST VIEW)                  ║  │
│  ║  You've joined: cool-game-123   (PLAYER VIEW)                ║  │
│  ╠══════════════════════════════════════════════════════════════╣  │
│  ║  [Host: New Round]  ⏱ 02:34  [🌙]      ♥ 5  [⏸] [💡]       ║  │
│  ║  [Player: no button] - Prevents accidental exits             ║  │
│  ╠══════════════════════════════════════════════════════════════╣  │
│  ║                    [Sudoku Board]                            ║  │
│  ╠══════════════════════════════════════════════════════════════╣  │
│  ║                    [Number Pad]                              ║  │
│  ╚══════════════════════════════════════════════════════════════╝  │
└──────┬────────┬────────┬────────┬────────┬─────────┬───────────────┘
       │        │        │        │        │         │
       │        │        │        │        │         │
       ▼        ▼        ▼        ▼        ▼         ▼
   ┌───────┐┌────────┐┌────────┐┌────────┐┌────────┐┌──────────┐
   │ Click ││ Click  ││ Run out││Someone ││  You   ││Host clicks│
   │ Pause ││New Game││ of     ││ else   ││complete││ New Round│
   │       ││/New Rnd││ lives  ││completes│puzzle  ││          │
   └───┬───┘└───┬────┘└───┬────┘└───┬────┘└───┬────┘└────┬─────┘
       │        │          │         │         │          │
       ▼        ▼          ▼         ▼         ▼          ▼
```

## State Transition Details

### 1. PLAYING → PAUSED

**Trigger**: Any player or host clicks [⏸] button
**Broadcast**: `game-paused` event sent to all players
**Result**: All players see PAUSED modal

```
     [PLAYING]
         │
         │ Player/Host clicks [⏸]
         ▼
    ┌─────────────────────────────┐
    │   PAUSED MODAL              │
    │                             │
    │  [MULTIPLAYER]              │
    │  • Resume for All           │ → Broadcasts 'game-resumed' to all
    │  • Leave Current Game       │ → Only you leave session
    │                             │
    │  [SINGLE PLAYER]            │
    │  • Resume                   │ → Resume your game
    │  • End Current Game         │ → Exit to home
    └─────────────────────────────┘
```

### 2. PLAYING → ANOTHER PLAYER WON

**Trigger**: Another player completes puzzle
**Broadcast**: `player-won` event with winner info
**Result**: All other players see SOMEONE WON modal

```
     [PLAYING]
         │
         │ Player "Bob" completes puzzle
         ▼
    ┌─────────────────────────────┐
    │  🎉 SOMEONE WON MODAL       │
    │                             │
    │  Winner: Bob                │
    │  Time: 03:45                │
    │                             │
    │  • Continue Playing         │ → Dismiss, keep playing
    │  • Start New Round (HOST)   │ → Broadcasts new board
    │  • End Game                 │ → Leaves session
    └─────────────────────────────┘
```

### 3. PLAYING → YOU WON

**Trigger**: You complete the puzzle
**Broadcast**: `player-won` event sent to all other players
**Result**: You see WON modal, others see SOMEONE WON modal

```
     [PLAYING]
         │
         │ You complete puzzle
         ▼
    ┌─────────────────────────────┐
    │  CONGRATULATIONS MODAL      │
    │                             │
    │  Time: 03:24                │
    │  🎉 New Record!             │
    │  Best: 03:45                │
    │                             │
    │  [HOST VIEW]                │
    │  • Start New Round          │ → Broadcasts new board
    │  • New Game                 │ → Leaves session
    │                             │
    │  [PLAYER VIEW]              │
    │  • End Game                 │ → Leaves session
    └─────────────────────────────┘
```

### 4. PLAYING → GAME OVER (Lives = 0)

**Trigger**: Player makes mistakes until lives = 0
**Broadcast**: None (local event)
**Result**: Only you see GAME OVER modal

```
     [PLAYING]
         │
         │ Lives reach 0
         ▼
    ┌─────────────────────────┐
    │   GAME OVER MODAL       │
    │                         │
    │  You ran out of lives!  │
    │                         │
    │  • Try Again            │ → Just pauses game
    └─────────────────────────┘
           │
           │ Click "Try Again"
           ▼
    ┌─────────────────────────┐
    │   Game PAUSED           │
    │   (Can leave via header)│
    └─────────────────────────┘
```

### 5. HOST STARTS NEW ROUND

**Trigger**: Host clicks [New Round] button (header or modal)
**Broadcast**: `game-board-shared` event with new puzzle
**Result**: All players' boards reset with new puzzle

```
  [ANY STATE - HOST ONLY]
         │
         │ Host clicks "New Round"
         │
         ▼
    ┌─────────────────────────┐
    │  Generate new puzzle    │
    │  (host's device)        │
    └────────────┬────────────┘
                 │
                 │ Broadcast new board
                 ▼
    ┌─────────────────────────┐
    │  All players receive    │
    │  new board              │
    │  • Timer resets: 00:00  │
    │  • Lives reset          │
    │  • Board clears         │
    │  • Status: PLAYING      │
    └─────────────────────────┘
```

### 6. PLAYER/HOST LEAVES SESSION

**Trigger**: Clicks "New Game" / "End Game" / "End Current Game"
**Broadcast**: None (just disconnects)
**Result**: Only you leave, others continue playing

```
  [ANY STATE]
         │
         │ Click "New Game"/"End Game"
         │
         ▼
    ┌─────────────────────────┐
    │  leaveMultiplayerGame() │
    │  • Unsubscribe channel  │
    │  • Clear multiplayer    │
    │    state                │
    └────────────┬────────────┘
                 │
                 ▼
    ┌─────────────────────────┐
    │  Navigate to HOME       │
    │  (router.push('/'))     │
    └─────────────────────────┘

    Other players:
    • Continue playing
    • See updated player count in lobby
      (if they return to lobby)
```

## Broadcast Events Summary

```
┌──────────────────────────────────────────────────────────────────┐
│                      BROADCAST EVENTS                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. player-joined         → Lobby: New player enters            │
│     { playerId, playerName }                                     │
│                                                                  │
│  2. game-board-shared     → New round starts                    │
│     { board, solution, initialBoard, difficulty, lives }        │
│                                                                  │
│  3. game-paused           → Someone pauses                      │
│     { }                                                          │
│                                                                  │
│  4. game-resumed          → Someone resumes                     │
│     { }                                                          │
│                                                                  │
│  5. player-won            → Someone completes puzzle            │
│     { playerName, completionTime }                              │
│                                                                  │
│  6. request-player-list   → Syncing players                     │
│     { playerId, playerName, isHost }                            │
│                                                                  │
│  7. my-player-info        → Response to sync request            │
│     { playerId, playerName, isHost }                            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Button Action Matrix

| Button               | Available To | Action                        | Broadcasts       |
|---------------------|-------------|-------------------------------|------------------|
| **New Round**       | HOST only (header) | Generate & share new puzzle   | game-board-shared|
| **New Game**        | Single player only | Leave game, go home          | None             |
| **Pause [⏸]**       | ALL         | Pause game for everyone       | game-paused      |
| **Resume**          | Single player (modal) | Resume your game         | None             |
| **Resume for All**  | Multiplayer (modal) | Resume game for all players | game-resumed     |
| **Hint [💡]**       | ALL         | Fill one cell (local only)    | None             |
| **Continue Playing**| ALL (modal) | Dismiss winner modal          | None             |
| **Start New Round** | HOST only (modal) | Generate & share new puzzle   | game-board-shared|
| **End Game**        | ALL (modal) | Leave session, go home        | None             |
| **End Current Game**| Single player (modal) | Exit to home           | None             |
| **Leave Current Game** | Multiplayer (modal) | Only you leave session | None          |
| **Try Again**       | Single player (modal) | Restart game (go home)   | None             |

**Notes**: 
- Players in multiplayer have NO header button - they must use pause menu or modals to exit
- Multiplayer pause modal uses "Resume for All" and "Leave Current Game" to clarify impact

## Fixed Issues ✅

### Previously Fixed Issue 1: "Try Again" Button Behavior
**Was**: Clicking "Try Again" on GAME OVER modal just paused the game
**Fixed**: Now properly shows "End Game" button that leaves the session cleanly

**Solution**:
```typescript
// Line 275-288: Fixed behavior
<TouchableOpacity 
  onPress={async () => {
    if (multiplayer) {
      await leaveMultiplayerGame?.();
    }
    newGame();
    router.push('/');
  }}
>
  <Text>{multiplayer ? 'End Game' : 'Try Again'}</Text>
</TouchableOpacity>
```

### Previously Fixed Issue 2: "Start New Round" in Lost State
**Was**: Host couldn't start new round from Game Over modal
**Fixed**: Host now has "Start New Round" button in lost state modal

**Solution**:
```typescript
// Line 263-273: Added host-only button
{multiplayer && isHost && (
  <TouchableOpacity onPress={startNewRound}>
    <Text>Start New Round</Text>
  </TouchableOpacity>
)}
```

### Previously Fixed Issue 3: Unclear Pause Modal Context
**Was**: Pause modal used same labels ("Resume", "End Current Game") for both single player and multiplayer
- Didn't communicate that "Resume" affects all players
- Didn't clarify that "End Current Game" only removes you from multiplayer session

**Fixed**: Different labels for multiplayer vs single player
- **Multiplayer**: "Resume for All" and "Leave Current Game"
- **Single Player**: "Resume" and "End Current Game"

**Benefits**:
- Players understand their actions affect others in multiplayer
- Clear distinction between solo and multiplayer contexts
- "Leave Current Game" clarifies you're leaving, not ending session for everyone

### Previously Fixed Issue 4: Dangerous Button Position
**Was**: HOST's "New Round" and PLAYER's "New Game" buttons in same position with opposite outcomes
- "New Round" (HOST): Continue session, start fresh puzzle
- "New Game" (PLAYER): Leave session (destructive)
- Risk of muscle memory mistakes causing accidental exits

**Fixed**: Removed PLAYER's header button entirely
- HOST: Keeps "New Round" button
- PLAYER: No header button (empty space)
- Players exit via: Pause menu → "End Current Game" or any modal's "End Game" button

**Benefits**:
- Eliminates confusion and accidental exits
- Clear visual difference between host and player roles
- Safer UX - destructive actions now require intentional navigation

### Note: Modal Priorities
If you complete a puzzle AND someone else completes at nearly the same time,
both modals could try to show (though multiplayerWinner check prevents overlap).
This is acceptable behavior as the multiplayerWinner modal takes precedence.


