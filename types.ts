
export interface Source {
  web?: {
    uri: string;
    title: string;
  };
}

export interface ResearchStep {
  id: number;
  subject: string;
  summary: string;
  sources: Source[];
  nextSubject: string | null;
}

/**
 * Research depth level configuration
 * - casual: 500-1000 words, high school level, quick overview
 * - professional: 1500-2000 words, professional level, actionable insights
 * - scholarly: 3000-4000 words, BA level, academic rigor with multiple perspectives
 * - expert: 5000-6000 words, PhD level, cutting-edge research and analysis
 */
export type ResearchDepth = 'casual' | 'professional' | 'scholarly' | 'expert';

/**
 * Academic reading level
 * - ba: Bachelor's degree level (grade 15-16)
 * - ma: Master's degree level (grade 17-18)
 * - phd: Doctoral/expert level (grade 19+)
 */
export type AcademicLevel = 'ba' | 'ma' | 'phd';

/**
 * Research configuration for controlling output depth and academic level
 */
export interface ResearchConfig {
  depth: ResearchDepth;
  academicLevel: AcademicLevel;
  includePerspectives: boolean;
  includeCaseStudies: boolean;
  includeMethodology: boolean;
  wordCount: number;
}

/**
 * Default research configuration
 */
export const DEFAULT_RESEARCH_CONFIG: ResearchConfig = {
  depth: 'scholarly',
  academicLevel: 'ba',
  includePerspectives: true,
  includeCaseStudies: true,
  includeMethodology: false,
  wordCount: 3500
};
