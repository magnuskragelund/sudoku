# Design Specification: Sudoku Hint Mode

## 1. Requirements Analysis
Based on the project constraints and current implementation details:

* **View Type:** Full-screen takeover (Modal).
* **Board State:**
    * **Visibility:** Must remain visible as a reference while reading the hint.
    * **Interaction:** Must be disabled/static (user cannot play moves in this mode).
    * **Prominence:** Can be reduced in size/emphasis compared to the active gameplay mode.
* **Navigation:** A mandatory mechanism to exit Hint Mode and return to the game.
* **Content Strategy:**
    * Display the primary "Hint" (concise).
    * Provide an "Elaborate" action.
    * **Constraint:** The elaboration results in lengthy text, requiring scrolling.

---

## 2. The UX Challenge
**"Context vs. Content"**
The user encounters a vertical real estate conflict:
* **Context:** The Board (takes up ~50-60% of the screen).
* **Content:** The Explanation (requires scrolling).
* **The Conflict:** As the user scrolls down to read the explanation, the reference board typically disappears off the top of the screen, forcing the user to scroll back and forth to understand the logic.

---

## 3. Proposed UI Patterns

### Option A: The "Bottom Sheet" (Recommended)
This pattern is standard in modern iOS/Android apps for contextual details. It physically separates the "Reference" from the "Reading" area.

* **The Layout:**
    * **Top Area (Reference):** The board scales down (e.g., to 75% size) and anchors to the top center. It remains fixed.
    * **Bottom Area (Content):** A rounded "Sheet" slides up from the bottom, overlaying the lower part of the screen.
* **The Interaction:**
    * The hint text lives inside the sheet.
    * When **"Elaborate"** is tapped, the sheet expands or becomes scrollable.
    * **Crucial Detail:** The sheet content scrolls independently. The board at the top never moves.
* **The Exit:**
    * Swipe the sheet down **OR** tap a small "X" icon in the corner of the sheet.

### Option B: The "Fixed Header" Split
If you prefer to keep the flat, full-screen look rather than a layered sheet.

* **The Layout:**
    * **Header (Sticky):** The top 35-40% of the screen is a fixed container holding the Board.
    * **Body (Scrollable):** The bottom 60% is a scroll view containing the text.
* **The Behavior:**
    * The text slides *under* the board header as the user scrolls. The board is always visible.

---

## 4. Immediate UI Refinements
These changes apply regardless of which pattern you select:

1.  **Optimize the Exit Action:**
    * **Current:** A large "EXIT HINT MODE" text container takes up valuable vertical space at the top.
    * **Fix:** Replace with a standard **Icon Button (X)** or **"Done"** text button in the top navigation bar or floating in the corner. This saves ~60px of vertical space.

2.  **Visual Linking:**
    * **Current:** Text describes a location (e.g., "Row 3, Column 7").
    * **Fix:** When the hint is active, visually highlight the specific row, column, or cell on the board using color. This creates an immediate cognitive link between the text and the board.

3.  **Progressive Disclosure:**
    * Keep the **"Elaborate"** button.
    * Do not auto-expand the long text. This keeps the UI clean and prevents the user from feeling overwhelmed upon entering the mode.