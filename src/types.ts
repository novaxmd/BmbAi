export interface AnalysisResult {
  summary: string;
  language: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  libraries: string[];
  purpose: string;
  deobfuscatedSnippet?: string;
}

export interface ImageGenResult {
  imageUrl?: string;
  text?: string;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}