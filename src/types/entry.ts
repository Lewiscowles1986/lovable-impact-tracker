export type RACIRole = 'responsible' | 'accountable' | 'consulted' | 'informed';

export interface ImpactEntry {
  id: string;
  title: string;
  createdAt: string;
  // STAR
  situation: string;
  task: string;
  action: string;
  result: string;
  // Scheduling
  startDate: string;
  endDate: string;
  originalEstimateDays: number;
  actualDays: number;
  // Extra
  complicatingFactors: string;
  technologies: string[];
  growthWins: string;
  // RACI
  raci: RACIRole[];
  // Meta
  status: 'planned' | 'in-progress' | 'completed';
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
}
