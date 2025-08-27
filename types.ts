



export type AppView = 'dashboard' | 'project' | 'settings' | 'crm';
export type AppTool = 'dashboard' | 'estimator' | 'scheduleOfValues' | 'changeOrder' | 'dailyLog' | 'rfiManager' | 'invoicing' | 'email' | 'drive' | 'inspections' | 'projectContacts' | 'riskManagement' | 'clientPortal' | 'photoGallery' | 'testingAndQuality' | 'expenseTracker' | 'reporting' | 'submittals' | 'incidents' | 'timeTracking' | 'taskManager' | 'punchList' | 'correspondence';

// =================================================================
// == Core Data Structures
// =================================================================

export interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  logo: string; // base64 encoded string
}

export interface Contact {
  id: string;
  name: string;
  company: string;
  role: string;
  email: string;
  phone: string;
  billableRate?: number; // Hourly rate for time tracking
}

export interface Project {
  id: string;
  // Intake data
  name: string;
  address: string;
  clientName: string;
  
  // App state
  activeTool: AppTool;
  
  // Project-specific contact IDs
  contactIds: string[];

  // Feature Flags
  usesScheduleOfValues: boolean;

  // Tool-specific data stores
  changeOrders: ChangeOrder[];
  estimator: {
    apiResponse: GeminiResponse | null;
    stagedRfis: RfiItem[];
    processedPlanText: string;
  };
  rfiManager: {
    managedRfis: ManagedRfiItem[];
  };
  inspections: InspectionRequest[];
  dailyLogs: DailyLog[];
  email: Email[];
  drive: DriveFile[];
  invoicing: InvoiceState;
  riskManagement: {
    risks: RiskItem[];
    meetings: Meeting[];
  };
  clientUpdates: ClientUpdate[];
  testingAndQuality: TestInstance[];
  expenses: Expense[];
  submittals: Submittal[];
  incidents: Incident[];
  customReports: CustomReport[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  punchList: PunchListItem[];
  correspondence: Correspondence[];
}


// =================================================================
// == Tool-Specific Types
// =================================================================

// Correspondence Types
export type CorrespondenceType = 'Letter' | 'Transmittal' | 'Memo' | 'Notice';

export interface Correspondence {
  id: string;
  corNumber: number;
  date: string; // YYYY-MM-DD
  toContactId: string;
  fromContactId: string;
  subject: string;
  body: string;
  type: CorrespondenceType;
  driveFileId?: string; // Link to the final PDF/document in the drive
}


// Punch List Types
export type PunchListStatus = 'Open' | 'In Progress' | 'Ready for Review' | 'Completed' | 'Closed';

export interface PunchListItem {
  id: string;
  punchNumber: number;
  title: string;
  description: string;
  location: string;
  status: PunchListStatus;
  assigneeId?: string; // Responsible contractor/person
  dueDate?: string;
  photoIds: string[];
  createdBy: string; // Contact ID
  createdAt: string;
}

// Task Management Types
export type TaskStatus = 'Initiated' | 'In Progress' | 'Completed' | 'Closed' | 'On Hold';
export type TaskCategory = 'Preconstruction' | 'Administrative' | 'Miscellaneous' | 'Field Work' | 'Safety';
export type TaskPriority = 'High' | 'Medium' | 'Low';

export interface TaskActivity {
  id: string;
  timestamp: string;
  userId: string; // Contact ID
  type: 'comment' | 'status_change' | 'assignment' | 'update';
  content: string;
  oldValue?: string;
  newValue?: string;
}

export interface Task {
  id: string;
  taskNumber: number;
  title: string;
  description: string; // Can store rich text/HTML
  assigneeId: string;
  collaboratorIds: string[];
  dueDate: string;
  status: TaskStatus;
  category: TaskCategory;
  priority: TaskPriority;
  createdBy: string; // Contact ID
  createdAt: string;
  isPrivate: boolean; // For the lock icon
  activity: TaskActivity[];
}


// New Change Order types
export type ChangeOrderStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Void';
export type ChangeOrderType = 'Client Request' | 'Field Condition' | 'Design Omission' | 'Code Requirement' | 'Other';
export type CostImpactType = 'Lump Sum' | 'Time & Materials' | 'Unit Cost' | 'No Cost';

export interface CostBreakdownItem {
    id: string;
    description: string;
    type: 'Material' | 'Labor' | 'Equipment' | 'Subcontractor' | 'Markup' | 'Other';
    quantity: number;
    unitCost: number;
}

export interface ChangeOrder {
    id: string;
    coNumber: number;
    title: string;
    status: ChangeOrderStatus;
    type: ChangeOrderType;
    
