# Images this site expects

Referenced by path, not statically imported, so the build succeeds without
them — each one just falls back to a solid neutral colour until you add the
real file at the exact path below.

| Path                     | Used on                                                              | What it should be                                                                                                                                                                                                                      |
| ------------------------ | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hero-tradesman.jpg`     | `/` (hero) and `/about`                                              | A tradesman on site, hi-vis visible — the photo referenced in the design brief. Landscape, at least 1600×900.                                                                                                                          |
| `about-team.jpg`         | `/about` (mission block)                                             | A photo representing the team/product — office, a call being answered, whatever's true.                                                                                                                                                |
| `about-office.jpg`       | `/about` (second story block)                                        | Same idea, a second image so the page doesn't repeat one photo twice.                                                                                                                                                                  |
| `audience-homeowner.jpg` | `/` (homeowner panel, right under the hero)                          | A homeowner looking at their phone, or a completed job — whatever reads as "the customer side". Roughly square, at least 800×800.                                                                                                      |
| `audience-business.jpg`  | `/` (business panel, right under the hero)                           | A tradesman with a calendar, phone or tools — "the business side". Roughly square, at least 800×800.                                                                                                                                   |
| `ai-agent-avatar.jpg`    | `/find/[category]/[location]` (the "find a tradesman" chat's avatar) | A face/headshot for the AI agent — a real photo or a generated headshot, not an illustration. Square, at least 200×200. Until this exists the chat shows its "TD" mark instead — see `components/marketplace/find-tradesman-chat.tsx`. |

Drop a file at one of these paths (`public/images/<name>.jpg`) and it appears
immediately — the CSS treatment (cover, dark scrim on the hero) is already
wired up, nothing else needs to change.
