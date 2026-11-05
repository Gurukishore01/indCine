# INDCINE — FULL AUDIT, VISUAL REDESIGN & AIOS CORRECTION MASTER PROMPT

You are a principal product designer, senior full-stack engineer, data architect, AI orchestration engineer and Indian cinema research analyst. Upgrade the attached IndCine project into a trustworthy, premium, current-situation intelligence system for Indian cinema.

The uploaded `indcine.zip` is the actual current project. It contains an IndCine implementation and a nested original `cinemind-aios__4__...zip` archive. Inspect BOTH. The root archive is the latest working project; the nested archive contains the earlier CINEMIND code/design baseline. Do not assume the two are identical.

Also inspect the attached `IndCine_Visual_Redesign.html`. It is the new visual direction. The user dislikes the current simple look and current font choices. The redesigned UI must be more cinematic, distinctive, bold, polished and information-rich without becoming cluttered.

## A. First: audit before modifying

Inspect all files and produce a concise but specific audit. At minimum inspect:
- package.json and lockfile
- src/App.tsx, src/index.css, Shell.tsx
- every page in src/pages
- movie cards and all shared components
- server.ts
- server/aios/orchestrator.ts
- server/aios/agentRegistry.ts and every agent file
- server/services/tmdbService.ts
- server/services/indianCinemaData.ts
- server/services/observationStore.ts
- src/types/aios.ts
- server/data/observations.json
- .env.example
- nested original ZIP and its six Stitch references / previous working code.

Report each finding as:
1. Confirmed defect (with file and relevant code behaviour).
2. Risk / why it matters.
3. Required correction.
4. Test that proves the correction.

Do not silently accept claims made by existing code or UI. Verify whether the implementation actually does what the labels promise. Do not report a feature as live/active/verified unless code, data source and test support it.

## B. Confirmed issues already visible in the current source — investigate and correct

These are concrete issues found during an initial source review. Re-check them against the complete project and fix them where confirmed.

### 1. Hard-coded SVG chart contradicts historical-data claim
`src/pages/PulseScreen.tsx` draws fixed SVG paths and labels them as a dynamic trend chart. The path does not derive from actual observation data. Replace with a real chart generated from validated API/database observations. If there is no valid history, show a premium empty state explaining that history is still being collected. Never draw synthetic curves.

### 2. Fake or misleading source-status claims
`src/App.tsx`, `Shell.tsx`, `PulseScreen.tsx` and `server.ts` need a full audit of status labels such as “Live active catalogue”, “verified registry”, “TMDB live”, “services ready” and “real-time observer”. Derive status from actual successful requests, source timestamps and tested agent health. A configured API key alone does not mean the service is healthy. A fallback registry is not a live catalogue.

### 3. Seed registry mixed with live data
`server/services/tmdbService.ts` currently falls back to `VERIFIED_INDIAN_MOVIES` after TMDB errors and merges the seeded registry into live trending results. This contaminates live results and can create false rankings and trend snapshots. Separate seed/demo/curated reference records from live API results. Tag every record with provenance and mode. Never merge static seeded films into a live trending ranking or record them as fresh TMDB observations.

### 4. Trend observations contain invalid assumptions
`server/services/observationStore.ts` currently:
- substitutes missing TMDB popularity with numeric zero;
- assigns rank from the order of any incoming movie array;
- labels region `India / Global`;
- stores a global TMDB trending endpoint as if it were a region-specific Indian ranking;
- throttles based on 30 seconds, which is not a meaningful scheduled snapshot cadence;
- increments total snapshot count before duplicate throttling;
- declares rising/falling when either rank movement OR popularity percentage change crosses a threshold, which can give contradictory signals;
- can compare observations that may not be from the same source, region, collection method or time interval.

