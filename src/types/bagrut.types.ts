/**
 * Bagrut Entity Type Definitions
 * Based on the actual backend Bagrut schema and database structure
 */

// Basic Bagrut interface matching the backend schema
export interface Bagrut {
  _id?: string;
  studentId: string;
  teacherId: string;
  conservatoryName?: string;
  program: ProgramPiece[];
  accompaniment: AccompanimentInfo;
  presentations: Presentation[];
  gradingDetails?: GradingDetails;
  magenBagrut?: MagenBagrut;
  documents?: BagrutDocument[];
  finalGrade?: number;
  finalGradeLevel?: string;
  teacherSignature?: string;
  completionDate?: Date;
  isCompleted: boolean;
  testDate?: Date;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Program piece from the backend schema
export interface ProgramPiece {
  _id?: string;
  pieceTitle: string;
  composer: string;
  duration: string;
  movement?: string;
  youtubeLink?: string;
}

// Accompaniment info from backend schema
export interface AccompanimentInfo {
  type: 'נגן מלווה' | 'הרכב';
  accompanists: Accompanist[];
}

// Accompanist from backend schema
export interface Accompanist {
  _id?: string;
  name: string;
  instrument: string;
  phone?: string;
  email?: string;
}

// Presentation from backend schema (simplified for existing API)
export interface Presentation {
  completed?: boolean;
  status?: string;
  date?: Date;
  review?: string;
  reviewedBy?: string;
  notes?: string;
  recordingLinks?: string[];
  grade?: number;
  gradeLevel?: string;
}

// Grading details (simplified)
export interface GradingDetails {
  technique?: {
    grade?: number;
    maxPoints?: number;
    comments?: string;
  };
  interpretation?: {
    grade?: number;
    maxPoints?: number;
    comments?: string;
  };
  musicality?: {
    grade?: number;
    maxPoints?: number;
    comments?: string;
  };
  overall?: {
    grade?: number;
    maxPoints?: number;
    comments?: string;
  };
}

// Magen Bagrut (simplified)
export interface MagenBagrut {
  completed?: boolean;
  status?: string;
  date?: Date;
  review?: string;
  reviewedBy?: string;
  grade?: number;
  gradeLevel?: string;
  recordingLinks?: string[];
}

// Document from backend schema
export interface BagrutDocument {
  _id?: string;
  title: string;
  fileUrl: string;
  fileKey?: string;
  uploadDate: Date;
  uploadedBy: string;
}

// Form data types for simplified usage
export interface BagrutFormData {
  studentId: string;
  teacherId: string;
  conservatoryName?: string;
  program?: ProgramPiece[];
  testDate?: Date;
  notes?: string;
}

// Query parameters for API calls
export interface BagrutQueryParams {
  studentId?: string;
  teacherId?: string;
  isActive?: boolean;
  showInactive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

// Update data types (placeholders for future implementation)
export interface PresentationUpdateData {
  completed?: boolean;
  status?: string;
  date?: Date;
  review?: string;
  notes?: string;
}

export interface MagenBagrutUpdateData {
  completed?: boolean;
  status?: string;
  date?: Date;
  review?: string;
  grade?: number;
}

export interface GradingDetailsUpdateData {
  technique?: any;
  interpretation?: any;
  musicality?: any;
  overall?: any;
}

// Response types (for future use when API is fully implemented)
export interface BagrutResponse {
  success: boolean;
  data: Bagrut;
  message?: string;
}

export interface BagrutListResponse {
  success: boolean;
  data: Bagrut[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  message?: string;
}

// Error type
export interface BagrutError {
  message: string;
  field?: string;
  code?: string;
}