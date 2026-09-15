import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Checkbox,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';

import GetAppIcon from '@mui/icons-material/GetApp';
import SchoolIcon from '@mui/icons-material/School';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BarChartIcon from '@mui/icons-material/BarChart';
import SaveIcon from '@mui/icons-material/Save';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
// ✅ Approval icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UndoIcon from '@mui/icons-material/Undo';
import VerifiedIcon from '@mui/icons-material/Verified';

import {
  studentsClassesScoresAPI,   // kept: delete / bulkDelete handlers
  termsAPI,
  sessionsAPI,
  classesAPI,
  subjectsAPI,
  getUserRole,
  continuousAssessmentsAPI,   // ✅ approve / unapprove / update endpoints (/admin/ca/...)
  adminCAAPI                  // ✅ NEW: list source with guaranteed _id (/admin/ca/all)
} from '../../api';

const StudentsClassesScoresPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const userRole = getUserRole();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('table');
  const [selectedIds, setSelectedIds] = useState([]);

  const [scores, setScores] = useState([]);
  const [summary, setSummary] = useState(null);
  const [terms, setTerms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [filters, setFilters] = useState({
    termId: '',
    sessionId: '',
    classId: '',
    subjectId: '',
    status: 'all',
    search: ''
  });

  const [pagination, setPagination] = useState({
    total: 0,
    page: 0,
    limit: 25
  });

  // ============================================
  // APPROVAL STATE
  // ============================================
  const [approvingId, setApprovingId] = useState(null);        // row-level spinner
  const [bulkApproving, setBulkApproving] = useState(false);   // bulk action spinner

  const canApprove = userRole === 'admin' || userRole === 'superadmin';

  // ============================================
  // DIALOG STATES
  // ============================================
  const [editDialog, setEditDialog] = useState({
    open: false,
    score: null,
    loading: false
  });

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    score: null,
    loading: false
  });

  const [bulkDeleteDialog, setBulkDeleteDialog] = useState({
    open: false,
    loading: false
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    testScore: '',
    noteTakingScore: '',
    assignmentScore: '',
    examScore: '',
    status: 'draft'
  });

  // --- Helper Functions ---
  const getGradeColor = (grade) => {
    if (!grade) return '#000';
    const g = grade.toUpperCase();
    if (g === 'A') return '#2e7d32';
    if (g === 'B') return '#1976d2';
    if (g === 'C') return '#ed6c02';
    if (g === 'D') return '#f57c00';
    if (g === 'F') return '#d32f2f';
    return '#000';
  };

  const getStatusLabel = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusColor = (status) => {
    if (status === 'approved') return '#e8f5e9';
    if (status === 'submitted') return '#fff3e0';
    return '#e0e0e0';
  };

  const getClassDisplayName = (cls) => {
    if (!cls) return 'Unknown Class';
    if (typeof cls === 'string') return cls;
    const name = cls.name || cls.className || cls.class_name || '';
    const section = cls.section || cls.classSection || '';
    const level = cls.level || cls.classLevel || '';
    if (name && section) return name + ' (' + section + ')';
    if (name && level) return name + ' - ' + level;
    if (name) return name;
    if (cls.fullName) return cls.fullName;
    return 'Unknown Class';
  };

  const getSubjectDisplayName = (sub) => {
    if (!sub) return 'Unknown Subject';
    if (typeof sub === 'string') return sub;
    const name = sub.name || sub.subjectName || sub.subject_name || '';
    const code = sub.code || sub.subjectCode || sub.subject_code || '';
    if (name && code) return name + ' (' + code + ')';
    if (name) return name;
    return 'Unknown Subject';
  };

  const getStudentDisplayName = (student) => {
    if (!student) return 'Unknown Student';
    if (typeof student === 'string') return student;
    const firstName = student.firstName || student.first_name || '';
    const lastName = student.lastName || student.last_name || '';
    const fullName = student.fullName || student.full_name || '';
    const admissionNumber = student.admissionNumber || student.admission_number || '';
    if (fullName) return fullName;
    if (firstName && lastName) return firstName + ' ' + lastName;
    if (firstName) return firstName;
    return admissionNumber || 'Unknown Student';
  };

  const calculateTotalCA = (scoresData) => {
    if (!scoresData) return null;
    if (scoresData.totalCA !== undefined && scoresData.totalCA !== null) {
      return scoresData.totalCA;
    }
    const test = scoresData.testScore || 0;
    const notes = scoresData.noteTakingScore || 0;
    const assign = scoresData.assignmentScore || 0;
    return test + notes + assign;
  };

  // ============================================
  // ✅ Universal record-ID extractor
  // Records now come from /admin/ca/all → _id is always present.
  // Fallbacks kept for safety. 🔍 DEBUG logs — remove once confirmed.
  // ============================================
  const getRecordId = (score) => {
    if (!score) {
      console.warn('🔍 DEBUG [getRecordId] record is null/undefined');
      return null;
    }
    const resolved =
      score._id ??
      score.id ??
      score.scores?.id ??
      score.scores?._id ??
      score.assessmentId ??
      score.assessment_id ??
      score.caId ??
      score.ca_id ??
      score.scoreId ??
      score.score_id ??
      null;

    if (resolved == null) {
      console.warn('🔍 DEBUG [getRecordId] no ID found. Keys:', Object.keys(score));
    } else {
      console.log('🔍 DEBUG [getRecordId] resolved →', resolved,
        '(from key:', score._id != null ? '_id' : score.id != null ? 'id' : 'other', ')');
    }
    return resolved;
  };

  // ✅ A row is actionable (approve/edit/delete) only if it has a resolvable ID
  const isRecordActionable = (score) => getRecordId(score) != null;

  // ============================================
  // APPROVE / UNAPPROVE HANDLERS
  // (via continuousAssessmentsAPI → /admin/ca/...)
  // ============================================
  const handleApprove = async (score) => {
    const scoreId = getRecordId(score);
    if (!scoreId) { setError('This record has no score yet — nothing to approve'); return; }

    setApprovingId(scoreId);
    setError(null);
    const previous = scores;
    // Optimistic update
    setScores(prev => prev.map(s => (getRecordId(s) === scoreId ? { ...s, status: 'approved' } : s)));

    try {
      const response = await continuousAssessmentsAPI.approve(scoreId);
      if (response.success) {
        setSuccess(response.message || 'Assessment approved successfully');
      } else {
        setScores(previous);
        setError(response.message || 'Failed to approve');
      }
    } catch (err) {
      setScores(previous);
      setError(err.response?.data?.message || err.message || 'Failed to approve assessment');
    } finally {
      setApprovingId(null);
    }
  };

  const handleUnapprove = async (score) => {
    const scoreId = getRecordId(score);
    if (!scoreId) { setError('This record has no score yet — nothing to unapprove'); return; }

    setApprovingId(scoreId);
    setError(null);
    const previous = scores;
    // Optimistic update
    setScores(prev => prev.map(s => (getRecordId(s) === scoreId ? { ...s, status: 'submitted' } : s)));

    try {
      const response = await continuousAssessmentsAPI.unapprove(scoreId);
      if (response.success) {
        setSuccess(response.message || 'Assessment unapproved successfully');
      } else {
        setScores(previous);
        setError(response.message || 'Failed to unapprove');
      }
    } catch (err) {
      setScores(previous);
      setError(err.response?.data?.message || err.message || 'Failed to unapprove assessment');
    } finally {
      setApprovingId(null);
    }
  };

  const handleBulkApproveSelected = async () => {
    if (selectedIds.length === 0) return;
    setBulkApproving(true);
    setError(null);

    try {
      const response = await continuousAssessmentsAPI.bulkReapprove(selectedIds);
      if (response.success) {
        const count = response.data?.modified ?? selectedIds.length;
        setSuccess(count + ' assessment(s) approved successfully');
        setSelectedIds([]);
        fetchScores(); // refresh statuses/counts
      } else {
        setError(response.message || 'Failed to approve selected records');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to approve selected assessments');
    } finally {
      setBulkApproving(false);
    }
  };

  const handleBulkUnapproveSelected = async () => {
    if (selectedIds.length === 0) return;
    setBulkApproving(true);
    setError(null);

    try {
      const response = await continuousAssessmentsAPI.bulkUnapprove({ ids: selectedIds });
      if (response.success) {
        const count = response.data?.modified ?? selectedIds.length;
        setSuccess(count + ' assessment(s) unapproved successfully');
        setSelectedIds([]);
        fetchScores();
      } else {
        setError(response.message || 'Failed to unapprove selected records');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to unapprove selected assessments');
    } finally {
      setBulkApproving(false);
    }
  };

  // Approve ALL records matching the current filters (server-side).
  // Requires Status filter = 'submitted' (what the endpoint expects).
  const handleApproveAllFiltered = async () => {
    setBulkApproving(true);
    setError(null);

    try {
      const filtersPayload = {};
      if (filters.termId) filtersPayload.termId = filters.termId;
      if (filters.sessionId) filtersPayload.sessionId = filters.sessionId;
      if (filters.classId) filtersPayload.classId = filters.classId;
      if (filters.subjectId) filtersPayload.subjectId = filters.subjectId;

      const response = await continuousAssessmentsAPI.bulkApproveByFilters(filtersPayload);
      if (response.success) {
        const count = response.data?.modified ?? 0;
        setSuccess(response.message || (count + ' assessment(s) approved'));
        fetchScores();
      } else {
        setError(response.message || 'Failed to approve assessments');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to approve assessments');
    } finally {
      setBulkApproving(false);
    }
  };

  // ============================================
  // EDIT SCORE HANDLERS
  // ============================================
  const handleOpenEditDialog = (score) => {
    // Records from /admin/ca/all are flat — score.scores is undefined,
    // so scoresData falls back to the row itself
    const scoresData = score.scores || score;

    setEditForm({
      testScore: scoresData.testScore !== undefined && scoresData.testScore !== null ? scoresData.testScore : '',
      noteTakingScore: scoresData.noteTakingScore !== undefined && scoresData.noteTakingScore !== null ? scoresData.noteTakingScore : '',
      assignmentScore: scoresData.assignmentScore !== undefined && scoresData.assignmentScore !== null ? scoresData.assignmentScore : '',
      examScore: scoresData.examScore !== undefined && scoresData.examScore !== null ? scoresData.examScore : '',
      status: score.status || 'draft'
    });

    setEditDialog({
      open: true,
      score: score,
      loading: false
    });
  };

  const handleCloseEditDialog = () => {
    if (editDialog.loading) return; // Prevent closing while saving
    setEditDialog({
      open: false,
      score: null,
      loading: false
    });
    setEditForm({
      testScore: '',
      noteTakingScore: '',
      assignmentScore: '',
      examScore: '',
      status: 'draft'
    });
  };

  const handleEditFormChange = (field, value) => {
    // Validate numeric fields
    if (['testScore', 'noteTakingScore', 'assignmentScore', 'examScore'].includes(field)) {
      if (value === '' || value === null || value === undefined) {
        setEditForm(prev => ({ ...prev, [field]: '' }));
        return;
      }
      const num = Number(value);
      if (!isNaN(num) && num >= 0) {
        setEditForm(prev => ({ ...prev, [field]: num }));
      }
    } else {
      setEditForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSaveEdit = async () => {
    if (!editDialog.score) return;

    // ✅ _id from /admin/ca/all — same record the update endpoint targets
    const scoreId = getRecordId(editDialog.score);
    if (!scoreId) {
      setError('Invalid score record: No ID found');
      return;
    }

    // Validate scores
    const testScore = editForm.testScore === '' ? null : Number(editForm.testScore);
    const noteTakingScore = editForm.noteTakingScore === '' ? null : Number(editForm.noteTakingScore);
    const assignmentScore = editForm.assignmentScore === '' ? null : Number(editForm.assignmentScore);
    const examScore = editForm.examScore === '' ? null : Number(editForm.examScore);

    // Range validation
    if (testScore !== null && (testScore < 0 || testScore > 20)) {
      setError('Test score must be between 0 and 20');
      return;
    }
    if (noteTakingScore !== null && (noteTakingScore < 0 || noteTakingScore > 10)) {
      setError('Note taking score must be between 0 and 10');
      return;
    }
    if (assignmentScore !== null && (assignmentScore < 0 || assignmentScore > 10)) {
      setError('Assignment score must be between 0 and 10');
      return;
    }
    if (examScore !== null && (examScore < 0 || examScore > 60)) {
      setError('Exam score must be between 0 and 60');
      return;
    }

    setEditDialog(prev => ({ ...prev, loading: true }));
    setError(null);

    try {
      // ✅ PUT /admin/ca/:id — backend recalculates totalCA, totalScore and grade
      const updateData = {
        status: editForm.status
      };

      // Only include score fields that have values
      if (testScore !== null) updateData.testScore = testScore;
      if (noteTakingScore !== null) updateData.noteTakingScore = noteTakingScore;
      if (assignmentScore !== null) updateData.assignmentScore = assignmentScore;
      if (examScore !== null) updateData.examScore = examScore;

      console.log('🔍 DEBUG [handleSaveEdit] PUT /admin/ca/' + scoreId, updateData);

      const response = await continuousAssessmentsAPI.update(scoreId, updateData);

      console.log('🔍 DEBUG [handleSaveEdit] response:', response);

      if (response.success) {
        setSuccess(response.message || 'Score updated successfully');
        handleCloseEditDialog();
        fetchScores(); // Refresh the data
      } else {
        setError(response.message || 'Failed to update score');
      }
    } catch (err) {
      console.error('🔍 DEBUG [handleSaveEdit] error:', err.response?.status, err.response?.data);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update score';
      setError(errorMsg);
    } finally {
      setEditDialog(prev => ({ ...prev, loading: false }));
    }
  };

  // ============================================
  // DELETE SCORE HANDLERS
  // ============================================
  const handleOpenDeleteDialog = (score) => {
    setDeleteDialog({
      open: true,
      score: score,
      loading: false
    });
  };

  const handleCloseDeleteDialog = () => {
    if (deleteDialog.loading) return; // Prevent closing while deleting
    setDeleteDialog({
      open: false,
      score: null,
      loading: false
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.score) return;

    const scoreId = getRecordId(deleteDialog.score);
    if (!scoreId) {
      setError('Invalid score record: No ID found');
      return;
    }

    setDeleteDialog(prev => ({ ...prev, loading: true }));
    setError(null);

    try {
      // ⚠️ NOTE: studentsClassesScoresAPI.delete may point at a missing route.
      // If this returns "Route not found", switch to a DELETE /admin/ca/:id endpoint.
      const response = await studentsClassesScoresAPI.delete(scoreId);

      if (response.success) {
        setSuccess(response.message || 'Score deleted successfully');
        handleCloseDeleteDialog();

        // Remove from selectedIds if present
        setSelectedIds(prev => prev.filter(id => id !== scoreId));

        fetchScores(); // Refresh the data
      } else {
        setError(response.message || 'Failed to delete score');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete score';
      setError(errorMsg);
    } finally {
      setDeleteDialog(prev => ({ ...prev, loading: false }));
    }
  };

  // ============================================
  // BULK DELETE HANDLERS
  // ============================================
  const handleOpenBulkDeleteDialog = () => {
    if (selectedIds.length === 0) return;
    setBulkDeleteDialog({
      open: true,
      loading: false
    });
  };

  const handleCloseBulkDeleteDialog = () => {
    if (bulkDeleteDialog.loading) return;
    setBulkDeleteDialog({
      open: false,
      loading: false
    });
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    setBulkDeleteDialog(prev => ({ ...prev, loading: true }));
    setError(null);

    try {
      const response = await studentsClassesScoresAPI.bulkDelete(selectedIds);

      if (response.success) {
        const deletedCount = response.data?.summary?.deleted || selectedIds.length;
        setSuccess(deletedCount + ' score record(s) deleted successfully');
        handleCloseBulkDeleteDialog();
        setSelectedIds([]);
        fetchScores(); // Refresh the data
      } else {
        setError(response.message || 'Failed to delete scores');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete scores';
      setError(errorMsg);
    } finally {
      setBulkDeleteDialog(prev => ({ ...prev, loading: false }));
    }
  };

  // ============================================
  // BULK EDIT HANDLER (Opens edit dialog in bulk mode)
  // ============================================
  const handleOpenBulkEditDialog = () => {
    if (selectedIds.length === 0) return;
    // For now, show a message that bulk edit opens the first selected item
    // You can extend this to have a separate bulk edit dialog
    const firstSelectedScore = scores.find(s => getRecordId(s) === selectedIds[0]);
    if (firstSelectedScore) {
      handleOpenEditDialog(firstSelectedScore);
    }
  };

  // --- Fetch Scores ---
  // ✅ FIXED: switched from studentsClassesScoresAPI.getAll (rows had NO primary key)
  // to adminCAAPI.getAssessments (/admin/ca/all) which returns _id + flat display
  // fields — the SAME records the approve/update endpoints operate on.
  const fetchScores = useCallback(async (customFilters) => {
    setLoading(true);
    setError(null);

    try {
      const currentFilters = customFilters || filters;
      const params = {
        page: pagination.page + 1,
        limit: pagination.limit
      };

      if (currentFilters.termId) params.termId = currentFilters.termId;
      if (currentFilters.sessionId) params.sessionId = currentFilters.sessionId;
      if (currentFilters.classId) params.classId = currentFilters.classId;
      if (currentFilters.subjectId) params.subjectId = currentFilters.subjectId;
      if (currentFilters.status && currentFilters.status !== 'all') {
        params.status = currentFilters.status;
      }
      if (currentFilters.search) params.search = currentFilters.search;

      const response = await adminCAAPI.getAssessments(params);

      console.log('🔍 DEBUG [fetchScores] response:', response);

      const rows = Array.isArray(response?.data) ? response.data : [];

      setScores(rows);
      setPagination(prev => ({ ...prev, total: response?.total ?? rows.length }));

      // Build summary (status breakdown) from byStatus
      const byStatus = response?.summary?.byStatus || [];
      const breakdown = {};
      byStatus.forEach(b => { breakdown[b.status] = b.count; });
      setSummary({
        totalRecords: response?.total ?? rows.length,
        statusBreakdown: breakdown,
      });

      // 🔍 DEBUG — REMOVE once confirmed working
      console.log('🔍 DEBUG [fetchScores] sample record:', rows[0]);
      if (rows[0]) {
        console.log('🔍 DEBUG [fetchScores] record keys:', Object.keys(rows[0]));
        console.log('🔍 DEBUG [fetchScores] _id:', rows[0]._id, '| studentName:', rows[0].studentName);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch scores';
      setError(errorMsg);
      setScores([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  // --- Handlers ---
  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, page: 0 }));
    setTimeout(() => fetchScores({ ...filters }), 0);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      termId: '',
      sessionId: '',
      classId: '',
      subjectId: '',
      status: 'all',
      search: ''
    };
    setFilters(clearedFilters);
    setPagination(prev => ({ ...prev, page: 0 }));
    setTimeout(() => fetchScores(clearedFilters), 0);
  };

  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event) => {
    setPagination(prev => ({
      ...prev,
      limit: parseInt(event.target.value, 10),
      page: 0
    }));
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleSelect = (id) => {
    if (id == null) return; // skip non-actionable rows
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allIds = scores.map(getRecordId).filter(Boolean);
    if (selectedIds.length === allIds.length && allIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allIds);
    }
  };

  // --- Fetch Initial Data ---
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [termsRes, sessionsRes, classesRes, subjectsRes] = await Promise.all([
          termsAPI.getAll(),
          sessionsAPI.getAll(),
          classesAPI.getAll(),
          subjectsAPI.getAll()
        ]);

        const extractArray = (res) => {
          if (Array.isArray(res)) return res;
          if (res && res.data && res.data.data && Array.isArray(res.data.data)) return res.data.data;
          if (res && res.data && Array.isArray(res.data)) return res.data;
          if (res && res.success && res.data && Array.isArray(res.data)) return res.data;
          return [];
        };

        setTerms(extractArray(termsRes));
        setSessions(extractArray(sessionsRes));
        setClasses(extractArray(classesRes));
        setSubjects(extractArray(subjectsRes));
      } catch (err) {
        setError('Failed to load initial data: ' + (err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // --- Fetch Scores When Pagination Changes ---
  useEffect(() => {
    const hasFilter = Object.values(filters).some(v => v && v !== 'all');
    if (hasFilter || pagination.page > 0) {
      fetchScores();
    }
  }, [pagination.page, pagination.limit]);

  // ============================================
  // CALCULATE PREVIEW TOTALS FOR EDIT DIALOG
  // ============================================
  const getEditPreviewTotals = () => {
    const testScore = editForm.testScore === '' ? 0 : Number(editForm.testScore) || 0;
    const noteTakingScore = editForm.noteTakingScore === '' ? 0 : Number(editForm.noteTakingScore) || 0;
    const assignmentScore = editForm.assignmentScore === '' ? 0 : Number(editForm.assignmentScore) || 0;
    const examScore = editForm.examScore === '' ? 0 : Number(editForm.examScore) || 0;
    
    const totalCA = testScore + noteTakingScore + assignmentScore;
    const totalScore = totalCA + examScore;
    
    return { totalCA, totalScore };
  };

  return (
    <Container maxWidth="xl" sx={{ p: { xs: 1, md: 2 }, mt: 2 }}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Students Classes and Scores
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              icon={<GetAppIcon />}
              label="Admin View"
              color={userRole === 'admin' ? 'primary' : 'default'}
              variant="outlined"
              size="small"
            />
            <Chip
              icon={<SchoolIcon />}
              label="Teacher View"
              color={userRole === 'teacher' ? 'primary' : 'default'}
              variant="outlined"
              size="small"
            />
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={40} />
          </Box>
        )}

        {!loading && (
          <React.Fragment>
            {/* Filters Section */}
            <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <FilterListIcon color="primary" />
                <Typography variant="h6">Filters</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Term</InputLabel>
                    <Select
                      value={filters.termId}
                      label="Term"
                      onChange={(e) => handleFilterChange('termId', e.target.value)}
                    >
                      <MenuItem value="">
                        <em>All Terms</em>
                      </MenuItem>
                      {terms.map(term => (
                        <MenuItem key={term._id || term.id} value={term._id || term.id}>
                          {term.name || term.termName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Session</InputLabel>
                    <Select
                      value={filters.sessionId}
                      label="Session"
                      onChange={(e) => handleFilterChange('sessionId', e.target.value)}
                    >
                      <MenuItem value="">
                        <em>All Sessions</em>
                      </MenuItem>
                      {sessions.map(session => (
                        <MenuItem key={session._id || session.id} value={session._id || session.id}>
                          {session.name || session.sessionName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Class</InputLabel>
                    <Select
                      value={filters.classId}
                      label="Class"
                      onChange={(e) => handleFilterChange('classId', e.target.value)}
                    >
                      <MenuItem value="">
                        <em>All Classes</em>
                      </MenuItem>
                      {classes.map(cls => {
                        const id = cls._id || cls.id;
                        const displayName = getClassDisplayName(cls);
                        return (
                          <MenuItem key={id} value={id}>
                            {displayName}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Subject</InputLabel>
                    <Select
                      value={filters.subjectId}
                      label="Subject"
                      onChange={(e) => handleFilterChange('subjectId', e.target.value)}
                    >
                      <MenuItem value="">
                        <em>All Subjects</em>
                      </MenuItem>
                      {subjects.map(sub => {
                        const id = sub._id || sub.id;
                        const displayName = getSubjectDisplayName(sub);
                        return (
                          <MenuItem key={id} value={id}>
                            {displayName}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={4} lg={2.4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.status}
                      label="Status"
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <MenuItem value="all">All Statuses</MenuItem>
                      <MenuItem value="draft">Draft</MenuItem>
                      <MenuItem value="submitted">Submitted</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by student name or admission number..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilters(); }}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      endAdornment: filters.search ? (
                        <IconButton
                          size="small"
                          onClick={() => handleFilterChange('search', '')}
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      ) : null
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {/* ✅ Approve all matching filters (admin + status=submitted only) */}
                    {canApprove && filters.status === 'submitted' && (
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={bulkApproving ? <CircularProgress size={16} color="inherit" /> : <VerifiedIcon />}
                        disabled={bulkApproving}
                        onClick={handleApproveAllFiltered}
                      >
                        Approve All Matching
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<FilterListIcon />}
                      onClick={handleApplyFilters}
                    >
                      Apply Filters
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={handleClearFilters}
                    >
                      Clear
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Summary Stats Cards */}
            {summary && (
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={4} md={2.4}>
                  <Card sx={{ bgcolor: '#e3f2fd', height: '100%' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="h4" sx={{ color: '#1976d2' }}>
                        {summary.totalRecords || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Records
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={4} md={2.4}>
                  <Card sx={{ bgcolor: '#e8f5e9', height: '100%' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="h4" sx={{ color: '#2e7d32' }}>
                        {summary.scoredRecords || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        With Scores
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={4} md={2.4}>
                  <Card sx={{ bgcolor: '#f3e5f5', height: '100%' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="h4" sx={{ color: '#7b1fa2' }}>
                        {summary.averageScore ? summary.averageScore.toFixed(1) : '0.0'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Average Score
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={4} md={2.4}>
                  <Card sx={{ bgcolor: '#e8f5e9', height: '100%' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="h4" sx={{ color: '#2e7d32' }}>
                        {summary.highestScore || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Highest Score
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={4} md={2.4}>
                  <Card sx={{ bgcolor: '#ffebee', height: '100%' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="h4" sx={{ color: '#c62828' }}>
                        {summary.lowestScore || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Lowest Score
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* Status Breakdown Chips */}
            {summary && summary.statusBreakdown && (
              <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={'Draft: ' + (summary.statusBreakdown.draft || 0)}
                  sx={{ backgroundColor: '#e0e0e0' }}
                />
                <Chip
                  label={'Submitted: ' + (summary.statusBreakdown.submitted || 0)}
                  sx={{ backgroundColor: '#fff3e0' }}
                />
                <Chip
                  label={'Approved: ' + (summary.statusBreakdown.approved || 0)}
                  sx={{ backgroundColor: '#e8f5e9' }}
                />
              </Box>
            )}

            {/* Table Tabs */}
            <Paper elevation={2}>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
              >
                <Tab label="Score Records" icon={<AssessmentIcon />} iconPosition="start" />
                <Tab label="Summary" icon={<BarChartIcon />} iconPosition="start" />
              </Tabs>

              {/* Table View */}
              {activeTab === 'table' && (
                <React.Fragment>
                  <TableContainer sx={{ maxHeight: 600 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox">
                            <Checkbox
                              indeterminate={selectedIds.length > 0 && selectedIds.length < scores.filter(isRecordActionable).length}
                              checked={scores.filter(isRecordActionable).length > 0 && selectedIds.length === scores.filter(isRecordActionable).length}
                              onChange={handleSelectAll}
                            />
                          </TableCell>
                          <TableCell>#</TableCell>
                          <TableCell>Student</TableCell>
                          <TableCell>Class</TableCell>
                          <TableCell>Subject</TableCell>
                          <TableCell align="center">Test /20</TableCell>
                          <TableCell align="center">Notes /10</TableCell>
                          <TableCell align="center">Assign /10</TableCell>
                          <TableCell align="center">Total CA /40</TableCell>
                          <TableCell align="center">Exam /60</TableCell>
                          <TableCell align="center">Total /100</TableCell>
                          <TableCell align="center">Grade</TableCell>
                          <TableCell align="center">Status</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {scores.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={14} align="center" sx={{ py: 8 }}>
                              <Typography variant="body1" color="text.secondary">
                                No records found. Apply filters to load data.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          scores.map((score, index) => {
                            // ✅ _id always present from /admin/ca/all
                            const scoreId = getRecordId(score);
                            const actionable = scoreId != null;
                            const isSelected = scoreId != null && selectedIds.includes(scoreId);
                            // ✅ rows are FLAT — scoresData falls back to the row itself
                            const scoresData = score.scores || score;
                            const totalCA = calculateTotalCA(scoresData);

                            return (
                              <TableRow
                                key={scoreId || `row-${index}`}
                                hover
                                selected={isSelected}
                                sx={score.status === 'approved' ? { borderLeft: '4px solid #4caf50' } : {}}
                              >
                                <TableCell padding="checkbox">
                                  <Checkbox
                                    checked={isSelected}
                                    disabled={!actionable}
                                    onChange={() => handleToggleSelect(scoreId)}
                                  />
                                </TableCell>
                                <TableCell>
                                  {pagination.page * pagination.limit + index + 1}
                                </TableCell>
                                {/* ✅ FIXED: flat fields from /admin/ca/all */}
                                <TableCell>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {score.studentName || getStudentDisplayName(score.student) || 'Unknown Student'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {score.admissionNumber || (score.student ? (score.student.admissionNumber || score.student.admission_number || '') : '')}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {score.className || getClassDisplayName(score.class)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {score.subjectName || getSubjectDisplayName(score.subject)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                                    {scoresData.testScore !== undefined && scoresData.testScore !== null ? scoresData.testScore : '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2">
                                    {scoresData.noteTakingScore !== undefined && scoresData.noteTakingScore !== null ? scoresData.noteTakingScore : '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2">
                                    {scoresData.assignmentScore !== undefined && scoresData.assignmentScore !== null ? scoresData.assignmentScore : '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {totalCA !== null ? totalCA : '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                                    {scoresData.examScore !== undefined && scoresData.examScore !== null ? scoresData.examScore : '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                                    {scoresData.totalScore !== undefined && scoresData.totalScore !== null ? scoresData.totalScore : '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Box component="span" sx={{ color: getGradeColor(score.grade), fontWeight: 700, fontSize: '1rem' }}>
                                    {score.grade || '-'}
                                  </Box>
                                </TableCell>
                                <TableCell align="center">
                                  <Chip
                                    label={getStatusLabel(score.status)}
                                    size="small"
                                    sx={{ backgroundColor: getStatusColor(score.status), fontWeight: 500, fontSize: '0.7rem' }}
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                    {/* ✅ Approve / Unapprove (admin only) */}
                                    {canApprove && (
                                      score.status === 'approved' ? (
                                        <Tooltip title="Unapprove (back to Submitted)">
                                          <span>
                                            <IconButton
                                              size="small"
                                              color="warning"
                                              disabled={approvingId === scoreId || bulkApproving}
                                              onClick={() => handleUnapprove(score)}
                                            >
                                              {approvingId === scoreId
                                                ? <CircularProgress size={18} />
                                                : <UndoIcon fontSize="small" />}
                                            </IconButton>
                                          </span>
                                        </Tooltip>
                                      ) : (
                                        <Tooltip title="Approve assessment">
                                          <span>
                                            <IconButton
                                              size="small"
                                              color="success"
                                              disabled={approvingId === scoreId || bulkApproving}
                                              onClick={() => handleApprove(score)}
                                            >
                                              {approvingId === scoreId
                                                ? <CircularProgress size={18} />
                                                : <CheckCircleIcon fontSize="small" />}
                                            </IconButton>
                                          </span>
                                        </Tooltip>
                                      )
                                    )}
                                    <Tooltip title="Edit score">
                                      <IconButton 
                                        size="small" 
                                        color="primary" 
                                        onClick={() => handleOpenEditDialog(score)}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete score">
                                      <IconButton 
                                        size="small" 
                                        color="error" 
                                        onClick={() => handleOpenDeleteDialog(score)}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <TablePagination
                    component="div"
                    count={pagination.total}
                    page={pagination.page}
                    rowsPerPage={pagination.limit}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                  />
                </React.Fragment>
              )}

              {/* Summary View */}
              {activeTab === 'summary' && (
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Score Summary
                  </Typography>
                  {summary ? (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Card>
                          <CardContent>
                            <Typography variant="h3">{summary.totalRecords || 0}</Typography>
                            <Typography variant="body2" color="text.secondary">Total Records</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Card>
                          <CardContent>
                            <Typography variant="h3" sx={{ color: '#2e7d32' }}>
                              {summary.averageScore ? summary.averageScore.toFixed(1) : '0.0'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">Average Score</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Card>
                          <CardContent>
                            <Typography variant="h3" sx={{ color: '#1976d2' }}>
                              {summary.highestScore || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">Highest Score</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Card>
                          <CardContent>
                            <Typography variant="h3" sx={{ color: '#c62828' }}>
                              {summary.lowestScore || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">Lowest Score</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  ) : (
                    <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                      Apply filters to see summary statistics.
                    </Typography>
                  )}
                </Box>
              )}
            </Paper>

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
              <Paper elevation={4} sx={{ position: 'sticky', bottom: 0, zIndex: 100, borderRadius: 0, mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, px: 2, flexWrap: 'wrap' }}>
                  <Typography variant="body2">
                    {selectedIds.length} record{selectedIds.length !== 1 ? 's' : ''} selected
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, ml: 'auto', flexWrap: 'wrap' }}>
                    {/* ✅ Bulk approve / unapprove (admin only) */}
                    {canApprove && (
                      <>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={bulkApproving ? <CircularProgress size={16} color="inherit" /> : <VerifiedIcon />}
                          disabled={bulkApproving}
                          onClick={handleBulkApproveSelected}
                        >
                          Approve Selected
                        </Button>
                        <Button
                          variant="outlined"
                          color="warning"
                          size="small"
                          startIcon={<UndoIcon />}
                          disabled={bulkApproving}
                          onClick={handleBulkUnapproveSelected}
                        >
                          Unapprove Selected
                        </Button>
                      </>
                    )}
                    <Button 
                      variant="contained" 
                      color="primary" 
                      size="small" 
                      startIcon={<EditIcon />} 
                      onClick={handleOpenBulkEditDialog}
                    >
                      Bulk Edit
                    </Button>
                    <Button 
                      variant="contained" 
                      color="error" 
                      size="small" 
                      startIcon={<DeleteSweepIcon />} 
                      onClick={handleOpenBulkDeleteDialog}
                    >
                      Bulk Delete
                    </Button>
                  </Box>
                </Box>
              </Paper>
            )}
          </React.Fragment>
        )}
      </Paper>

      {/* ============================================ */}
      {/* EDIT DIALOG */}
      {/* ============================================ */}
      <Dialog 
        open={editDialog.open} 
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown={editDialog.loading}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon color="primary" />
          Edit Score
        </DialogTitle>
        <DialogContent dividers>
          {editDialog.score && (
            <Box>
              {/* Student Info Display */}
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">Student</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {/* ✅ flat field first, nested fallback */}
                  {editDialog.score.studentName || getStudentDisplayName(editDialog.score.student)}
                </Typography>
                {(editDialog.score.admissionNumber || editDialog.score.student?.admissionNumber) && (
                  <Typography variant="body2" color="text.secondary">
                    Admission No: {editDialog.score.admissionNumber || editDialog.score.student.admissionNumber}
                  </Typography>
                )}
              </Box>

              <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">Subject & Class</Typography>
                <Typography variant="body1">
                  {/* ✅ flat fields first, nested fallbacks */}
                  {editDialog.score.subjectName || getSubjectDisplayName(editDialog.score.subject)}
                  {' - '}
                  {editDialog.score.className || getClassDisplayName(editDialog.score.class)}
                </Typography>
              </Box>

              {/* Score Input Fields */}
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    label="Test Score"
                    type="number"
                    size="small"
                    value={editForm.testScore}
                    onChange={(e) => handleEditFormChange('testScore', e.target.value)}
                    inputProps={{ min: 0, max: 20, step: 0.5 }}
                    helperText="Max: 20"
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    label="Notes Score"
                    type="number"
                    size="small"
                    value={editForm.noteTakingScore}
                    onChange={(e) => handleEditFormChange('noteTakingScore', e.target.value)}
                    inputProps={{ min: 0, max: 10, step: 0.5 }}
                    helperText="Max: 10"
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    label="Assignment"
                    type="number"
                    size="small"
                    value={editForm.assignmentScore}
                    onChange={(e) => handleEditFormChange('assignmentScore', e.target.value)}
                    inputProps={{ min: 0, max: 10, step: 0.5 }}
                    helperText="Max: 10"
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    label="Exam Score"
                    type="number"
                    size="small"
                    value={editForm.examScore}
                    onChange={(e) => handleEditFormChange('examScore', e.target.value)}
                    inputProps={{ min: 0, max: 60, step: 0.5 }}
                    helperText="Max: 60"
                  />
                </Grid>
              </Grid>

              {/* Preview Totals */}
              <Box sx={{ mt: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Total CA (out of 40)</Typography>
                    <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 700 }}>
                      {getEditPreviewTotals().totalCA}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Total Score (out of 100)</Typography>
                    <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 700 }}>
                      {getEditPreviewTotals().totalScore}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Status */}
              <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editForm.status}
                  label="Status"
                  onChange={(e) => handleEditFormChange('status', e.target.value)}
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="submitted">Submitted</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={editDialog.loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={editDialog.loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={handleSaveEdit}
            disabled={editDialog.loading}
          >
            {editDialog.loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================ */}
      {/* DELETE DIALOG */}
      {/* ============================================ */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
        disableEscapeKeyDown={deleteDialog.loading}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon color="error" />
          Delete Score
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this score record?
          </DialogContentText>
          {deleteDialog.score && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {deleteDialog.score.studentName || getStudentDisplayName(deleteDialog.score.student)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {deleteDialog.score.subjectName || getSubjectDisplayName(deleteDialog.score.subject)}
                {' - '}
                {deleteDialog.score.className || getClassDisplayName(deleteDialog.score.class)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={deleteDialog.loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={deleteDialog.loading ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
            onClick={handleConfirmDelete}
            disabled={deleteDialog.loading}
          >
            {deleteDialog.loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================ */}
      {/* BULK DELETE DIALOG */}
      {/* ============================================ */}
      <Dialog
        open={bulkDeleteDialog.open}
        onClose={handleCloseBulkDeleteDialog}
        maxWidth="xs"
        fullWidth
        disableEscapeKeyDown={bulkDeleteDialog.loading}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon color="error" />
          Bulk Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{selectedIds.length}</strong> score record(s)?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBulkDeleteDialog} disabled={bulkDeleteDialog.loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={bulkDeleteDialog.loading ? <CircularProgress size={16} color="inherit" /> : <DeleteSweepIcon />}
            onClick={handleConfirmBulkDelete}
            disabled={bulkDeleteDialog.loading}
          >
            {bulkDeleteDialog.loading ? 'Deleting...' : 'Delete ' + selectedIds.length + ' Record(s)'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudentsClassesScoresPage;