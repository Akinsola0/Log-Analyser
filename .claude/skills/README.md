# Vendored skills

Skills checked into this repository so every session — local, web, or anyone
else's clone — picks them up automatically. Claude Code loads them from
`.claude/skills/<name>/SKILL.md` at session start.

## ui-ux-pro-max

| | |
|---|---|
| Source | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill |
| Version | 2.13.0 |
| Commit | `f2326710` (2026-08-31) |
| Licence | MIT — © 2024 Next Level Builder (see the upstream `LICENSE`) |
| Size | ~3.3 MB, mostly CSV data |

Searchable local design data — UI styles, product colour palettes, font
pairings, UX guidelines, icons, motion presets, chart types and per-stack
implementation notes — queried through a Python script that needs only the
standard library:

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain>
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system
```

### What was changed from upstream

Two things, both deliberate:

1. **Invocation paths in `SKILL.md`** use `${CLAUDE_PLUGIN_ROOT:-.}` instead of
   `${CLAUDE_PLUGIN_ROOT}`. That variable is only set when the skill is
   installed as a plugin; vendored like this it is empty, and the command would
   resolve to `/.claude/...` and fail. The fallback makes it work from the
   repository root either way.
2. **`scripts/tests/` removed** — upstream's own test suite, not needed to run
   the skill.

Nothing else is modified, so upgrading is a re-copy of
`.claude/skills/ui-ux-pro-max/` from a fresh clone plus those two edits.

### Upgrading

```bash
git clone --depth 1 https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git /tmp/uupm
rm -rf .claude/skills/ui-ux-pro-max
cp -r /tmp/uupm/.claude/skills/ui-ux-pro-max .claude/skills/
rm -rf .claude/skills/ui-ux-pro-max/scripts/tests
# then re-apply the ${CLAUDE_PLUGIN_ROOT:-.} edit in SKILL.md
```

---

## frontend-design

| | |
|---|---|
| Source | https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design |
| Plugin version | 1.1.0 |
| Commit | `f275fa28` (2026-08-31) |
| Licence | **© Anthropic PBC, all rights reserved** — use is subject to Anthropic's Commercial Terms of Service. Unlike the other two vendored skills this is **not** MIT, so it is included here under attribution and is not relicensed by this repository. |
| Size | 8 KB, one file |

Anthropic's own frontend design skill: how to arrive at a distinctive visual
direction rather than a templated one — brainstorm and critique before
building, ground the design in the actual subject, spend boldness in one
place, and write interface copy as design material. Prose only, no scripts and
no data.

Upstream ships it as a plugin (`.claude-plugin/plugin.json` plus the skill).
Only `skills/frontend-design/` is vendored here, verbatim; the manifest and
README stay upstream.

Worth knowing when it argues with our current design: it names "a near-black
background with a single bright acid-green or vermilion accent" as one of
three looks AI reaches for by default. The TradeDesk direction is near-black
with a crimson-to-magenta accent, which is adjacent — but it came from the
reference images in the brief, and the skill is explicit that "the brief's own
words always win". Treat it as a prompt to justify the choice, not to undo it.

---

## awesome-design-skills (67 style presets)

| | |
|---|---|
| Source | https://github.com/bergside/awesome-design-skills |
| Commit | `f631a09b` (2026-06-28) |
| Licence | MIT — © 2026 Bergside; individual skills credit `typeui.sh` |
| Size | ~850 KB, markdown only |

Each one is a named visual direction: a `SKILL.md` with foundations (type
scale, colour tokens, spacing rhythm, do/don't rules) and a `DESIGN.md` with
the same as a machine-readable token spec. No scripts — nothing here executes.

They are **style presets, not house rules.** Reach for one when starting a new
surface or exploring a direction; the project's own tokens in
`tradedesk-ai/app/globals.css` win when they disagree.

### What was changed from upstream

Nothing inside the skills. Two things were left out: upstream's
`skills/index.json` (a registry manifest whose paths don't match this layout —
the table below replaces it) and a stray `.DS_Store`.

### The 67

| Skill | Direction |
|-------|-----------|
| `agentic` | Conversational AI-first interface with minimal controls, clear outcomes, and delegated task flows for agentic workflows. |
| `ant` | Structured, enterprise-focused design system emphasizing clarity, consistency, and efficiency for data-dense web applications. |
| `artistic` | High-contrast, expressive style with creative typography and bold color choices for visually striking interfaces. |
| `basic` | Print-inspired visual language for books, magazines, and reports with editorial grids and expressive typography. |
| `bento` | Modular grid layout with card-like blocks, clear hierarchy, soft spacing, and subtle visual contrast for organized, scannable interfaces. |
| `bold` | Strong visual presence with heavyweight typography, high-contrast colors, and commanding layouts. |
| `brutalism` | Raw, anti-design aesthetic inspired by concrete architecture with unadorned elements, jarring layouts, and functional minimalism. |
| `cafe` | Cozy cafe-inspired interface with warm tones, soft typography, and clean layouts for a relaxed browsing experience. |
| `claude` | A research-journal aesthetic printed on warm stone — authoritative, editorial, almost achromatic. Pages live on warm ivory parchment (never pure white), with near-black slate as the dominant ink. |
| `claymorphism` | Soft, rounded 3D-like shapes mimicking malleable clay with playful, puffy elements and colorful surfaces. |
| `clean` | Simplicity-focused design with ample whitespace, legible typography, and a limited color palette to reduce visual clutter. |
| `codex` | A radically minimal, blank-canvas interface built as a pure edge-to-edge surface, with almost no color and typography carrying the visual weight. Black serves as the only filled color, the only divider, and the sole surface tone cards. |
| `colorful` | Vibrant, high-contrast palettes and gradients for engaging, memorable, and modern user experiences. |
| `contemporary` | Current-era minimalist design with bento grids, dark mode support, and high-performance accessible layouts. |
| `corporate` | Professional, brand-aligned design with structured grids, minimalist layouts, and consistent enterprise patterns. |
| `cosmic` | Futuristic sci-fi aesthetic with dark themes, vibrant neon accents, and immersive spatial elements. |
| `creative` | Playful, character-driven design with expressive typography and bold graphics for landing pages and creative projects. |
| `dithered` | Dot-pattern rendering technique that simulates shades with a limited palette for nostalgic, retro, high-contrast visuals. |
| `doodle` | Hand-drawn, sketch-like style with doodles, handwritten fonts, and imperfect lines for a playful, informal feel. |
| `dramatic` | High-contrast, theatrical design with bold layouts, immersive visuals, and unconventional compositions that command attention. |
| `editorial` | Magazine-inspired editorial layout with refined serif typography, structured grids, and elegant reading experiences. |
| `enterprise` | Dark-themed cloud-platform aesthetic with modular grids, glass-like panels, and strong data hierarchy for productivity dashboards. |
| `expressive` | Vibrant, personality-driven design with bold colors, playful graphics, and dynamic layouts that balance creativity with structure. |
| `fantasy` | Game-inspired fantasy aesthetic with bold, premium visuals, rich color palettes, and immersive thematic elements. |
| `fiction` | A playful, energetic, cartoonesque interface inspired by friendly children's-book illustrations — warm cream backgrounds, big bold custom display typography, saturated brand color blocks, thick black outlines, generously rounded shapes |
| `flat` | Two-dimensional minimalist style with vibrant colors, clean typography, and no 3D effects for fast, user-friendly interfaces. |
| `friendly` | Approachable, intuitive design with rounded elements, ample whitespace, and soft pastel color palettes. |
| `futuristic` | Forward-looking design with tech-inspired typography, modern layouts, and a sleek, innovation-driven aesthetic. |
| `geometric` | Geometric, structured design with clean typography, neutral colors, precise shapes, and intuitive layouts that stay out of the way. |
| `glassmorphism` | Frosted glass effect with translucent layers, subtle blur, and luminous borders for depth and modern elegance. |
| `gradient` | Smooth color transitions and gradient-rich surfaces for modern, playful interfaces with visual depth. |
| `immersive` | An immersive, interactive, exhibit-style interface that blends storytelling, animation, and gamified elements to create a playful, experience-driven journey. The entire app sits on a single continuous brand-colored canvas (deep green) |
| `impeccable` | A modern, graphic, editorial-poster aesthetic — warm and confident — built on alternating cream and burnt orange sections, an amber brand color. |
| `levels` | Conversion-focused design that removes friction and guides users toward action through clarity, trust, and speed. |
| `lingo` | Playful, minimal design with bright colors, rounded shapes, tactile 3D borders, and friendly illustrations for approachable interfaces. |
| `material` | Google's Material Design with layered surfaces, dynamic theming, built-in motion, and responsive cross-platform patterns. |
| `matrix` | A cyber-slick, dark-only Matrix-inspired interface defined by minimalist fashion, high-tech digital elements |
| `minimal` | Stripped-back design emphasizing whitespace, clean typography, and restrained color for maximum clarity and focus. |
| `modern` | Contemporary editorial style with serif typography, minimal palettes, and clean layouts for polished digital products. |
| `mono` | Monospace-driven, matrix-inspired design with high-contrast elements, compact density, and a hacker-chic aesthetic. |
| `neobrutalism` | Modern take on brutalism with bold borders, vivid accent colors, and raw, high-contrast layouts on warm surfaces. |
| `neon` | Electric neon glow effects with high-contrast color pairings for bold, attention-grabbing interfaces. |
| `neumorphism` | Soft, extruded UI elements with inner and outer shadows on monochromatic surfaces for a tactile, embedded look. |
| `pacman` | Retro arcade-inspired design with pixel fonts, dotted borders, playful high-contrast colors, and 8-bit game aesthetics. |
| `paper` | Paper-textured, print-inspired design with minimal colors, clean serif/sans typography, and tactile surface qualities. |
| `perspective` | Spatial depth design with isometric views, vanishing points, and layered elements that guide attention through 3D-like realism. |
| `power` | High-end dark aesthetic with bold headings, monochromatic palette, and premium feel for premium brand experiences. |
| `premium` | Apple-inspired premium aesthetic with precise spacing, modern typography, and a refined, polished visual language. |
| `professional` | Polished, business-ready design with modern typography, structured layouts, and a trustworthy visual identity. |
| `pulse` | Dynamic, vibrant style with thick borders, geometric shapes, high-contrast colors, and expressive typography conveying motion and vitality. |
| `refined` | Carefully curated, modern minimal style with elegant serif typography and understated, sophisticated palettes. |
| `retro` | Throwback design with vintage-inspired typography, high-contrast retro palettes, and nostalgic visual elements. |
| `riso` | A playful, joyful, two-color risograph print aesthetic built on a single warm off-white paper surface running through every section |
| `roku` | App dashboard with purple-themed aesthetic, top-bar navigation, card-based layouts, and developer-first workflows. |
| `sega` | A playful, arcade-inspired interface for games — built on the VT323 pixel typeface, hard-edged 0px corners, chunky pill buttons that physically press into solid offset blocks |
| `shadcn` | Shadcn/ui-inspired design with minimal, clean components, monochrome palette, and utility-first patterns. |
| `sketch` | A friendly, hand-drawn sketch interface inspired by pencil illustrations on warm cream paper. Soft teal brand accents, hand-written display headings, rounded pill controls. |
| `skeumorphism` | Real-world mimicry with textured surfaces, 3D effects, and familiar physical metaphors for intuitive digital interfaces. |
| `sleek` | Modern minimalist aesthetic with clean lines, intentional color palette, subtle interactions, and consistent spacing. |
| `spacious` | Generous whitespace, consistent padding, and grid-based layouts for clean, readable, and breathing interfaces. |
| `square` | Graceful, refined aesthetic with delicate typography, minimal palettes, and polished layouts that exude sophistication. |
| `stitch` | Clean, high-contrast enterprise design for data-driven workflows with intuitive drag-and-drop patterns and structured layouts. |
| `storytelling` | Narrative-driven design using visuals, copy, and interaction to guide users through engaging, emotionally resonant journeys. |
| `terracotta` | A sun-baked, clay-toned editorial interface built on warm cream surfaces, ink-brown headlines set in a display serif, and a single terracotta accent. |
| `tetris` | Classic block-game inspired design with playful colors, bold display fonts, and compact, high-energy layouts. |
| `vibrant` | Lively, colorful design with bold playful typography, warm accents, and dynamic visual energy. |
| `vintage` | 1950s-1990s nostalgia with skeuomorphic touches, grainy textures, retro color palettes, and pixel-style typography. |
