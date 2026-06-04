# Graph Report - .  (2026-06-04)

## Corpus Check
- Corpus is ~18,898 words - fits in a single context window. You may not need a graph.

## Summary
- 76 nodes · 82 edges · 10 communities (6 shown, 4 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_CCR Session Lifecycle & Hooks|CCR Session Lifecycle & Hooks]]
- [[_COMMUNITY_Graphify Pipeline & Claude Config|Graphify Pipeline & Claude Config]]
- [[_COMMUNITY_Reply Gate Stop Hook Logic|Reply Gate Stop Hook Logic]]
- [[_COMMUNITY_Session 562 Metadata|Session 562 Metadata]]
- [[_COMMUNITY_Launcher Settings & Permissions|Launcher Settings & Permissions]]
- [[_COMMUNITY_Policy Limits & Restrictions|Policy Limits & Restrictions]]
- [[_COMMUNITY_Shell Snapshot State|Shell Snapshot State]]
- [[_COMMUNITY_Session Start Git Script|Session Start Git Script]]
- [[_COMMUNITY_Stop Hook Git Check|Stop Hook Git Check]]
- [[_COMMUNITY_Policy Limits Root|Policy Limits Root]]

## God Nodes (most connected - your core abstractions)
1. `run()` - 12 edges
2. `Graphify Skill - Full Pipeline Spec` - 11 edges
3. `Session Start Git Identity Script` - 8 edges
4. `Stop Hook Git Check Script` - 7 edges
5. `bump_counter()` - 4 edges
6. `Stop Hook Reply Gate (Slackbot v2)` - 4 edges
7. `hooks` - 3 edges
8. `Launcher Settings (Claude Code)` - 3 edges
9. `Graphify Extraction Subagent Prompt Spec` - 3 edges
10. `Session Start Hook Skill` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Session Start Git Identity Script` --semantically_similar_to--> `Session Start Hook Skill`  [INFERRED] [semantically similar]
  .claude/session-start-git-identity.sh → .claude/skills/session-start-hook/SKILL.md
- `Stop Hook Reply Gate (Slackbot v2)` --calls--> `run()`  [EXTRACTED]
  .claude/stop-hook-reply-gate.py → /root/.claude/stop-hook-reply-gate.py
- `Session Start Hook Skill` --conceptually_related_to--> `Launcher Settings (Claude Code)`  [INFERRED]
  .claude/skills/session-start-hook/SKILL.md → .claude/launcher-settings.json
- `Session 562 Metadata` --conceptually_related_to--> `Stop Hook Git Check Script`  [INFERRED]
  .claude/sessions/562.json → .claude/stop-hook-git-check.sh
- `Stop Hook Reply Gate (Slackbot v2)` --semantically_similar_to--> `Stop Hook Git Check Script`  [INFERRED] [semantically similar]
  .claude/stop-hook-reply-gate.py → .claude/stop-hook-git-check.sh

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **CCR Session Lifecycle Hooks (Start + Stop)** — claude_launcher_settings, claude_session_start_git_identity, claude_stop_hook_git_check, claude_stop_hook_reply_gate [EXTRACTED 1.00]
- **Graphify Pipeline Reference Documents** — graphify_skill_md, graphify_extraction_spec, graphify_query_md, graphify_update_md, graphify_hooks_md, graphify_exports_md, graphify_github_merge_md, graphify_transcribe_md, graphify_add_watch_md [EXTRACTED 1.00]
- **Git Commit Identity Enforcement System** — claude_session_start_git_identity, claude_stop_hook_git_check_unverifiable, ccr_commit_signing [INFERRED 0.95]

## Communities (10 total, 4 thin omitted)

### Community 0 - "CCR Session Lifecycle & Hooks"
Cohesion: 0.14
Nodes (17): CCR Commit Signing Identity, CCR Slackbot Reply Gate Mechanism, CCR Reply Stop Hook Env Vars, CCR_SESSION_ACCOUNT_EMAIL Env Var, Launcher Settings (Claude Code), Session Start Git Identity Script, Co-authored-by Trailer Git Hook, git config global user.email/name (+9 more)

### Community 1 - "Graphify Pipeline & Claude Config"
Cohesion: 0.14
Nodes (15): CLAUDE.md - Graphify Skill Registration, Graphify Add URL and Watch Reference, Graphify Extra Exports Reference, Graphify Extraction Subagent Prompt Spec, Confidence Score Rubric, Node ID Format Rules, Graphify GitHub Clone and Merge Reference, Graphify Hooks and CLAUDE.md Integration Reference (+7 more)

### Community 2 - "Reply Gate Stop Hook Logic"
Cohesion: 0.26
Nodes (13): allow(), block(), build_reason(), bump_counter(), counter_file(), is_opus(), local_cap(), main() (+5 more)

### Community 3 - "Session 562 Metadata"
Cohesion: 0.20
Nodes (9): cwd, entrypoint, kind, peerProtocol, pid, procStart, sessionId, startedAt (+1 more)

### Community 4 - "Launcher Settings & Permissions"
Cohesion: 0.29
Nodes (6): hooks, SessionStart, Stop, permissions, allow, $schema

### Community 5 - "Policy Limits & Restrictions"
Cohesion: 0.40
Nodes (4): compliance_taints, allowed, restrictions, enforce_web_search_mcp_isolation

## Knowledge Gaps
- **39 isolated node(s):** `$schema`, `SessionStart`, `Stop`, `allow`, `allowed` (+34 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Stop Hook Reply Gate (Slackbot v2)` connect `CCR Session Lifecycle & Hooks` to `Reply Gate Stop Hook Logic`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `run()` connect `Reply Gate Stop Hook Logic` to `CCR Session Lifecycle & Hooks`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Session Start Git Identity Script` (e.g. with `Session Start Hook Skill` and `Stop Hook Git Check Script`) actually correct?**
  _`Session Start Git Identity Script` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `Stop Hook Git Check Script` (e.g. with `Session 562 Metadata` and `Session Start Git Identity Script`) actually correct?**
  _`Stop Hook Git Check Script` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `SessionStart`, `Stop` to the rest of the system?**
  _41 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CCR Session Lifecycle & Hooks` be split into smaller, more focused modules?**
  _Cohesion score 0.13970588235294118 - nodes in this community are weakly interconnected._
- **Should `Graphify Pipeline & Claude Config` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._