    requestDate: string;
    
    scopeDescription: string;
    reasonForChange: string;
    
    scheduleImpactDays: number;
    costImpactType: CostImpactType;
    costBreakdown: CostBreakdownItem[];
    
    attachmentIds: string[]; // array of driveFileIds
}


// New Structured Daily Log Types
export type DailyLogStatus = 'Draft' | 'Signed';
export type WeatherCondition = 'Sunny' | 'Partly Cloudy' | 'Cloudy' | 'Rain' | 'Windy' | 'Snow' | 'Fog';

export interface WeatherLog {
    temperature: number; // in Fahrenheit
    conditions: WeatherCondition;
    notes: string;
}

export interface ManpowerLog {
    id: string;
    company: string;
    workers: number;
    hours: number;
    location: string;
    comments: string;
}

export interface EquipmentLog {
    id: string;
    name: string;
    hoursOperating: number;
    hoursIdle: number;
    location: string;
    comments: string;
}

export interface WorkLog {
    id: string;
    description: string;
}

export interface DeliveryLog {
    id: string;
    time: string; // "HH:MM"
    deliveryFrom: string;
    trackingNumber: string;
    contents: string;
    comments: string;
}

export interface VisitorLog {
    id: string;
    visitor: string;
    startTime: string; // "HH:MM"
    endTime: string; // "HH:MM"
    comments: string;
}

export interface DelayLog {
    id: string;
    type: string;
    startTime: string; // "HH:MM"
    endTime: string; // "HH:MM"
    duration: number; // in hours
    location: string;
    comments: string;
}

export interface SafetyViolationEntry {
    id: string;
    time: string; // "HH:MM"
    subject: string;
    issuedTo: string;
    comments: string;
}

export interface AccidentEntry {
    id: string;
    time: string; // "HH:MM"
    partyInvolved: string;
    companyInvolved: string;
    comments: string;
}

export interface SafetyAndIncidentsLog {
    toolboxTalkTopic: string;
    safetyViolations: SafetyViolationEntry[];
    accidents: AccidentEntry[];
    generalObservations: string;
}

export interface WasteLog {
    id: string;
    time: string; // "HH:MM"
    material: string;
    disposedBy: string;
    method: string;
    location: string;
    quantity: string; // e.g., "1 truckload", "5 CY"
    comments: string;
}

export interface QuantityLog {
    id: string;
    costCode: string;
    quantity: number;
    units: string;
    location: string;
    comments: string;
}

export interface NoteLog {
    id: string;
    location: string;
    comments: string;
}


export interface DailyLog {
    id: string;
    date: string;
    status: DailyLogStatus;
    
    // AI-related field for raw input
    rawNotes: string;

    // Structured data sections
    weather: WeatherLog;
    manpower: ManpowerLog[];
    equipment: EquipmentLog[];
    workCompleted: WorkLog[];
    deliveries: DeliveryLog[];
    visitors: VisitorLog[];
    delays: DelayLog[];
    safetyAndIncidents: SafetyAndIncidentsLog;
    waste: WasteLog[];
    quantities: QuantityLog[];
    notes: NoteLog[];
    photoIds: string[]; // Links to DriveFile IDs

