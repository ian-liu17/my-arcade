# My Arcade: Snake Arena ? Product Requirements

## Overview
A cheerful browser snake game with a black arena and bright lime, pink, blue, orange, purple, and teal snakes. Players collect pearls, grow, and eat smaller snakes. Everything, including the live leaderboard and controls, must fit within the viewport without page scrolling.

## Entry and setup
- index.html is a friendly arcade welcome page linking to snakes.html.
- snakes.html and online.js contain the game and work offline in local modes.
- Before each new round, choose Single Player or Two Players.
- Require a trimmed name for each selected player (maximum 16 characters). Never insert names as HTML.
- Single player can use WASD, arrows, mouse, trackpad, or touch dragging.
- Local two-player mode shares one keyboard: Player 1 uses WASD; Player 2 uses arrows. Pointer steering is disabled in this mode so it cannot interfere.
- Explain that two-player mode is cooperative: clear the five computer snakes together. Human snakes cannot eat one another.

## Gameplay
- Each human starts with one head and no body, with safe spacing between spawn positions.
- Five computer snakes start with sizes 1 through 5; they have distinct colors and friendly names.
- Maintain 120 randomly placed pearls, away from borders, snakes, and other pearls. A collected pearl disappears and is replaced at another valid position.
- Every pearl adds one segment. Eating an enemy adds its entire size.
- All snakes move continuously at the same base speed, turning smoothly; body segments follow their head.
- Larger snakes eat smaller snakes on contact between any parts. Equal-size snakes pass through. Self-overlap is harmless.
- Enemies collect pearls, avoid borders and larger snakes, and may pursue smaller human snakes. Enemies can eat each other and never respawn during a round.
- A human is eliminated by touching the border with any part or contacting a larger computer snake.
- In single-player mode, elimination ends the round.
- In two-player mode, the surviving human continues. Eliminated players remain visibly marked Out in the HUD. The team loses only when both humans are out.
- The player or team wins when no computer snakes remain and at least one human survives. Losing all humans takes precedence over victory.

## Presentation
- Preserve the established colors and black playfield. Use rounded cards, friendly messages, readable type, and playful decorative details without flashing.
- Show a live top-five leaderboard of surviving snakes, ordered by size, with names, colors, and segment counts.
- The largest surviving snake wears a gold crown. Break ties deterministically by original spawn order, with the same winner shown first on the leaderboard.
- Human heads have white outlines and visible name labels independent of the crown.
- Show each player's name, size, pearls collected, and active/out status, plus enemy count.
- Show the highest individual pearl score and player name beside the leaderboard. Update during play and save locally between visits; keep playing if storage is unavailable.
- Display brief controls and a pause button outside the playable area.
- Size the canvas to the available viewport using a fixed logical 1000 by 640 arena. Resizing must not alter gameplay positions or cause border losses.
- Keep header, leaderboard, arena, instructions, setup, and results within the screen on desktop and mobile. Use compact styles for short screens.

## States and menus
- Setup: mode selector, required name fields, control instructions, and Start.
- Playing: continuous simulation and live rankings.
- Paused: freeze simulation, show Resume and New Game.
- Results: friendly You Win or Game Over heading, cause of loss, per-player size, pearl count, and enemies eaten; offer Play Again and Change Players.
- Play Again retains names and mode but resets the entire round with fresh pearl positions. Change Players returns to setup.
- P or Escape toggles pause. Automatically pause on window blur or a hidden browser tab; resume only by explicit action.

## Technical and accessibility requirements
- No backend, accounts, installation, external assets, or network dependency for local play. Online play uses WebRTC and a public STUN helper.
- Fixed-step simulation with time-based movement and reliable collision checks.
- Real buttons and labeled form fields with keyboard access and visible focus.
- Arrow keys must not scroll the page while playing; touch steering must not scroll the arena.
- Names render as text, not executable markup. Use high contrast and show player identity with labels and outlines as well as color.
- Keep configurable pearl count, enemy count, colors, speed, growth, and arena dimensions.

## Acceptance checks
1. index.html opens the game through a visible Play button.
2. Missing or whitespace-only player names block starting; two-player mode requires both names.
3. Solo controls all steer one player; in two-player mode WASD and arrows independently steer the correct players.
4. Both humans start head-only; 120 valid pearls and five enemies spawn.
5. Growth, pearl replacement, enemy eating, equal-size pass-through, and self-overlap follow the rules.
6. Human snakes cannot eat each other; one elimination does not stop a two-player round.
7. All-human elimination loses; clearing all enemies with a survivor wins.
8. Rankings and the crown update after growth and eliminations; only five surviving snakes appear.
9. Pause, automatic pause, restart, and changing players work without stale inputs.
10. Header, leaderboard, canvas, controls, and menus fit the viewport; resizing preserves the round.

## Out of scope
Public matchmaking, accounts, global scores, power-ups, audio, purchases, and saved progression beyond local high scores and XP.

## XP currency and revives
- Display a shared XP wallet at the top and save it locally between visits.
- Award 5 XP whenever a human becomes the crowned leader, once per reign.
- On each human death, freeze play and offer five seconds to spend 5 XP to revive or skip. In two-player mode offer each newly eliminated player a turn.
- Revive with the same length, pearls, and kills in a safe coiled position, with five seconds of protection from enemy collisions. Borders still eliminate the snake.
- Insufficient XP disables buying a revive; skipping or expiry continues with surviving players or ends the round.

## Online rooms: the plan (written before building)
- Play with a friend on another device using Host Game and Join Game.
- The host is the captain: their browser runs the game and sends the same arena to their friend.
- Use WebRTC data connections, manual invitation and reply codes, no database, accounts, matchmaking backend, or paid hosting.
- Anyone can host a separate room. There is no public server list: finding strangers needs a shared service.
- First release: two friends per room, with cooperative rules. Each uses their own arrows or WASD.
- Host sends an invitation; friend pastes it and sends a reply; host pastes the reply. Codes are compressed, copyable, and single use. They still contain connection details, so they are longer than a tiny room number.
- A public STUN helper can help browsers find each other; it does not store or run the game. Some networks require a relay, which this release does not provide. Explain connection failures simply.
- Host chooses when to start, pause, resume, restart and spend the shared host XP on revives. Guest watches the same countdown and results.
- Online XP belongs to the host wallet; do not overwrite the guest's saved XP. Local modes keep their existing rules.
- Closing or leaving a room stops the connection and returns to local setup. If a friend disconnects, freeze the match and explain how to reconnect with fresh codes.
- Keep local single-player and same-keyboard play working offline.
- Check code validation, host/guest input routing, matching arena snapshots, pause, revive, restart, disconnect and local-mode regression. Real connections between different networks require a two-device check.

## Online implementation verification
- Automated simulated-browser checks cover host/join lifecycle, identical arena snapshots, independent controls, pause/results/revive states, invalid codes, disconnect handling, saved XP isolation, and returning to local play.
- Real WebRTC connectivity across two devices or networks has not been verified here. Test by sending an invitation and reply between two browsers, then starting the room.

## Shorter online codes and GitHub Pages
- Compress invitation and reply details inside the browser using deflate, with a versioned S2O/S2A code. Keep old JSON codes readable.
- Allow pasted codes to wrap over multiple lines. Explain incomplete codes and invitation/reply mix-ups simply. Limit decoded data size.
- Use built-in browser tools, no library download, database, or new backend. Older browsers can still generate the original format.
- Keep index.html, snakes.html, and online.js together when publishing to GitHub Pages; the script uses a relative path that works in a project subfolder. Publishing is a later step.
