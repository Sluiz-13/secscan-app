export type Severity = "high" | "medium" | "low" | "info";

export type Grade = "A" | "B" | "C" | "D" | "F";

const SEVERITY_PENALTY: Record<Severity, number> = {
  high: 20,
  medium: 10,
  low: 4,
  info: 0,
};

const GRADE_THRESHOLDS: { min: number; grade: Grade }[] = [
  { min: 90, grade: "A" },
  { min: 75, grade: "B" },
  { min: 60, grade: "C" },
  { min: 40, grade: "D" },
  { min: 0, grade: "F" },
];

export type ScoreInput = {
  severity: Severity;
};

export type ScoreResult = {
  score: number; 
  grade: Grade;
  breakdown: Record<Severity, number>; // quantidade de findings por severidade
};

export function calculateScore(findings: ScoreInput[]): ScoreResult {
  const breakdown: Record<Severity, number> = {
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  let totalPenalty = 0;

  for (const finding of findings) {
    breakdown[finding.severity]++;
    totalPenalty += SEVERITY_PENALTY[finding.severity];
  }

  const score = Math.max(0, 100 - totalPenalty);
  const grade = scoreToGrade(score);

  return { score, grade, breakdown };
}

function scoreToGrade(score: number): Grade {
  for (const { min, grade } of GRADE_THRESHOLDS) {
    if (score >= min) return grade;
  }
  return "F"; // fallback teórico, nunca deve ser alcançado (0 já cai no F)
}