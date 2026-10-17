# Interactive media

## Folder layout

- `space-age-racer/`: race renderer, obstacle simulation, and podracer model.

Space Age Racer uses solid desert obstacles only. Speed, obstacle density and pattern length increase gradually over 75 seconds, with regular recovery periods. Centre passages appear after 10 seconds and chicanes after 20 seconds.
- `ARUP/`: runner and its cropped PNG letter logos (original WebP sources retained).

ARUP runner: hold Space, Up, or the pointer on the track for a higher jump; release early for a short hop. Inputs just before landing are buffered for 120 ms. Each collision costs one letter, and stars restore letters. Collisions and star pickups use each visible letter's alpha mask, excluding transparent margins and faint shadows, mapped to its rendered size and position. The pace increases gradually, with airborne obstacles introduced after 15 seconds. Distance and HIGH appear below the track only during play. Losing all letters returns to the title automatically; Escape exits. Hidden tabs pause the simulation.
- `aeon/`: title interaction and damage simulation.
- `impact/`: magnetic cube, voxel title, spring simulation, text sampling, and cube preview.
- `necromunda/`: shooting gallery, enemies, rifle, and animated bolt.
- `proteo/`: red ball with drag physics, gravity, inertia, and bounded rebounds beside the project title. Escape resets the interaction.
- `source/`: lighting interaction, game simulation, and avatar.
- `vendor/`: shared Three.js library and licence.

Imports between files in the same mini-game stay relative to their folder. Page-facing asset URLs in `JS/main.js` and `CSS/styles.css` use these folder paths.

Impact's title is sampled from the loaded Raleway font and rebuilt with small black cubes. `text-shape.js` generates their resting positions; `magnetic-cube.js` renders them with an instanced mesh and runs the spring simulation. The same renderer also supports the original 4 × 4 × 4 cube.

- The cube stays fixed at rest. Hold the pointer and move to apply a narrow spray of force. Only pieces in its cone are pushed; they return as the spray moves away or stops. Hold Space/Enter to spray the centre when the canvas has keyboard focus.
- The toys are bonus interactions without instructions or visible messages. Short accessible names identify them. Impact's image gallery and hero remain independent of them.
- Title and cube render into transparent page-sized canvases behind the content. Their original title/widget elements receive pointer input; camera view offsets keep the resting objects anchored there while letting scattered pieces travel across the page.
- Title and cube share pointer capture on their project surface: a gesture starting on either widget applies to both renderers, including when the pointer moves outside the widgets. Keyboard spraying shares the focused widget's screen position.
- Three.js 0.180.0 is stored locally in `vendor/`, with its MIT licence. No CDN request is needed at runtime.
- `spring.js` contains the movement simulation. `cube.svg` is the gallery thumbnail and static preview.
- `Assets/impact/content.json` selects the interactions through `titleToy` and `titleCube` identifiers; these objects contain no instructions or messages.
- The scene starts after the page transition. Leaving the toy stops rendering and disposes GPU resources; outgoing page transitions retain the last frame until the page is removed.
- Hidden tabs and offscreen canvases pause rendering. Pixel density is capped at 1.75.

Run the site through a local HTTP server, as required for JSON requests and JavaScript modules.

To add another toy, extend the module registry and media selection in `JS/main.js`. The initial integration reserves media index `-2` for this first toy; additional toys will need distinct indices.
