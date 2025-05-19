export interface TextListItem {
  textId: number;
  domain?: string;
  theme?: string;
  subTheme?: string;
  reference: string;
  penaltyOrIncentive?: string;
  requirementsStatuses?: RequirementStatus[];
  applicablePercentage?: number;
}

export interface RequirementStatus {
  status: string;
  count: number;
}

export interface Domain {
  domainId: number;
  name: string;
}

export interface Theme {
  themeId: number;
  domainId: number;
  name: string;
}

export interface SubTheme {
  subThemeId: number;
  themeId: number;
  name: string;
}

export interface TextDetail {
  textId: number;
  domain?: string;
  theme?: string;
  subTheme?: string;
  reference: string;
  nature?: string;
  publicationYear?: number;
  penalties?: string;
  content?: string;
}

export interface Observation {
  observationId: number;
  content: string;
  createdAt: string;
  createdBy: string;
}

export interface MonitoringParameter {
  parameterId: number;
  name: string;
  value: string;
  createdAt: string;
}

export interface Attachment {
  attachmentId: number;
  fileName: string;
  uploadedAt: string;
}

export interface Evaluation {
  evaluationId: number;
  status: string;
  evaluatedAt: string;
  evaluatedBy: string;
  observations: Observation[];
  monitoringParameters: MonitoringParameter[];
  attachments: Attachment[];
}

export interface Requirement {
  requirementId: number;
  number: string;
  title: string;
  evaluation?: Evaluation;
}

export interface TextWithRequirements {
  text: TextDetail;
  requirements: Requirement[];
}

export interface FilterState {
  domainId: string | number;
  themeId: string | number;
  subThemeId: string | number;
  nature: string;
  publicationYear: string | number;
  keyword: string;
}

export interface ObservationDialogState {
  open: boolean;
  evaluationId: number | null;
  content: string;
}

export interface MonitoringDialogState {
  open: boolean;
  evaluationId: number | null;
  name: string;
  value: string;
}

export interface FileDialogState {
  open: boolean;
  evaluationId: number | null;
  file: File | null;
}
export interface Action {
  actionId: number;
  textId: number;
  textReference: string;
  requirementId?: number;
  requirementTitle?: string;
  description: string;
  responsibleId: number;
  responsibleName: string;
  deadline: string;
  progress: number;
  effectiveness?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  createdById: number;
  domain?: string;
  theme?: string;
  subTheme?: string;
}

export interface ActionDialogState {
  open: boolean;
  mode: 'create' | 'edit';
  textId?: number;
  requirementId?: number;
  actionId?: number;
  data: {
    description: string;
    responsibleId: number;
    deadline: string;
    progress: number;
    effectiveness: string;
    status: string;
  };
}

export interface User {
  userId: number;
  name: string;
  email: string;
  role: string;
}