    // Finalization fields
    driveFileId?: string;
    signedBy?: string;
    signedAt?: string;
    revisionOf?: string;
}


export enum Mode {
  All = 'all',
  EstimateOnly = 'estimate_only',
  ProposalOnly = 'proposal_only',
  ReplyOnly = 'reply_only',
}

export enum Unit {
  Each = 'EA',
  LinearFoot = 'LF',
  SquareFoot = 'SF',
  SquareYard = 'SY',
  CubicYard = 'CY',
  Hour = 'HR',
  LumpSum = 'LS',
}

export enum Confidence {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

export interface LineItem {
  item: string;
  unit: Unit;
  qty: number;
  confidence: Confidence;
  notes: string;
  unitPrice?: number;
  lineTotal?: number;
}

export interface EstimateJSON {
  project_id: string;
  scope_summary: string;
  assumptions: string[];
  line_items: LineItem[];
  exclusions: string[];
}

export interface RfiItem {
  subject: string;
  question:string;
}

export type RfiStatus = 'Draft' | 'Sent' | 'Answered' | 'Closed';

export interface RfiLogEntry {
  timestamp: string;
  note: string;
}

export interface ManagedRfiItem extends RfiItem {
  id: string;
  status: RfiStatus;
  answer?: string;
  analysis?: string;
  log?: RfiLogEntry[];
}

// Types for Inspection Management
export type InspectionStatus = 'Open' | 'Scheduled' | 'Passed' | 'Failed' | 'Closed';

export interface AuditLogEntry {
    timestamp: string;
    user: string; // For simplicity, we'll use a string like "Project Manager"
    action: string;
}

export interface InspectionRequest {
  id: string;
  inspectionNumber: number;
  type: string;
  recipientName: string;
  recipientEmail: string;
  requestedDate: string;
  scheduledDate?: string;
  status: InspectionStatus;
  outcomeNotes?: string;
  relatedInspectionId?: string; // Links a follow-up to a failed one
  isSigned: boolean;
  signedBy?: string;
  signedAt?: string;
  driveFileId?: string;
  auditLog: AuditLogEntry[];
}


export interface GeminiResponse {
  estimate_json: EstimateJSON;
  proposal_text: string;
  bid_reply_email: string;
  rfi_list: RfiItem[];
}

export interface FormState {
  mode: Mode;
  projectId: string;
  projectName: string;
  trade: string;
  jurisdiction: string;
  planText: string;
  gcQuestions: string;
  knownConstraints: string;
}

// Types for Invoicing Feature
export interface ContractLineItem {
  id: string;
  itemNumber: string;
  description: string;
  scheduledValue: number;
  prevBilled: number;
  thisPeriod: number;
  storedMaterials: number;
  // Link to source data for traceability
  sourceExpenseId?: string;
  sourceTimeEntryIds?: string[];
  // For tracking adjustments/variance
  originalThisPeriodAmount?: number; 
}

export interface ChangeOrderItem {
  id: string;
  description: string;
  value: number;
}

export interface InvoiceState {
  projectName: string;
  applicationNumber: number;
  periodTo: string;
  architectsProjectNumber: string;
  
  lineItems: ContractLineItem[];
  changeOrders: ChangeOrderItem[];
  
