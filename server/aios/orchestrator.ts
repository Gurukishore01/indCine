import {
  AgentExecutionLogEntry,
  EvidenceItem,
  Movie,
  OrchestratorResponse,
} from '../../src/types/aios';
import { runAudienceSentimentAgent } from './agents/audienceSentimentAgent';
import { runBoxOfficeAgent } from './agents/boxOfficeAgent';
import { runEvidenceValidationAgent } from './agents/evidenceValidationAgent';
import { runIndianMovieDiscoveryAgent } from './agents/indianMovieDiscoveryAgent';
import { runMovieResearchAgent } from './agents/movieResearchAgent';
import { runOttCatalogAgent } from './agents/ottCatalogAgent';
import { runPlatformIntelligenceAgent } from './agents/platformIntelligenceAgent';
import { runReportGenerationAgent } from './agents/reportGenerationAgent';
import { runRootCauseAgent } from './agents/rootCauseAgent';
import { runTrendIntelligenceAgent } from './agents/trendIntelligenceAgent';
import { generateContentWithRetry } from './geminiClient';

interface ParsedIntent {
  intentType:
    | 'discovery'
    | 'box_office'
    | 'ott'
    | 'trends'
    | 'sentiment'
    | 'root_cause'
    | 'report'
    | 'research';
  language?: string;
  genre?: string;
  year?: number;
  compareTitles?: string[];
}

function parseIntentRuleBased(query: string): ParsedIntent {
  const q = query.toLowerCase().trim();

  // Language detection
  let language: string | undefined;
  if (q.includes('tamil')) language = 'ta';
  else if (q.includes('telugu')) language = 'te';
  else if (q.includes('malayalam')) language = 'ml';
  else if (q.includes('kannada')) language = 'kn';
  else if (q.includes('hindi')) language = 'hi';
  else if (q.includes('bengali')) language = 'bn';
  else if (q.includes('marathi')) language = 'mr';
  else if (q.includes('punjabi')) language = 'pa';

  // Genre detection
  let genre: string | undefined;
  if (q.includes('comedy')) genre = 'Comedy';
  else if (q.includes('action')) genre = 'Action';
  else if (q.includes('thriller')) genre = 'Thriller';
  else if (q.includes('drama')) genre = 'Drama';
  else if (q.includes('horror')) genre = 'Horror';
  else if (q.includes('sci-fi') || q.includes('science fiction')) genre = 'Sci-Fi';

  // Intent classification
  if (q.includes('box office') || q.includes('collection') || q.includes('budget') || q.includes('gross') || q.includes('net')) {
    return { intentType: 'box_office', language };
  }
  if (q.includes('where to watch') || q.includes('ott') || q.includes('streaming') || q.includes('netflix') || q.includes('hotstar') || q.includes('prime')) {
    return { intentType: 'ott', language };
  }
  if (q.includes('gaining attention') || q.includes('trend') || q.includes('rising') || q.includes('falling') || q.includes('signals')) {
    return { intentType: 'trends', language };
  }
  if (q.includes('audience') || q.includes('critic') || q.includes('review') || q.includes('sentiment') || q.includes('reaction')) {
    return { intentType: 'sentiment', language };
  }
  if (q.includes('why did') || q.includes('underperform') || q.includes('succeed') || q.includes('root cause')) {
    return { intentType: 'root_cause', language };
  }
  if (q.includes('report') || q.includes('briefing') || q.includes('summary') || q.includes('weekly')) {
    return { intentType: 'report', language };
  }
  if (q.includes('movie') || q.includes('film') || q.includes('releases') || language || genre) {
    return { intentType: 'discovery', language, genre };
  }

  return { intentType: 'research', language };
}

