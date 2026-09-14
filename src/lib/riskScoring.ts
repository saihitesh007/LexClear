import { scoreRisks } from "./document";
import type { RiskFlag } from "./types";
export function classifyClauseRisks(text: string): RiskFlag[] { return scoreRisks(text); }