Correct this rigorously:
- Preserve missing values as null, never zero.
- Never invent ranks from arbitrary list position. Only record a rank if the source explicitly provides a ranking context and the request/response order is the official ranking.
- Store actual source, endpoint, region/territory, query parameters, metric, unit, collection timestamp and method.
- Global TMDB trending filtered by Indian language is not an India-region ranking. Label it as global trending filtered by Indian original-language codes, or use a genuine supported India region filter if the endpoint permits it.
- Compare only the same metric, source, region, time window, and collection method.
- Treat rank movement and popularity-index change as separate signals. Do not combine contradictory metrics with a simple OR.
- Make collection cadence explicit (e.g. scheduled daily snapshots), avoid duplicate writes, and count only successfully persisted snapshots.
- Require a sensible number of observations and time separation before classifying a trend.
- Distinguish “newly observed”, “not present in this source's current chart”, “falling rank”, and “declining popularity index”. Absence from a chart does not prove that the film's total popularity or viewership fell.
- Add tests for missing values, changed ordering, source mismatch, region mismatch, duplicate snapshots and contradictory rank/popularity signals.

### 5. Agent registry overstates readiness
`server/aios/agentRegistry.ts` currently labels all listed agents `active`. Verify every agent has a real implementation, actual invocation path, valid output schema, error handling and tests. Use statuses such as `implemented`, `testing`, `planned`, `degraded` or `unavailable` according to actual evidence. UI must not show all agents as active simply because they appear in the registry. Record executions only when an agent actually runs.

### 6. Seed movie data may contain unsupported or stale facts
`server/services/indianCinemaData.ts` contains hand-authored records with ratings, sample sizes, box-office totals, budgets, OTT provider flags, review consensus, sources and “verified” labels. Audit every seeded field. Treat unsupported values as unverified legacy seed data, not truth. Do not present them as current or verified. Keep a seed dataset only for clearly marked demo mode, or remove unsupported fields. A poster URL working does not verify movie performance. An OTT link is not proof of current rights. A claimed audience sample is invalid unless its underlying source and sample methodology are traceable.

### 7. Search and discover API correctness
Review all TMDB endpoints and parameters. Confirm the actual TMDB API semantics for:
- `/discover/movie`
- `/search/movie`
- `/trending/movie/{time_window}`
- `/movie/{id}`
- `/movie/{id}/watch/providers`

Do not assume `/trending/movie` is India-specific. Do not use a region parameter unless the endpoint supports it. Ensure original-language filters do not silently broaden. Search by title must use the title search endpoint. Language/genre/year discovery must use discover. Validate query parameters, pagination, errors, rate limits and API response shapes.

### 8. Rating and review semantics
TMDB vote average is a TMDB community rating, not IMDb, not a critic score, and not a verified theatre exit poll. Keep rating provider, score, scale, vote count and retrieval timestamp. Never map synopsis to critic consensus. Do not claim critic/audience consensus unless sourced review evidence exists. A generated Gemini summary is an interpretation of the collected sample, not an independent review source.

### 9. API/server robustness
Inspect server startup, route error handling, timeouts, API key handling, health checks, rate limits and logging. Check if `start: node server.ts` is valid for the current TS/ESM runtime; make the production start command use a real build output. Confirm `npm run build` and `npm run lint` work. The initial TypeScript check could not run in the audit environment because dependencies were not installed (`vite/client` type definition unavailable); install dependencies in the intended environment and report actual results, do not claim build success prematurely.

### 10. Persistence and scheduling
The current observation store writes JSON to the project filesystem. Verify whether the target Google AI Studio deployment filesystem is durable across restarts/redeploys. Do not promise permanent history if it is ephemeral. Use a supported persistent database only if it fits the zero-cost constraint and the runtime. If no durable free storage is available, clearly label history as local/session or exportable, and do not claim background monitoring. A scheduled scan cannot run when the process/computer is stopped unless a real scheduler/host is configured.

## C. Product definition

Product name: **IndCine**.

Positioning: **Indian Cinema Intelligence Operating System**.

Purpose: help the user understand the current situation of Indian movies across theatrical business, OTT availability, public popularity signals, audience and critic reception, industry developments and historical movement.

Cover Indian film industries and languages including Tamil, Telugu, Malayalam, Kannada, Hindi, Bengali, Marathi, Punjabi, Gujarati and other supported Indian languages. Provide language/industry filters, but never infer language from a title alone.

The system must answer current questions with a timestamp and evidence, for example:
- What is happening in Indian cinema today / this week?
- Which Tamil films are currently gaining public attention?
- What are the latest reported box-office results for Indian releases?
- Which films are appearing in official OTT charts?
- Which Indian films are available on Netflix / Prime / JioHotstar / ZEE5 / SonyLIV / Aha / Sun NXT in India?
- Which titles have strong audience reception but weak reported theatrical performance?
- Compare two films across reception, popularity and reported box office.
- Why might a film have underperformed? Separate evidence from hypotheses.
- What changed compared with last week?
- Give me a weekly Indian cinema intelligence briefing.

