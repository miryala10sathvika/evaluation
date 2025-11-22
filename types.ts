
export enum RatingEnum {
  MEETS = "Meets Expectations",
  PARTIALLY = "Partially Meets Expectations",
  DOES_NOT_MEET = "Does Not Meet Expectations",
}

export interface LLMCriteria {
  rating: string;
  justification: string;
}

export interface LLMJudgement {
  Clarity: LLMCriteria;
  Completeness: LLMCriteria;
  Consistency: LLMCriteria;
}

export interface Candidate {
  id: number;
  imageUrl: string;
  jsonUrl?: string; // Path to the JSON file containing LLM judgment
  label: string; // e.g., "Candidate 1", "Model A"
  llmJudgement?: LLMJudgement; // Loaded dynamically
}

export interface Sample {
  id: number;
  title: string;
  groundTruthUrl: string;
  candidates: Candidate[];
}

export interface UserEvaluation {
  // 1. Clarity
  clarityAgree: boolean | null; // true = agree, false = disagree
  clarityJustification: string;
  
  // 2. Completeness
  completenessAgree: boolean | null;
  completenessJustification: string;

  // 3. Consistency
  consistencyAgree: boolean | null;
  consistencyJustification: string;

  // 4. Accuracy
  accuracyRating: RatingEnum | null;
  accuracyJustification: string;

  // 5. Level of Detail
  detailRating: RatingEnum | null;
  detailJustification: string;

  // Metadata
  timestamp: number;
}

// Map of Sample ID -> Candidate ID -> Evaluation
export type EvaluationStore = Record<number, Record<number, UserEvaluation>>;
