
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
