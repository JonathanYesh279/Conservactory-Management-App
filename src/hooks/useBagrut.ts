/**
 * React Hook for Bagrut Management
 * 
 * Provides a convenient interface for using the Bagrut API service
 * with built-in state management, loading states, and error handling
 */

import { useState, useCallback, useEffect } from 'react';
import { bagrutService } from '../services/apiService.js';
import type {
  Bagrut,
  BagrutFormData,
  BagrutQueryParams,
  ProgramPiece,
  Accompanist,
  PresentationUpdateData,
  MagenBagrutUpdateData,
  GradingDetailsUpdateData
} from '../types/bagrut.types';

// Hook return type
interface UseBagrutReturn {
  // State
  bagrut: Bagrut | null;
  bagruts: Bagrut[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  } | null;

  // Core CRUD operations
  fetchAllBagruts: (params?: BagrutQueryParams) => Promise<void>;
  fetchBagrutById: (id: string) => Promise<void>;
  fetchBagrutByStudentId: (studentId: string) => Promise<void>;
  createBagrut: (data: BagrutFormData) => Promise<Bagrut | null>;
  updateBagrut: (id: string, data: Partial<Bagrut>) => Promise<Bagrut | null>;
  deleteBagrut: (id: string) => Promise<boolean>;

  // Presentation management
  updatePresentation: (bagrutId: string, index: number, data: PresentationUpdateData) => Promise<boolean>;

  // Magen Bagrut
  updateMagenBagrut: (bagrutId: string, data: MagenBagrutUpdateData) => Promise<boolean>;

  // Grading
  updateGradingDetails: (bagrutId: string, data: GradingDetailsUpdateData) => Promise<boolean>;
  calculateFinalGrade: (bagrutId: string) => Promise<boolean>;
  completeBagrut: (bagrutId: string, signature: string) => Promise<boolean>;

  // Document management
  uploadDocument: (bagrutId: string, file: File, category: string, description?: string) => Promise<boolean>;
  removeDocument: (bagrutId: string, documentId: string) => Promise<boolean>;
  downloadDocument: (bagrutId: string, documentId: string) => Promise<Blob | null>;

  // Program management
  addProgramPiece: (bagrutId: string, piece: Omit<ProgramPiece, '_id'>) => Promise<boolean>;
  updateProgram: (bagrutId: string, program: ProgramPiece[]) => Promise<boolean>;
  removeProgramPiece: (bagrutId: string, pieceId: string) => Promise<boolean>;

  // Accompanist management
  addAccompanist: (bagrutId: string, accompanist: Omit<Accompanist, '_id'>) => Promise<boolean>;
  removeAccompanist: (bagrutId: string, accompanistId: string) => Promise<boolean>;

  // Utilities
  clearError: () => void;
  refreshCache: () => void;
}

/**
 * Custom hook for Bagrut management
 */
