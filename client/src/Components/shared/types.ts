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
  status: string;
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

export interface TextRequirement {
  requirementId: number;
  number: string;
  title: string;
  status: string;
  evaluation?: Evaluation;
}

export interface ActionDialogState {
  open: boolean;
  mode: 'create' | 'edit';
  textId?: number;
  requirementId?: number;
  actionId?: number;
  data: {
    requirementId?: number; // Added requirementId
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
export interface StatisticsByStatus {
  status: string;
  count: number;
}

export interface ActionProgressGroup {
  range: string;
  count: number;
}

export interface ActionByResponsible {
  responsibleId: number;
  responsibleName: string;
  totalActions: number;
  completedActions: number;
  averageProgress: number;
}

export interface StatisticsData {
  domains: Domain[];
  textsByStatus: StatisticsByStatus[];
  requirementsByStatus: StatisticsByStatus[];
  actionsByStatus: StatisticsByStatus[];
  actionProgressGroups: ActionProgressGroup[];
  actionsByResponsible: ActionByResponsible[];
}
export interface QuoteItem {
  quoteItemId: number;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  totalPrice: number;
  taxAmount: number;
}

export interface QuoteItemRequest {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export interface Quote {
  quoteId: number;
  quoteNumber: string;
  clientName: string;
  createdAt: string;
  validUntil: string;
  totalAmount: number;
  taxAmount: number;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Expired';
  emailSent: boolean;
  itemCount: number;
}

export interface QuoteDetail {
  quoteId: number;
  quoteNumber: string;
  client: {
    userId: number;
    name: string;
    email: string;
    phoneNumber: string;
  };
  createdBy: {
    userId: number;
    name: string;
  };
  createdAt: string;
  validUntil: string;
  totalAmount: number;
  taxAmount: number;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Expired';
  notes: string;
  emailSent: boolean;
  items: QuoteItem[];
}

export interface CreateQuoteRequest {
  clientUserId: number;
  validUntil: string;
  notes: string;
  sendEmail: boolean;
  items: QuoteItemRequest[];
}

export interface UpdateQuoteRequest {
  clientUserId?: number;
  validUntil?: string;
  notes?: string;
  status?: 'Pending' | 'Accepted' | 'Rejected' | 'Expired';
  sendEmail: boolean;
  items?: QuoteItemRequest[];
}

export interface Client {
  userId: number;
  name: string;
  email: string;
  phoneNumber: string;
}

export interface QuoteFilterRequest {
  clientUserId?: number;
  keyword?: string;
  status?: string;
  page: number;
  pageSize: number;
}