“Current situation” requires source freshness, collection timestamps, region and explicit coverage. Do not call old cached records current without showing their age.

## D. Stronger visual direction — mandatory redesign

The user explicitly dislikes the current simple UI and current font choices. Do not merely tweak the existing page by a few pixels.

Use the attached `IndCine_Visual_Redesign.html` as the visual direction and implement it in the actual React app.

### New typography
- Display/headlines: **Barlow Condensed** (bold, editorial, cinematic, uppercase for key dashboard headings).
- Body/UI: **DM Sans**.
- Metrics, timestamps and technical labels: **IBM Plex Mono**.

Do not use the previous Plus Jakarta Sans / Manrope combination as the primary typography. Keep readable body sizes; don't make all text tiny. Strong hierarchy: large cinematic headlines, readable section titles, legible card labels, carefully restrained mono metadata.

### Visual palette
- Midnight background `#090b10`.
- Deep surface `#11151d`.
- Elevated surface `#171c26`.
- Borders `#29313e`.
- Main text `#f2f3f5`.
- Muted text `#a1aab8`.
- Signal red `#ff365d`.
- Warm gold `#f4bd62`.
- Teal `#51d6c2`.
- Blue `#7ca9ff`.

### Design personality
Create a premium Indian cinema intelligence room: cinematic, bold, editorial, atmospheric and visually memorable. Use layered dark surfaces, cinematic gradients, restrained film-grain/diagonal texture, dramatic typography, strong poster art, tasteful glow, refined motion and carefully composed charts. Do not use generic admin dashboard visuals, flat monochrome cards, or the earlier plain minimal look.

Do not make the design childish, neon overload, excessively glassmorphic, or cluttered. Use colour to distinguish evidence types:
- Red: attention / alert / high movement.
- Gold: box-office / commercial reporting.
- Teal: verified / positive evidence state.
- Blue: source / data / informational.

Preserve excellent responsive behaviour and accessibility.

### Dashboard should feel like a live cinema intelligence briefing
Include:
- Large editorial hero: “Beyond the box office. Inside the story.”
- India Cinema Pulse.
- Current source scan status.
- Freshness and last-updated timestamps.
- Current public trend signals with source/method labels.
- Theatrical business briefing.
- OTT catalogue radar.
- Audience reception signals.
- Films under investigation.
- Industry/language pulse.
- Evidence alerts.
- AIOS command desk.
- Recent research activity.

Do not render invented charts, values or rankings. Empty states must look designed and informative.

## E. Proper AIOS architecture

Use a central server-side orchestrator:
1. Understand user intent.
2. Extract territory, language, title, metric and time period.
3. Create a typed execution plan.
4. Choose the minimum necessary agents.
5. Call tools/connectors.
6. Normalise data.
7. Validate source and freshness.
8. Compare historical observations only when compatible.
9. Calculate metrics deterministically.
10. Use Gemini for evidence-grounded synthesis.
11. Run evidence validation.
12. Return findings, sources, confidence, missing information and checked time.
13. Persist eligible observations and execution logs.

Implement agents as real modules with typed input/output contracts:
- Indian Film Discovery & Metadata
- Current Industry News/Research (only if a permitted source/search connector is implemented)
- OTT Catalogue & Availability
- Theatrical Box Office
- Audience & Critic Reception
- Popularity/Trend Analysis
- Cross-film / Industry Comparison
- Root Cause Analysis
- Evidence Validation
- Briefing / Report Generation

The orchestrator must not invoke every agent for every question. It must route according to intent. No fake logs, fake “active” status or fabricated output.

Gemini is the reasoning layer, not the data source of truth. Use deterministic code for retrieval, calculation, validation and persistence. Handle Gemini quota exhaustion gracefully.

## F. Data source and truth policy

Use TMDB for movie metadata, posters, search/discovery, TMDB community ratings/vote counts, supported trending data and watch-provider availability where available. Preserve TMDB/JustWatch attribution and comply with terms.