export function useBagrut(): UseBagrutReturn {
  const [bagrut, setBagrut] = useState<Bagrut | null>(null);
  const [bagruts, setBagruts] = useState<Bagrut[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseBagrutReturn['pagination']>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh cache (placeholder)
  const refreshCache = useCallback(() => {
    // No cache to clear in existing API
  }, []);

  // Fetch all bagruts
  const fetchAllBagruts = useCallback(async (params?: BagrutQueryParams) => {
    setLoading(true);
    setError(null);
    try {
      const bagruts = await bagrutService.getBagruts(params || {});
      setBagruts(Array.isArray(bagruts) ? bagruts : []);
      setPagination(null); // Existing API doesn't return pagination
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      setError(errorMessage);
      console.error('Error fetching bagruts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch bagrut by ID
  const fetchBagrutById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const bagrut = await bagrutService.getBagrut(id);
      setBagrut(bagrut || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      setError(errorMessage);
      console.error('Error fetching bagrut:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch bagrut by student ID
  const fetchBagrutByStudentId = useCallback(async (studentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const bagrut = await bagrutService.getBagrutByStudent(studentId);
      setBagrut(bagrut || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      setError(errorMessage);
      console.error('Error fetching student bagrut:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create bagrut
  const createBagrut = useCallback(async (data: BagrutFormData): Promise<Bagrut | null> => {
    setLoading(true);
    setError(null);
    try {
      const bagrut = await bagrutService.createBagrut(data);
      setBagrut(bagrut || null);
      return bagrut;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      setError(errorMessage);
      console.error('Error creating bagrut:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update bagrut
  const updateBagrut = useCallback(async (id: string, data: Partial<Bagrut>): Promise<Bagrut | null> => {
    setLoading(true);
    setError(null);
    try {
      const bagrut = await bagrutService.updateBagrut(id, data);
      setBagrut(bagrut || null);
      return bagrut;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      setError(errorMessage);
      console.error('Error updating bagrut:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete bagrut (placeholder - not implemented in existing API)
  const deleteBagrut = useCallback(async (id: string): Promise<boolean> => {
    setError('מחיקת בגרויות לא מושלמה עדיין');
    return false;
  }, []);

  // Update presentation
  const updatePresentation = useCallback(async (
    bagrutId: string,
    index: number,
    data: PresentationUpdateData
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const bagrut = await bagrutService.updatePresentation(bagrutId, index, data);
      setBagrut(bagrut || null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בעדכון המצגת';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update Magen Bagrut (placeholder)
  const updateMagenBagrut = useCallback(async (
    bagrutId: string,
    data: MagenBagrutUpdateData
  ): Promise<boolean> => {
    setError('עדכון מגן בגרות לא מושלם עדיין');
    return false;
  }, []);

  // Update grading details (placeholder)
  const updateGradingDetails = useCallback(async (
    bagrutId: string,
    data: GradingDetailsUpdateData
  ): Promise<boolean> => {
    setError('עדכון פרטי הציונים לא מושלם עדיין');
    return false;
  }, []);

  // Calculate final grade (placeholder)
  const calculateFinalGrade = useCallback(async (bagrutId: string): Promise<boolean> => {
    setError('חישוב ציון סופי לא מושלם עדיין');
    return false;
  }, []);

  // Complete bagrut (placeholder)
  const completeBagrut = useCallback(async (
    bagrutId: string,
    signature: string
  ): Promise<boolean> => {
    setError('השלמת בגרות לא מושלמת עדיין');
    return false;
  }, []);

  // Upload document (placeholder)
  const uploadDocument = useCallback(async (
    bagrutId: string,
    file: File,
    category: string,
    description?: string
  ): Promise<boolean> => {
    setError('העלאת מסמכים לא מושלמת עדיין');
    return false;
  }, []);

  // Remove document (placeholder)
  const removeDocument = useCallback(async (
    bagrutId: string,
    documentId: string
  ): Promise<boolean> => {
    setError('מחיקת מסמכים לא מושלמת עדיין');
    return false;
  }, []);

  // Download document (placeholder)
  const downloadDocument = useCallback(async (
    bagrutId: string,
    documentId: string
  ): Promise<Blob | null> => {
    setError('הורדת מסמכים לא מושלמת עדיין');
    return null;
  }, []);

  // Add program piece (placeholder)
  const addProgramPiece = useCallback(async (
    bagrutId: string,
    piece: Omit<ProgramPiece, '_id'>
  ): Promise<boolean> => {
    setError('הוספת יצירות לא מושלמת עדיין');
    return false;
  }, []);

  // Update program (placeholder)
  const updateProgram = useCallback(async (
    bagrutId: string,
    program: ProgramPiece[]
  ): Promise<boolean> => {
    setError('עדכון תכנית לא מושלם עדיין');
    return false;
  }, []);

  // Remove program piece (placeholder)
  const removeProgramPiece = useCallback(async (
    bagrutId: string,
    pieceId: string
  ): Promise<boolean> => {
    setError('מחיקת יצירות לא מושלמת עדיין');
    return false;
  }, []);

  // Add accompanist (placeholder)
  const addAccompanist = useCallback(async (
    bagrutId: string,
    accompanist: Omit<Accompanist, '_id'>
  ): Promise<boolean> => {
    setError('הוספת מלווים לא מושלמת עדיין');
    return false;
  }, []);

  // Remove accompanist (placeholder)
  const removeAccompanist = useCallback(async (
    bagrutId: string,
    accompanistId: string
  ): Promise<boolean> => {
    setError('מחיקת מלווים לא מושלמת עדיין');
    return false;
  }, []);

  return {
    // State
    bagrut,
    bagruts,
    loading,
    error,
    pagination,

    // Core CRUD
    fetchAllBagruts,
    fetchBagrutById,
    fetchBagrutByStudentId,
    createBagrut,
    updateBagrut,
    deleteBagrut,

    // Presentation management
    updatePresentation,

    // Magen Bagrut
    updateMagenBagrut,

    // Grading
    updateGradingDetails,
    calculateFinalGrade,
    completeBagrut,

    // Document management
    uploadDocument,
    removeDocument,
    downloadDocument,

    // Program management
    addProgramPiece,
    updateProgram,
    removeProgramPiece,

    // Accompanist management
    addAccompanist,
    removeAccompanist,

    // Utilities
    clearError,
    refreshCache
  };
}