  retainagePercentage: number;
  materialsRetainagePercentage: number;
  previousPayments: number;
}

// Types for Communications Features
export interface Email {
    id: string;
    from: string;
    to?: string; // Add a 'to' field for composed emails
    subject: string;
    body: string;
    timestamp: string;
    read: boolean;
}

export interface DriveFile {
    id: string;
    name: string;
    type: string;
    size: number;
    url?: string; // Temporary blob URL, not persisted in localStorage
    folderPath: string; // e.g., "/", "/Inspections/", "/Photos/"
    isLocked: boolean; // True if this is a signed record
    caption?: string;
    annotationMethod?: 'manual' | 'vision' | 'voice';
}

// Types for Risk Management
export type RiskStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Closed';
export type RiskCategory = 'Schedule' | 'Budget' | 'Safety' | 'Quality' | 'Communication' | 'Other';
export type RiskSeverity = 'High' | 'Medium' | 'Low';

export interface RiskItem {
    id: string;
    description: string;
    category: RiskCategory;
    severity: RiskSeverity;
    mitigationPlan: string;
    status: RiskStatus;
    createdAt: string;
    updates: AgendaUpdate[];
}

export type AgendaItemStatus = 'Open' | 'In Progress' | 'Carried Over' | 'Closed';

export interface AgendaUpdate {
    meetingId: string;
    timestamp: string;
    updateText: string;
    status: AgendaItemStatus;
}

export interface Meeting {
    id: string;
    date: string;
    title: string;
    attendees: string[];
}

// Types for Client Portal
export type UpdateStatus = 'Draft' | 'Published';

export interface ClientUpdateSection {
    id: string;
    heading: string;
    content: string;
    imageUrls: string[]; // URLs from Project Drive files
}

export interface ClientUpdate {
    id: string;
    title: string;
    summary: string;
    publicationDate: string;
    status: UpdateStatus;
    sections: ClientUpdateSection[];
}

// Types for Testing & QC
export type TestStatus = 'Pass' | 'Fail' | 'Pending';

export interface TestInstance {
  id: string;
  name: string;
  date: string;
  location: string;
  requiredSpec: string;
  actualResult: string;
  status: TestStatus;
  notes: string;
  sourceDocumentId?: string; // Links to a file in the drive
}

// Types for Expense Tracker
export enum ExpenseCategory {
    Supplies = 'Supplies',
    Fuel = 'Fuel',
    Meals = 'Meals',
    EquipmentRental = 'Equipment Rental',
    Travel = 'Travel',
    Other = 'Other',
}

export interface Expense {
    id: string;
    date: string;
    vendor: string;
    amount: number;
    category: ExpenseCategory;
    description: string;
    invoicable: boolean;
    status: 'Pending' | 'Invoiced';
    sourceReceiptId: string; // Links to a file in the drive
}

// Types for Submittals
export type SubmittalStatus = 'Draft' | 'Open' | 'Pending' | 'Approved' | 'Rejected' | 'Revise & Resubmit' | 'Closed';
export type SubmittalWorkflowRole = 'Approver' | 'Reviewer';

export interface SubmittalWorkflowStep {
  id: string;
  stepNumber: number;
  contactId?: string;
  role: SubmittalWorkflowRole;
  daysToRespond: number;
}

export interface Submittal {
  id: string;
  number: string;
  revision: number;
  title: string;
  status: SubmittalStatus;
  submittalManagerId: string;
  // General Information
  specSection?: string;
  submittalType?: string;
  submittalPackage?: string;
  responsibleContractorId?: string;
  receivedFromId?: string;
  submitByDate?: string;
  receivedDate?: string;
  issueDate?: string;
  // Schedule Information
  requiredOnSiteDate?: string;
  leadTime?: number;
  designTeamReviewTime?: number;
  internalReviewTime?: number;
  // Delivery Information
  confirmedDeliveryDate?: string;
  actualDeliveryDate?: string;
  // Other
  costCode?: string;
  location?: string;
  private: boolean;
  description?: string;
  distributionListIds: string[];
  workflow: SubmittalWorkflowStep[];
  attachments: string[]; // array of driveFileIds
}

// Types for Incident Management
export enum IncidentHazard {
    CaughtInOrBetween = 'Caught In or Between',
    ChemicalExposure = 'Chemical Exposure',
    Electrical = 'Electrical',
    Environmental = 'Environmental',
    Ergonomics = 'Ergonomics',
    ExcavationAndTrenching = 'Excavation and Trenching',
    FallOrSlip = 'Fall or Slip',
    FireOrExplosion = 'Fire or Explosion',
    StruckBy = 'Struck By',
    ToolOrEquipment = 'Tool or Equipment',
    Other = 'Other',
}

export enum IncidentContributingCondition {
    DefectiveToolsOrEquipment = 'Defective Tools or Equipment',
    InadequateGuarding = 'Inadequate Guarding',
    PoorHousekeeping = 'Poor Housekeeping',
    WeatherConditions = 'Weather Conditions',
    WorkplaceViolence = 'Workplace Violence',
    Other = 'Other',
}

export enum IncidentContributingBehavior {
    FailureToFollowProcedure = 'Failure to Follow Procedure',
    ImproperLifting = 'Improper Lifting',
    InadequatePPE = 'Inadequate PPE',
    Inattention = 'Inattention',
    Rushing = 'Rushing',
    Other = 'Other',
}


export interface Incident {
    id: string;
    title: string;
    eventDate: string; // YYYY-MM-DD
    eventTime?: string; // HH:MM
    isTimeUnknown: boolean;
    location: string;
    isRecordable: boolean;
    isPrivate: boolean;
    description: string;
    distributionIds: string[];
    attachments: string[]; // array of driveFileIds
    // Investigation
    hazard?: IncidentHazard;
    contributingCondition?: IncidentContributingCondition;
    contributingBehavior?: IncidentContributingBehavior;
}


// Types for Reporting
export type ReportableDataSource = 'expenses' | 'dailyLogs' | 'rfiManager' | 'inspections';
export type CannedReportId = 'financialSummary' | 'expenseByCategory' | 'rfiLog' | 'billableExpenses';

export interface Filter {
    id: string;
    field: string;
    operator: string;
    value: any;
}

export interface Grouping {
    field: string;
    aggregation: 'sum' | 'count' | 'avg';
    aggField: string;
}

export interface CustomReport {
    id: string;
    name: string;
    dataSource: ReportableDataSource;
    fields: string[];
    filters: Filter[];
    grouping?: Grouping;
}

// Types for Time Tracking
export type TimeEntryStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Invoiced';

export interface TimeEntry {
    id: string;
    employeeId: string; // Links to a Contact
    date: string; // YYYY-MM-DD
    hours: number;
    costCode: string;
    description?: string;
    status: TimeEntryStatus;
    invoiceId?: string; // Links to an invoice when billed
    location?: {
        latitude: number;
        longitude: number;
    };
    locationTimestamp?: string;
}