Do not treat TMDB as a complete source for:
- OTT viewing hours or views;
- all reviews;
- critic consensus;
- definitive box-office collections;
- production budgets;
- profit.

For current news, box-office and industry developments, use a permitted search/API/RSS integration only if available and within ₹0. If no source is connected, provide a manual research workflow or say current research is unavailable. Never invent live news.

Use official platform charts and public reports where accessible. Clearly label public rankings as chart positions/proxies, not total viewership.

For box office, preserve the exact metric and source: India net, India gross, overseas gross, worldwide gross, opening day/weekend, budget and distributor share. Do not combine conflicting trade estimates into one false exact number. Show range/source disagreement when necessary. Gross is not profit.

For OTT, distinguish confirmed provider availability from generic search links. If TMDB returns providers, show the country, provider, category (subscription/rent/buy/free), source and retrieval time. If no authorised source exists for a platform, mark unavailable/unchecked—not available.

For reviews, distinguish user ratings, audience reviews, critic reviews and AI summaries. Show sample count and sources. Do not imply complete internet coverage.

## G. Core metrics and labels

Never create unexplained composite scores.

Show independent dimensions:
- Public Popularity Signal (identify source and metric).
- Trend Direction (requires comparable snapshots).
- Audience Reception (source-specific).
- Critic Reception (source-specific).
- Reported Box Office (metric-specific).
- OTT Availability (provider-specific).
- Evidence Coverage / Confidence (based on provenance and completeness).

If a composite score is proposed, disclose formula, weights, data coverage and limitations. Missing values remain null/unknown, never zero.

Allowed classifications:
- Positive public signals
- Mixed signals
- Declining source-specific signal
- Strong audience reception
- Weak audience reception
- Reported commercial underperformance (only with sufficient evidence)
- Insufficient reliable data

Do not label a film “hit”, “flop”, “blockbuster” or “commercial failure” unless a reliable source and methodology support the classification. If trade labels differ, show the disagreement.

## H. UI and interactions

Implement these real pages:
1. India Pulse Dashboard.
2. Film Explorer with Indian language/industry filters.
3. Film Dossier / intelligence profile.
4. OTT Radar.
5. Audience Lens.
6. Trend Observatory.
7. Box Office Tracker.
8. AIOS Command Desk.
9. Reports & History.

All controls must work. Search must search real results when TMDB is configured. Filters must affect data. Cards must open the correct movie. Refresh must call the relevant source and update freshness. The analyst input must call the real server endpoint. Do not leave decorative buttons that imply functionality.

## I. Security and zero-cost constraints

- Strict ₹0 additional budget.
- No paid API, paid database, paid hosting, credit card, or billing activation.
- No secret in frontend, localStorage, logs, source control or prompts.
- Keep `TMDB_API_KEY` and `GEMINI_API_KEY` server-side.
- Validate external input, restrict outbound URLs, add request timeouts and bounded retries.
- Respect rate limits and provider terms.
- Do not scrape or bypass access restrictions.
- Gracefully handle missing keys and exhausted free quotas.

## J. Testing and delivery

Before saying complete:
- Run TypeScript/lint.
- Run production build.
- Test all API routes.
- Test missing/invalid API keys.
- Test TMDB timeout and error behaviour.
- Test seeded vs live separation.
- Test all language filters.
- Test no-results handling.
- Test OTT provider region and category.
- Test observation deduplication.
- Test trend comparison compatibility.
- Test chart empty states and real data rendering.
- Test agent execution records and registry status.
- Test Gemini quota exhaustion.
- Test mobile responsiveness and keyboard accessibility.

Deliver:
1. Audit findings with file references.
2. Defects corrected.
3. New design system.
4. Files changed.
5. Implemented features.
6. Features still unavailable due to data-source limitations.
7. Build/lint/test outputs (actual results only).
8. Setup and run commands.
9. API secrets required and where to configure them.
10. Remaining risks and next steps.

## STARTING INSTRUCTION

Inspect the entire uploaded `indcine.zip` and nested original archive first. Then inspect the attached `IndCine_Visual_Redesign.html`. Show me the audit and correction plan before major destructive edits. After the audit, implement the redesigned actual React application—not just a standalone HTML mockup. Preserve existing useful working code, fix the verified defects, and make IndCine a reliable current-situation intelligence system for Indian cinema.
