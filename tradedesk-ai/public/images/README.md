# Images this site expects

Referenced by path, not statically imported, so the build succeeds without
them — each one just falls back to a solid neutral colour until you add the
real file at the exact path below.

| Path | Used on | What it should be |
|---|---|---|
| `hero-tradesman.jpg` | `/` (hero) and `/about` | A tradesman on site, hi-vis visible — the photo referenced in the design brief. Landscape, at least 1600×900. |
| `about-team.jpg` | `/about` (mission block) | A photo representing the team/product — office, a call being answered, whatever's true. |
| `about-office.jpg` | `/about` (second story block) | Same idea, a second image so the page doesn't repeat one photo twice. |

Drop a file at one of these paths (`public/images/<name>.jpg`) and it appears
immediately — the CSS treatment (cover, dark scrim on the hero) is already
wired up, nothing else needs to change.
