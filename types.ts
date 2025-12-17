export enum AppStep {
  ONBOARDING = 'ONBOARDING',
  SCENARIO_LOADING = 'SCENARIO_LOADING',
  SCENARIO_VIEW = 'SCENARIO_VIEW',
  SIMULATION = 'SIMULATION',
  ANALYSIS_LOADING = 'ANALYSIS_LOADING',
  ANALYSIS_VIEW = 'ANALYSIS_VIEW',
}

export interface UserProfile {
  name: string;
  major: string;
  targetSkill: string;
}

export interface Scenario {
  title: string;
  description: string;
  role: string;
  objective: string;
  counterpart: string;
  difficulty: string;
  keyPoints: string[];
}

export interface SkillScore {
  skill: string;
  score: number; // 0-100
  feedback: string;
}

export interface AnalysisResult {
  overallScore: number;
  summary: string;
  toneAnalysis: {
    label: string;
    description: string;
  };
  bodyLanguageAnalysis: {
    eyeContact: string;
    posture: string;
    gestures: string;
  };
  skillScores: SkillScore[];
  strengths: string[];
  weaknesses: string[];
  nextSteps: string[];
}