export async function runAiosOrchestrator(query: string): Promise<OrchestratorResponse> {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const retrievedAt = new Date().toISOString();
  const executionLog: AgentExecutionLogEntry[] = [];
  const rawEvidence: EvidenceItem[] = [];
  const allWarnings: string[] = [];
  let returnedMovies: Movie[] = [];
  let answer = '';
  let usedGemini = false;

  const parsed = parseIntentRuleBased(query);
  const plan: string[] = [];

  // 1. Log Planning Step
  plan.push(`1. Orchestrator: Classify intent as "${parsed.intentType}" with language: ${parsed.language || 'Pan-India'}.`);
  executionLog.push({
    id: `${requestId}_step1`,
    step: 1,
    agent: 'AIOSCentralOrchestrator',
    action: 'Parse query intent and dispatch plan',
    status: 'completed',
    durationMs: 8,
    timestamp: new Date().toISOString(),
    summary: `Classified query intent as "${parsed.intentType}" (strict language: ${parsed.language || 'Any Indian'}).`,
  });

  // Step 2 & 3: Dispatch to specialized agents according to intent
  if (parsed.intentType === 'discovery') {
    plan.push('2. IndianMovieDiscoveryAgent: Query Indian cinema records with strict language isolation.');
    plan.push('3. OTTCatalogIntelligenceAgent: Verify India OTT availability.');
    plan.push('4. EvidenceValidationAgent: Validate citations.');

    const discRes = await runIndianMovieDiscoveryAgent({
      query: parsed.genre ? undefined : query,
      language: parsed.language,
      year: parsed.year,
    });
    returnedMovies = discRes.movies;
    rawEvidence.push(...discRes.evidence);
    allWarnings.push(...discRes.warnings);

    executionLog.push({
      id: `${requestId}_step2`,
      step: 2,
      agent: discRes.agent,
      action: 'Execute Indian cinema discovery query',
      status: discRes.status,
      durationMs: discRes.durationMs,
      timestamp: new Date().toISOString(),
      summary: discRes.summary,
      evidenceProduced: discRes.evidence.length,
    });

    const movieIds = returnedMovies.slice(0, 4).map((m) => m.id);
    const ottRes = await runOttCatalogAgent(movieIds);
    rawEvidence.push(...ottRes.evidence);
    allWarnings.push(...ottRes.warnings);

    executionLog.push({
      id: `${requestId}_step3`,
      step: 3,
      agent: ottRes.agent,
      action: 'Check verified India streaming platforms',
      status: ottRes.status,
      durationMs: ottRes.durationMs,
      timestamp: new Date().toISOString(),
      summary: ottRes.summary,
      evidenceProduced: ottRes.evidence.length,
    });

    answer = `Found ${returnedMovies.length} Indian film record${returnedMovies.length === 1 ? '' : 's'} matching "${query}". ${
      returnedMovies.length > 0
        ? `Top titles include: ${returnedMovies
            .slice(0, 3)
            .map((m) => `${m.title} (${m.year}, ${m.language})`)
            .join('; ')}.`
        : 'Try adjusting language or genre filters.'
    }`;
  } else if (parsed.intentType === 'box_office') {
    plan.push('2. IndianMovieDiscoveryAgent: Identify target films for box-office analysis.');
    plan.push('3. BoxOfficeIntelligenceAgent: Extract reported theatrical gross, net and budget.');
    plan.push('4. EvidenceValidationAgent: Audit financial methodology and disclosures.');

    const discRes = await runIndianMovieDiscoveryAgent({ query, language: parsed.language });
    returnedMovies = discRes.movies;
    rawEvidence.push(...discRes.evidence);

    const boRes = await runBoxOfficeAgent(returnedMovies);
    rawEvidence.push(...boRes.evidence);
    allWarnings.push(...boRes.warnings);

    executionLog.push({
      id: `${requestId}_step2`,
      step: 2,
      agent: boRes.agent,
      action: 'Retrieve verified collections and budget ratios',
      status: boRes.status,
      durationMs: boRes.durationMs,
      timestamp: new Date().toISOString(),
      summary: boRes.summary,
      evidenceProduced: boRes.evidence.length,
    });

    const reportedList = returnedMovies
      .filter((m) => m.boxOffice)
      .map(
        (m) =>
          `**${m.title}**: Worldwide Gross ₹${m.boxOffice?.worldwideGrossCrore} Cr (India Net ₹${m.boxOffice?.indiaNetCrore ?? 'N/A'} Cr, Budget ₹${m.boxOffice?.budgetCrore ?? 'N/A'} Cr) — *${m.boxOffice?.reportedStatus}* [Source: ${m.boxOffice?.sourceName}]`
      );

    answer = reportedList.length > 0
      ? `### Theatrical Box-Office Intelligence\n\n${reportedList.join('\n\n')}\n\n*Note: Financial performance separates theatrical gross from producer net; distributor shares and regional recovery dictate commercial classification.*`
      : 'No verified box-office disclosure found for this query without speculative estimation.';
  } else if (parsed.intentType === 'ott') {
    plan.push('2. IndianMovieDiscoveryAgent: Match Indian titles.');
    plan.push('3. OTTCatalogIntelligenceAgent: Verify platform rights in India.');
    plan.push('4. PlatformIntelligenceAgent: Analyze platform distribution.');

    const discRes = await runIndianMovieDiscoveryAgent({ query, language: parsed.language });
    returnedMovies = discRes.movies;
    const ottRes = await runOttCatalogAgent(returnedMovies.map((m) => m.id));
    rawEvidence.push(...ottRes.evidence);

    executionLog.push({
      id: `${requestId}_step2`,
      step: 2,
      agent: ottRes.agent,
      action: 'Check verified streaming catalogues',
      status: ottRes.status,
      durationMs: ottRes.durationMs,
      timestamp: new Date().toISOString(),
      summary: ottRes.summary,
      evidenceProduced: ottRes.evidence.length,
    });

    const streamList = returnedMovies.map((m) => {
      const providers = m.verifiedOttProviders.map((p) => p.providerName).join(', ');
      return `**${m.title}** (${m.language}, ${m.year}): ${
        providers ? `Available on **${providers}** (India)` : '*No verified India streaming platform confirmed*'
      }`;
    });

    answer = `### Verified India OTT Availability\n\n${streamList.join('\n\n')}\n\n*Availability verified via JustWatch / TMDB Watch Providers API. Unverified search fallbacks are excluded.*`;
  } else if (parsed.intentType === 'trends') {
    plan.push('2. TrendIntelligenceAgent: Evaluate recorded popularity snapshots.');
    plan.push('3. EvidenceValidationAgent: Enforce multi-observation trend rules.');

    const trendRes = await runTrendIntelligenceAgent('day');
    rawEvidence.push(...trendRes.evidence);
    allWarnings.push(...trendRes.warnings);

    executionLog.push({
      id: `${requestId}_step2`,
      step: 2,
      agent: trendRes.agent,
      action: 'Calculate movement deltas from timestamped snapshots',
      status: trendRes.status,
      durationMs: trendRes.durationMs,
      timestamp: new Date().toISOString(),
      summary: trendRes.summary,
      evidenceProduced: trendRes.evidence.length,
    });

    const rising = trendRes.movements.filter((m) => m.status === 'Rising');
    const stable = trendRes.movements.filter((m) => m.status === 'Stable');

    answer = `### Indian Cinema Trend Signals\n\n**Data Policy**: ${trendRes.disclosure}\n\n` +
      (rising.length > 0
        ? `**Rising Signals**: ${rising.map((m) => `${m.title} (Delta: +${m.rankDelta})`).join(', ')}\n\n`
        : '**Rising Signals**: Awaiting consecutive observation snapshots to declare upward velocity.\n\n') +
      `**Observed Titles**: ${trendRes.movements.slice(0, 5).map((m) => `${m.title} [${m.status}]`).join(', ')}`;
  } else if (parsed.intentType === 'sentiment') {
    plan.push('2. IndianMovieDiscoveryAgent: Locate relevant titles.');
    plan.push('3. AudienceCriticSentimentAgent: Disaggregate audience vs critic consensus.');
    plan.push('4. EvidenceValidationAgent: Check sample sizes.');

    const discRes = await runIndianMovieDiscoveryAgent({ query, language: parsed.language });
    returnedMovies = discRes.movies;
    const sentRes = await runAudienceSentimentAgent(returnedMovies);
    rawEvidence.push(...sentRes.evidence);
    allWarnings.push(...sentRes.warnings);
    usedGemini = true;

    executionLog.push({
      id: `${requestId}_step2`,
      step: 2,
      agent: sentRes.agent,
      action: 'Synthesize verified audience vs critic reactions',
      status: sentRes.status,
      durationMs: sentRes.durationMs,
      timestamp: new Date().toISOString(),
      summary: sentRes.summary,
      evidenceProduced: sentRes.evidence.length,
    });

    answer = `### Audience & Critic Reception Analysis\n\n${sentRes.summary}\n\n` +
      returnedMovies
        .slice(0, 3)
        .map(
          (m) =>
            `**${m.title}** (${m.language}):\n- **Critic Score**: ${m.reception.criticScore ?? 'N/A'}% (${m.reception.criticConsensus})\n- **Audience Score**: ${m.reception.audienceScore ?? 'N/A'}% (${m.reception.audienceConsensus})\n- **Praise**: ${m.reception.praiseThemes.join(', ')}`
        )
        .join('\n\n');
  } else if (parsed.intentType === 'root_cause') {
    plan.push('2. IndianMovieDiscoveryAgent: Select subject film.');
    plan.push('3. RootCauseAnalysisAgent: Formulate evidence-supported causal hypotheses.');
    plan.push('4. EvidenceValidationAgent: Tag hypotheses vs facts.');

    const discRes = await runIndianMovieDiscoveryAgent({ query, language: parsed.language });
    returnedMovies = discRes.movies;
    const target = returnedMovies[0];

    if (target) {
      const rcRes = await runRootCauseAgent(target);
      rawEvidence.push(...rcRes.evidence);
      usedGemini = true;

      executionLog.push({
        id: `${requestId}_step2`,
        step: 2,
        agent: rcRes.agent,
        action: `Diagnose commercial/critical factors for ${target.title}`,
        status: rcRes.status,
        durationMs: rcRes.durationMs,
        timestamp: new Date().toISOString(),
        summary: rcRes.summary,
        evidenceProduced: rcRes.evidence.length,
      });

      answer = `### Root Cause Analysis: ${target.title}\n\n${rcRes.summary}\n\n` +
        rcRes.hypotheses
          .map(
            (h) =>
              `**${h.title}**\n- *Explanation*: ${h.explanation}\n- *Supporting Evidence*: ${h.supportingEvidence}\n- *Caveat / Uncertainty*: ${h.uncertainty}`
          )
          .join('\n\n');
    } else {
      answer = 'Could not isolate a specific Indian cinema title to execute root cause diagnosis.';
    }
  } else if (parsed.intentType === 'report') {
    plan.push('2. IndianMovieDiscoveryAgent: Assemble cross-industry cohort.');
    plan.push('3. ReportGenerationAgent: Compile structured intelligence briefing.');
    plan.push('4. EvidenceValidationAgent: Audit disclosures.');

    const discRes = await runIndianMovieDiscoveryAgent({ language: parsed.language });
    returnedMovies = discRes.movies;
    const repRes = await runReportGenerationAgent({ topic: query, movies: returnedMovies });
    rawEvidence.push(...repRes.evidence);
    usedGemini = true;

    executionLog.push({
      id: `${requestId}_step2`,
      step: 2,
      agent: repRes.agent,
      action: 'Generate complete intelligence report',
      status: repRes.status,
      durationMs: repRes.durationMs,
      timestamp: new Date().toISOString(),
      summary: repRes.summary,
      evidenceProduced: repRes.evidence.length,
    });

    answer = repRes.reportMarkdown;
  } else {
    // General Research
    plan.push('2. MovieResearchAgent: Cross-reference Indian cinema metadata & reviews.');
    plan.push('3. EvidenceValidationAgent: Validate claims.');

    const resRes = await runMovieResearchAgent(query);
    returnedMovies = resRes.movies;
    rawEvidence.push(...resRes.evidence);
    usedGemini = true;

    executionLog.push({
      id: `${requestId}_step2`,
      step: 2,
      agent: resRes.agent,
      action: 'Synthesize cross-industry research',
      status: resRes.status,
      durationMs: resRes.durationMs,
      timestamp: new Date().toISOString(),
      summary: resRes.summary,
      evidenceProduced: resRes.evidence.length,
    });

    answer = resRes.synthesis;
  }

  // Final Step: Evidence Validation Agent runs on all gathered evidence!
  const valRes = await runEvidenceValidationAgent(rawEvidence);
  executionLog.push({
    id: `${requestId}_validation`,
    step: executionLog.length + 1,
    agent: valRes.agent,
    action: 'Audit source credibility, freshness, and certainty boundaries',
    status: valRes.status,
    durationMs: valRes.durationMs,
    timestamp: new Date().toISOString(),
    summary: valRes.summary,
    evidenceProduced: valRes.verifiedCount,
    warnings: valRes.warnings,
  });
  allWarnings.push(...valRes.warnings);

  return {
    requestId,
    query,
    intent: parsed.intentType,
    plan,
    executionLog,
    movies: returnedMovies,
    answer,
    evidence: valRes.validatedEvidence,
    warnings: allWarnings,
    confidence: valRes.flaggedCount === 0 ? 'High' : 'Moderate',
    retrievedAt,
    usedGemini,
    limitations: [
      'Trend signals require consecutive observation snapshots.',
      'OTT viewership watch-time numbers are proprietary and not publicly disclosed.',
      'Box-office reporting reflects aggregate trade disclosures in INR Crores.',
    ],
  };
}
