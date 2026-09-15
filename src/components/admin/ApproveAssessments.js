import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { adminCAAPI, termsAPI, sessionsAPI, classesAPI, subjectsAPI } from '../../api';

const getGradeColor = (grade) => {
    const g = (grade || '').toUpperCase().trim();
    if (g === 'A' || g === 'A+' || g === 'A-') return '#059669';
    if (g === 'B' || g === 'B+' || g === 'B-') return '#0891b2';
    if (g === 'C' || g === 'C+' || g === 'C-') return '#d97706';
    if (g === 'D' || g === 'D+' || g === 'D-') return '#ea580c';
    return '#dc2626';
};

const getGradeBg = (grade) => {
    const g = (grade || '').toUpperCase().trim();
    if (g === 'A' || g === 'A+' || g === 'A-') return '#ecfdf5';
    if (g === 'B' || g === 'B+' || g === 'B-') return '#ecfeff';
    if (g === 'C' || g === 'C+' || g === 'C-') return '#fffbeb';
    if (g === 'D' || g === 'D+' || g === 'D-') return '#fff7ed';
    return '#fef2f2';
};

const getStatusMeta = (s) => {
    const map = {
        submitted: { label: 'Submitted', color: '#d97706', bg: '#fffbeb', dot: '#fbbf24', borderColor: '#fde68a' },
        draft:     { label: 'Draft',     color: '#64748b', bg: '#f8fafc', dot: '#94a3b8', borderColor: '#e2e8f0' },
        approved:  { label: 'Approved',  color: '#059669', bg: '#ecfdf5', dot: '#34d399', borderColor: '#a7f3d0' }
    };
    return map[s] || map.draft;
};

const extractDataArray = (response) => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (response.success && Array.isArray(response.data)) return response.data;
    if (response.success && response.data?.data && Array.isArray(response.data.data)) return response.data.data;
    if (response.success && response.data?.items && Array.isArray(response.data.items)) return response.data.items;
    if (response.success && response.data?.assessments && Array.isArray(response.data.assessments)) return response.data.assessments;
    if (!response.success && Array.isArray(response.data)) return response.data;
    return [];
};

const normalizeFilterOptions = (response) => {
    if (!response?.success || !response.data) return null;
    const d = response.data;
    const terms = Array.isArray(d.terms) ? d.terms : [];
    const sessions = Array.isArray(d.sessions) ? d.sessions : [];
    const classes = Array.isArray(d.classes) ? d.classes : (Array.isArray(d.classesData) ? d.classesData : []);
    const subjects = Array.isArray(d.subjects) ? d.subjects : [];
    const nested = d.data || {};
    const nestedTerms = Array.isArray(nested.terms) ? nested.terms : [];
    const nestedSessions = Array.isArray(nested.sessions) ? nested.sessions : [];
    const nestedClasses = Array.isArray(nested.classes) ? nested.classes : (Array.isArray(nested.classesData) ? nested.classesData : []);
    const nestedSubjects = Array.isArray(nested.subjects) ? nested.subjects : [];
    const deepNested = nested.data || {};
    const deepTerms = Array.isArray(deepNested.terms) ? deepNested.terms : [];
    const deepSessions = Array.isArray(deepNested.sessions) ? deepNested.sessions : [];
    const deepClasses = Array.isArray(deepNested.classes) ? deepNested.classes : (Array.isArray(deepNested.classesData) ? deepNested.classesData : []);
    const deepSubjects = Array.isArray(deepNested.subjects) ? deepNested.subjects : [];
    const pickLongest = (...arrays) => arrays.reduce((a, b) => b.length > a.length ? b : a, []);
    return {
        terms: pickLongest(terms, nestedTerms, deepTerms),
        sessions: pickLongest(sessions, nestedSessions, deepSessions),
        classes: pickLongest(classes, nestedClasses, deepClasses),
        subjects: pickLongest(subjects, nestedSubjects, deepSubjects),
    };
};

const toOption = (item) => {
    if (!item) return null;
    const id = item._id || item.value || item.id || item.termId || item.sessionId || item.classId || item.subjectId;
    const name = item.name || item.label || item.className || item.subjectName || item.termName || item.sessionName || `${id}`;
    if (!id) return null;
    return { _id: id, name, ...item };
};

// Page size options
const PAGE_SIZE_OPTIONS = [10, 20, 50];

// ── Small inline icons ──
const IconCheck = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const IconUndo = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
);
const IconX = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
const IconChevron = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);
const IconUsers = () => (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const IconAlert = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
);

const ExcludeCheckbox = React.memo(({ checked, indeterminate, onChange }) => (
    <div
        className={`aa-exclude-cb ${checked && !indeterminate ? 'aa-exclude-cb--checked' : ''} ${indeterminate ? 'aa-exclude-cb--indeterminate' : ''}`}
        onClick={onChange}
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(); } }}
    >
        {(checked || indeterminate) && (
            indeterminate ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            )
        )}
    </div>
));
ExcludeCheckbox.displayName = 'ExcludeCheckbox';

const ApproveAssessments = () => {
    const [assessments, setAssessments]                   = useState([]);
    const [termId, setTermId]                             = useState('');
    const [sessionId, setSessionId]                       = useState('');
    const [classId, setClassId]                           = useState('');
    const [subjectId, setSubjectId]                       = useState('');
    const [status, setStatus]                             = useState('submitted');
    const [terms, setTerms]                               = useState([]);
    const [sessions, setSessions]                         = useState([]);
    const [classes, setClasses]                           = useState([]);
    const [subjects, setSubjects]                         = useState([]);
    const [loading, setLoading]                           = useState(false);
    const [subjectsLoading, setSubjectsLoading]           = useState(false);
    const [bulkLoading, setBulkLoading]                   = useState(false);
    const [bulkProgress, setBulkProgress]                 = useState({ current: 0, total: 0, phase: '' });
    const [confirmBulk, setConfirmBulk]                   = useState(false);
    const [confirmBulkUnapprove, setConfirmBulkUnapprove] = useState(false);
    const [success, setSuccess]                           = useState('');
    const [error, setError]                               = useState('');
    const [unapprovingId, setUnapprovingId]               = useState(null);
    const [excludedIds, setExcludedIds]                   = useState(new Set());
    const [totalResults, setTotalResults]                 = useState(0);

    // PAGINATION STATE
    const [currentPage, setCurrentPage]                   = useState(1);
    const [pageSize, setPageSize]                         = useState(20);

    const [approvedSummary, setApprovedSummary]           = useState(null);
    const [bulkApproveResult, setBulkApproveResult]       = useState(null);

    const [showClearPanel, setShowClearPanel]             = useState(false);
    const [clearClasses, setClearClasses]                 = useState([]);
    const [clearSubjects, setClearSubjects]               = useState([]);
    const [clearClassId, setClearClassId]                 = useState('');
    const [clearSubjectId, setClearSubjectId]             = useState('');
    const [clearLoading, setClearLoading]                 = useState(false);
    const [clearSuccess, setClearSuccess]                 = useState('');
    const [clearError, setClearError]                     = useState('');
    const [clearClassesLoading, setClearClassesLoading]   = useState(false);
    const [clearSubjectsLoading, setClearSubjectsLoading] = useState(false);
    const [clearInfo, setClearInfo]                       = useState(null);
    const [clearProgress, setClearProgress]               = useState({ current: 0, total: 0, phase: '' });
    const [clearPreview, setClearPreview]                 = useState(null);
    const [clearPreviewLoading, setClearPreviewLoading]   = useState(false);
    const [clearExcludedStudents, setClearExcludedStudents] = useState(new Set());
    const [clearConfirmAction, setClearConfirmAction]     = useState(null);
    const [previewExpanded, setPreviewExpanded]           = useState(true);
    const [clearPreviewAssessmentIds, setClearPreviewAssessmentIds] = useState([]);
    const [filterOptionsLoading, setFilterOptionsLoading] = useState(false);
    const filterOptionsSourceRef = useRef(null);

    const abortRef         = useRef(null);
    const debounceRef      = useRef(null);
    const initialDoneRef   = useRef(false);
    const fetchRef         = useRef(null);
    const subjectsCacheRef = useRef({});

    const isAllExcluded  = assessments.length > 0 && excludedIds.size === assessments.length;
    const isSomeExcluded = excludedIds.size > 0 && !isAllExcluded;

    // Total pages derived from totalResults and pageSize
    const totalPages = useMemo(() => {
        if (totalResults <= 0) return 1;
        return Math.ceil(totalResults / pageSize);
    }, [totalResults, pageSize]);

    // For submitted tab: use effectivePendingCount from visible list
    const effectivePendingCount  = Math.max(0, (status === 'submitted' ? assessments.length : 0) - excludedIds.size);
    const effectiveApprovedCount = Math.max(0, (status === 'approved' ? assessments.length : 0) - excludedIds.size);

    const activeTermName = terms.find(t => t._id === termId)?.name || '';
    const activeSessionName = sessions.find(s => s._id === sessionId)?.name || '';
    const isCrossTermApproved = status === 'approved' && approvedSummary?.byTerm?.length > 1;
    const canUseFilterApprove = status === 'submitted' && (termId || sessionId || classId || subjectId);

    const toggleExclude = useCallback((id) => {
        setExcludedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const toggleExcludeAll = useCallback(() => {
        setExcludedIds(prev => {
            if (prev.size === assessments.length) return new Set();
            return new Set(assessments.map(a => a._id));
        });
    }, [assessments]);

    const clearExclusions = useCallback(() => setExcludedIds(new Set()), []);

    useEffect(() => {
        if (!success && !error && !clearSuccess) return;
        const t = setTimeout(() => { setSuccess(''); setError(''); setClearSuccess(''); setBulkApproveResult(null); }, 6000);
        return () => clearTimeout(t);
    }, [success, error, clearSuccess]);

    // Reset to page 1 when filters or status change
    useEffect(() => {
        if (!initialDoneRef.current) return;
        setCurrentPage(1);
    }, [termId, sessionId, classId, subjectId, status, pageSize]);

    const fetchSubjectsForClass = useCallback(async (cId) => {
        if (subjectsCacheRef.current[cId]) {
            setSubjects(subjectsCacheRef.current[cId]);
            return;
        }
        setSubjectsLoading(true);
        try {
            const res = await subjectsAPI.getByClass(cId);
            if (res.success && Array.isArray(res.data)) {
                subjectsCacheRef.current[cId] = res.data;
                setSubjects(res.data);
            } else {
                setSubjects([]);
            }
        } catch (err) {
            console.error('Failed to fetch subjects for class:', err);
            setSubjects([]);
        } finally {
            setSubjectsLoading(false);
        }
    }, []);

    const scheduleFetch = useCallback(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchRef.current?.(), 250);
    }, []);

    useEffect(() => {
        if (!initialDoneRef.current) return;
        setExcludedIds(new Set());
        setBulkApproveResult(null);
        scheduleFetch();
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [termId, sessionId, classId, subjectId, status, currentPage, pageSize, scheduleFetch]);

    useEffect(() => {
        if (!initialDoneRef.current) return;
        setSubjectId('');
        if (!classId) {
            setSubjects([]);
            subjectsCacheRef.current = {};
        } else {
            fetchSubjectsForClass(classId);
        }
    }, [classId, fetchSubjectsForClass]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                let usedFilterOptions = false;
                let normalizedFilterOptions = null;

                try {
                    setFilterOptionsLoading(true);
                    const filterRes = await adminCAAPI.getFilterOptions({ status });
                    if (filterRes?.success) {
                        const normalized = normalizeFilterOptions(filterRes);
                        if (normalized) {
                            usedFilterOptions = true;
                            normalizedFilterOptions = normalized;
                            filterOptionsSourceRef.current = 'filterOptions';
                            if (normalized.terms.length > 0) {
                                const termOpts = normalized.terms.map(toOption).filter(Boolean);
                                setTerms(termOpts);
                                const active = termOpts.find(t => t.status === 'active' || t.isActive === true);
                                if (active) {
                                    setTermId(active._id);
                                    setSessionId(active.session?._id || active.session || active.sessionId || '');
                                }
                            }
                            if (normalized.sessions.length > 0) {
                                setSessions(normalized.sessions.map(toOption).filter(Boolean));
                            }
                            if (normalized.classes.length > 0) {
                                setClasses(normalized.classes.map(toOption).filter(Boolean));
                            }
                            if (normalized.subjects.length > 0) {
                                subjectsCacheRef.current['__global__'] = normalized.subjects.map(toOption).filter(Boolean);
                            }
                            if (normalized.terms.length === 0 || normalized.sessions.length === 0 || normalized.classes.length === 0) {
                                usedFilterOptions = false;
                            }
                        }
                    }
                } catch (filterErr) {
                    console.warn('[getFilterOptions] failed, falling back:', filterErr.message);
                    usedFilterOptions = false;
                } finally {
                    setFilterOptionsLoading(false);
                }

                if (!usedFilterOptions) {
                    filterOptionsSourceRef.current = 'individual';
                    const [termsRes, sessionsRes, classesRes] = await Promise.all([
                        termsAPI.getAll(), sessionsAPI.getAll(), classesAPI.getAllForDropdown()
                    ]);
                    if (termsRes.success) {
                        setTerms(termsRes.data);
                        const active = termsRes.data.find(t => t.status === 'active');
                        if (active) {
                            setTermId(active._id);
                            setSessionId(active.session?._id || active.session);
                        }
                    }
                    if (sessionsRes.success) setSessions(sessionsRes.data);
                    if (classesRes.success) {
                        const data = classesRes.data?.data || classesRes.data;
                        setClasses(Array.isArray(data) ? data : []);
                    }
                } else if (normalizedFilterOptions) {
                    const missingPromises = [];
                    if (normalizedFilterOptions.terms.length === 0) {
                        missingPromises.push(termsAPI.getAll().then(res => {
                            if (res.success) { setTerms(res.data); const active = res.data.find(t => t.status === 'active'); if (active) { setTermId(active._id); setSessionId(active.session?._id || active.session); } }
                        }));
                    }
                    if (normalizedFilterOptions.sessions.length === 0) {
                        missingPromises.push(sessionsAPI.getAll().then(res => { if (res.success) setSessions(res.data); }));
                    }
                    if (normalizedFilterOptions.classes.length === 0) {
                        missingPromises.push(classesAPI.getAllForDropdown().then(res => { if (res.success) { const data = res.data?.data || res.data; setClasses(Array.isArray(data) ? data : []); } }));
                    }
                    if (missingPromises.length > 0) await Promise.all(missingPromises);
                }
            } catch (err) {
                console.error('[fetchInitialData]', err);
            } finally {
                initialDoneRef.current = true;
                fetchRef.current?.();
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (!initialDoneRef.current) return;
        const refetch = async () => {
            try {
                setFilterOptionsLoading(true);
                const filterRes = await adminCAAPI.getFilterOptions({ status });
                if (filterRes?.success) {
                    const normalized = normalizeFilterOptions(filterRes);
                    if (normalized) {
                        if (normalized.terms.length > 0) setTerms(normalized.terms.map(toOption).filter(Boolean));
                        if (normalized.sessions.length > 0) setSessions(normalized.sessions.map(toOption).filter(Boolean));
                        if (normalized.classes.length > 0) setClasses(normalized.classes.map(toOption).filter(Boolean));
                        if (normalized.subjects.length > 0) subjectsCacheRef.current['__global__'] = normalized.subjects.map(toOption).filter(Boolean);
                        filterOptionsSourceRef.current = 'filterOptions';
                    }
                }
            } catch (err) { console.warn('[refetchFilterOptions] failed:', err.message); }
            finally { setFilterOptionsLoading(false); }
        };
        refetch();
    }, [status]);

    // =====================================================
    // UPDATED fetchAssessments — now sends page & limit
    // =====================================================
    const fetchAssessments = useCallback(async () => {
        if (abortRef.current) abortRef.current.cancelled = true;
        const controller = { cancelled: false };
        abortRef.current = controller;

        try {
            setLoading(true);
            setConfirmBulk(false);
            setConfirmBulkUnapprove(false);

            if (status === 'approved') {
                const params = {};
                if (classId)   params.classId   = classId;
                if (subjectId) params.subjectId = subjectId;
                if (termId)    params.termId    = termId;
                if (sessionId) params.sessionId = sessionId;
                params.page  = currentPage;
                params.limit = pageSize;

                const response = await adminCAAPI.getAllApproved(params);
                if (controller.cancelled) return;

                const dataArray = extractDataArray(response);
                setAssessments(dataArray);
                setExcludedIds(new Set());
                setApprovedSummary(response.success ? response.summary || null : null);

                if (response.success && response.summary?.total != null) {
                    setTotalResults(response.summary.total);
                } else if (response.success && response.total != null) {
                    setTotalResults(response.total);
                } else {
                    setTotalResults(dataArray.length);
                }
            } else {
                const params = {};
                if (termId)    params.termId    = termId;
                if (sessionId) params.sessionId = sessionId;
                if (classId)   params.classId   = classId;
                if (subjectId) params.subjectId = subjectId;
                if (status && status !== 'all') params.status = status;

                // PAGINATION: send page and limit to backend
                params.page  = currentPage;
                params.limit = pageSize;

                const response = await adminCAAPI.getAssessments(params);
                if (controller.cancelled) return;

                const dataArray = extractDataArray(response);
                setAssessments(dataArray);
                setExcludedIds(new Set());
                setApprovedSummary(null);

                // Backend should return total count for pagination
                if (response.summary?.total != null) {
                    setTotalResults(response.summary.total);
                } else if (response.total != null) {
                    setTotalResults(response.total);
                } else if (response.data?.total != null) {
                    setTotalResults(response.data.total);
                } else {
                    setTotalResults(dataArray.length);
                }
            }
        } catch (err) {
            if (controller.cancelled) return;
            console.error('[fetchAssessments]', err);
            setError(err.response?.data?.message || err.message || 'Failed to fetch assessments');
        } finally {
            if (abortRef.current === controller) setLoading(false);
        }
    }, [termId, sessionId, classId, subjectId, status, currentPage, pageSize]);

    useEffect(() => { fetchRef.current = fetchAssessments; }, [fetchAssessments]);

    const handleApprove = useCallback(async (id) => {
        setSuccess(''); setError('');
        const previous = { ...assessments.find(a => a._id === id) };
        setAssessments(prev => prev.map(a => a._id === id ? { ...a, status: 'approved' } : a));
        try {
            const response = await adminCAAPI.approve(id);
            if (response.success) {
                setSuccess('Assessment approved successfully');
                if (response.data) setAssessments(prev => prev.map(a => a._id === id ? { ...a, ...response.data, status: 'approved' } : a));
            } else {
                setAssessments(prev => prev.map(a => a._id === id ? previous : a));
                setError(response.message || 'Failed to approve');
            }
        } catch (err) {
            setAssessments(prev => prev.map(a => a._id === id ? previous : a));
            setError(err.response?.data?.message || err.message || 'Failed to approve assessment');
        }
    }, [assessments]);

    const handleUnapprove = useCallback(async (id) => {
        setSuccess(''); setError(''); setUnapprovingId(id);
        const previous = { ...assessments.find(a => a._id === id) };
        setAssessments(prev => prev.map(a => a._id === id ? { ...a, status: 'submitted' } : a));
        try {
            const response = await adminCAAPI.unapprove(id);
            if (response.success) {
                setSuccess('Assessment unapproved successfully');
                if (response.data) setAssessments(prev => prev.map(a => a._id === id ? { ...a, ...response.data, status: 'submitted' } : a));
            } else {
                setAssessments(prev => prev.map(a => a._id === id ? previous : a));
                setError(response.message || 'Failed to unapprove');
            }
        } catch (err) {
            setAssessments(prev => prev.map(a => a._id === id ? previous : a));
            setError(err.response?.data?.message || err.message || 'Failed to unapprove assessment');
        } finally { setUnapprovingId(null); }
    }, [assessments]);

    const handleApproveAll = useCallback(async () => {
        setConfirmBulk(false);
        setBulkLoading(true);
        setBulkProgress({ current: 0, total: 1, phase: 'Approving...' });
        setSuccess(''); setError(''); setBulkApproveResult(null);
        const excludedIdsArray = excludedIds.size > 0 ? Array.from(excludedIds) : undefined;
        setAssessments(prev => prev.map(a => (!excludedIds.has(a._id) ? { ...a, status: 'approved' } : a)));
        try {
            const filters = { termId: termId || undefined, sessionId: sessionId || undefined, classId: classId || undefined, subjectId: subjectId || undefined };
            if (excludedIdsArray?.length > 0) filters.excludedIds = excludedIdsArray;
            const response = await adminCAAPI.bulkApproveByFilters(filters);
            setBulkProgress({ current: 1, total: 1, phase: 'Done' });
            setBulkLoading(false); setExcludedIds(new Set());
            if (response.success) {
                const modifiedCount = response.data?.modified || response.data?.nowInApprovedStatus || 0;
                setBulkApproveResult({ count: modifiedCount, excluded: excludedIdsArray?.length || 0 });
                setSuccess(response.message || `Successfully approved ${modifiedCount} assessment(s).`);
                setTimeout(async () => {
                    try { const fr = await adminCAAPI.getFilterOptions({ status }); if (fr?.success) { const n = normalizeFilterOptions(fr); if (n?.classes.length > 0) setClasses(n.classes.map(toOption).filter(Boolean)); } } catch (_) {}
                    fetchRef.current?.();
                }, 300);
            } else { setError(response.message || 'Failed to approve assessments'); fetchRef.current?.(); }
        } catch (err) {
            setBulkLoading(false); setBulkProgress({ current: 0, total: 0, phase: '' });
            setError(err.response?.data?.message || err.message || 'Failed to approve assessments');
            fetchRef.current?.();
        }
    }, [termId, sessionId, classId, subjectId, excludedIds, status]);

    const handleUnapproveAll = useCallback(async () => {
        setConfirmBulkUnapprove(false);
        setBulkLoading(true);
        setBulkProgress({ current: 0, total: 1, phase: 'Unapproving...' });
        setSuccess(''); setError('');
        const excludedIdsArray = excludedIds.size > 0 ? Array.from(excludedIds) : undefined;
        setAssessments(prev => prev.map(a => (!excludedIds.has(a._id) ? { ...a, status: 'submitted' } : a)));
        try {
            const payload = {};
            if (termId) payload.termId = termId; if (sessionId) payload.sessionId = sessionId;
            if (classId) payload.classId = classId; if (subjectId) payload.subjectId = subjectId;
            if (excludedIdsArray?.length > 0) payload.excludedIds = excludedIdsArray;
            const response = await adminCAAPI.bulkUnapprove(payload);
            setBulkProgress({ current: 1, total: 1, phase: 'Done' });
            setBulkLoading(false); setExcludedIds(new Set());
            if (response.success) {
                const modifiedCount = response.data?.modified || response.data?.nowInSubmittedStatus || 0;
                setSuccess(response.message || `Successfully unapproved ${modifiedCount} assessment(s).`);
                setTimeout(async () => {
                    try { const fr = await adminCAAPI.getFilterOptions({ status }); if (fr?.success) { const n = normalizeFilterOptions(fr); if (n?.classes.length > 0) setClasses(n.classes.map(toOption).filter(Boolean)); } } catch (_) {}
                    fetchRef.current?.();
                }, 300);
            } else { setError(response.message || 'Failed to unapprove assessments'); fetchRef.current?.(); }
        } catch (err) {
            setBulkLoading(false); setBulkProgress({ current: 0, total: 0, phase: '' });
            setError(err.response?.data?.message || err.message || 'Failed to unapprove assessments');
            fetchRef.current?.();
        }
    }, [termId, sessionId, classId, subjectId, status, excludedIds]);

    const handleClassChange = useCallback((e) => setClassId(e.target.value), []);

    // Page size change handler — resets to page 1
    const handlePageSizeChange = useCallback((e) => {
        setPageSize(Number(e.target.value));
        setCurrentPage(1);
    }, []);

    // Page navigation handler
    const goToPage = useCallback((page) => {
        if (page < 1 || page > totalPages || page === currentPage) return;
        setCurrentPage(page);
    }, [currentPage, totalPages]);

    const openClearPanel = useCallback(async () => {
        setShowClearPanel(true);
        setClearClassId(''); setClearSubjectId(''); setClearError(''); setClearSuccess('');
        setClearInfo(null); setClearClasses([]); setClearSubjects([]);
        setClearProgress({ current: 0, total: 0, phase: '' }); setClearPreview(null);
        setClearPreviewLoading(false); setClearExcludedStudents(new Set());
        setClearConfirmAction(null); setClearPreviewAssessmentIds([]); setClearClassesLoading(true);
        setPreviewExpanded(true);
        try {
            const response = await adminCAAPI.getClassesWithApproved({ termId: termId || undefined, sessionId: sessionId || undefined });
            if (response.success && Array.isArray(response.data)) {
                if (response.data.length === 0) setClearInfo({ type: 'info', message: 'No approved CA records found for the selected term/session.' });
                else { setClearClasses(response.data); setClearInfo({ type: 'success', message: `${response.data.length} class${response.data.length !== 1 ? 'es' : ''} with approved records found.` }); }
            } else setClearInfo({ type: 'error', message: response.message || 'Failed to load approved records' });
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Failed to load approved records.';
            setClearError(msg); setClearInfo({ type: 'error', message: msg });
        } finally { setClearClassesLoading(false); }
    }, [termId, sessionId]);

    const closeClearPanel = useCallback(() => {
        if (clearLoading) return;
        setShowClearPanel(false); setClearClassId(''); setClearSubjectId(''); setClearError('');
        setClearSuccess(''); setClearInfo(null); setClearClasses([]); setClearSubjects([]);
        setClearProgress({ current: 0, total: 0, phase: '' }); setClearPreview(null);
        setClearPreviewLoading(false); setClearExcludedStudents(new Set());
        setClearConfirmAction(null); setClearPreviewAssessmentIds([]); setPreviewExpanded(true);
    }, [clearLoading]);

    const handleClearClassChange = useCallback(async (e) => {
        const newClassId = e.target.value;
        setClearClassId(newClassId); setClearSubjectId(''); setClearError(''); setClearSuccess('');
        setClearInfo(null); setClearPreview(null); setClearPreviewLoading(false);
        setClearExcludedStudents(new Set()); setClearConfirmAction(null); setClearPreviewAssessmentIds([]);
        if (newClassId) {
            setClearSubjectsLoading(true);
            try {
                const response = await adminCAAPI.getSubjectsWithApproved(newClassId, { termId: termId || undefined, sessionId: sessionId || undefined });
                if (response.success && Array.isArray(response.data)) {
                    setClearSubjects(response.data);
                    const totalRecs = response.data.reduce((s, g) => s + g.approvedRecords, 0);
                    setClearInfo({ type: 'success', message: `${response.data.length} subject${response.data.length !== 1 ? 's' : ''} with ${totalRecs} approved record${totalRecs !== 1 ? 's' : ''}. Select "Clear All" to proceed.` });
                } else { setClearSubjects([]); setClearInfo({ type: 'info', message: response.message || 'No approved subjects found for this class.' }); }
            } catch (err) {
                const msg = err.response?.data?.message || err.message || 'Failed to load subjects.';
                setClearSubjects([]); setClearError(msg); setClearInfo({ type: 'error', message: msg });
            } finally { setClearSubjectsLoading(false); }
        } else setClearSubjects([]);
    }, [termId, sessionId]);

    const loadPreview = useCallback(async (cId, sId) => {
        setClearPreviewLoading(true); setClearPreview(null); setClearExcludedStudents(new Set());
        setClearConfirmAction(null); setClearPreviewAssessmentIds([]);
        try {
            const response = await adminCAAPI.previewClearApproval({ classId: cId, subjectId: sId, termId: termId || undefined, sessionId: sessionId || undefined });
            if (response.success && response.data) {
                const { classInfo, subjectInfo, totalRecords, students } = response.data;
                setClearPreviewAssessmentIds(students.map(s => s.assessmentId || s._id).filter(Boolean));
                setClearPreview({ classInfo, subjectInfo, totalRecords, students: students.map(s => ({ studentId: s.studentId, name: s.name, admissionNumber: s.admissionNumber, totalScore: s.totalScore, grade: s.grade, assessmentId: s.assessmentId || s._id })) });
                if (students.length === 0) setClearInfo({ type: 'info', message: 'No student records found.' }); else setClearInfo(null);
            } else { setClearInfo({ type: 'error', message: response.message || 'Failed to load preview' }); setClearPreview(null); setClearPreviewAssessmentIds([]); }
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Failed to load preview.';
            setClearError(msg); setClearInfo({ type: 'error', message: msg }); setClearPreview(null); setClearPreviewAssessmentIds([]);
        } finally { setClearPreviewLoading(false); }
    }, [termId, sessionId]);

    const handleClearSubjectChange = useCallback((e) => {
        const newSubjectId = e.target.value;
        setClearSubjectId(newSubjectId); setClearError(''); setClearSuccess(''); setClearInfo(null);
        setClearPreview(null); setClearPreviewLoading(false); setClearExcludedStudents(new Set());
        setClearConfirmAction(null); setClearPreviewAssessmentIds([]); setPreviewExpanded(true);
        if (newSubjectId) loadPreview(clearClassId, newSubjectId); else setClearPreview(null);
    }, [clearClassId, loadPreview]);

    const toggleClearStudentExclusion = useCallback((studentId) => {
        setClearExcludedStudents(prev => { const next = new Set(prev); if (next.has(studentId)) next.delete(studentId); else next.add(studentId); return next; });
    }, []);

    const toggleAllClearStudentsExclusion = useCallback(() => {
        setClearExcludedStudents(prev => { if (!clearPreview) return new Set(); const allIds = clearPreview.students.map(s => s.studentId); if (prev.size === allIds.length) return new Set(); return new Set(allIds); });
    }, [clearPreview]);

    const clearClearStudentExclusions = useCallback(() => setClearExcludedStudents(new Set()), []);

    const getEffectiveClearCount = useCallback(() => {
        if (!clearPreview) return 0;
        return clearPreview.students.length - clearExcludedStudents.size;
    }, [clearPreview, clearExcludedStudents]);

    const handleConfirmClear = useCallback(async () => {
        if (!clearClassId) return;
        setClearLoading(true); setClearSuccess(''); setClearError('');
        setClearProgress({ current: 0, total: 1, phase: 'Sending request...' });
        try {
            const hasExclusions = clearExcludedStudents.size > 0 && clearExcludedStudents.size < (clearPreview?.students.length || 0);
            let response;
            if (clearSubjectId && clearPreviewAssessmentIds.length > 0 && hasExclusions) {
                const excludedAssessmentIds = clearPreview.students.filter(s => clearExcludedStudents.has(s.studentId)).map(s => s.assessmentId).filter(Boolean);
                const idsToClear = clearPreviewAssessmentIds.filter(id => !excludedAssessmentIds.includes(id));
                if (idsToClear.length === 0) { setClearLoading(false); setClearInfo({ type: 'info', message: 'No records to clear after exclusions.' }); setClearProgress({ current: 0, total: 0, phase: '' }); return; }
                response = await adminCAAPI.clearApprovalByIds(idsToClear, 'draft');
            } else if (clearSubjectId) {
                response = await adminCAAPI.clearApprovalStatus({ classId: clearClassId, subjectId: clearSubjectId || undefined, termId: termId || undefined, sessionId: sessionId || undefined, resetTo: 'draft' });
            } else {
                response = await adminCAAPI.clearApprovalStatus({ classId: clearClassId, termId: termId || undefined, sessionId: sessionId || undefined, resetTo: 'draft' });
            }
            setClearProgress({ current: 1, total: 1, phase: 'Done' });
            if (response.success) {
                const result = response.data?.result || response.data;
                const recordsAffected = result?.recordsAffected || result?.modified || result?.nowInSubmittedStatus || getEffectiveClearCount();
                setClearSuccess(clearSubjectId ? `Cleared ${recordsAffected} record${recordsAffected !== 1 ? 's' : ''} for ${result?.subjectInfo?.name || clearSubjects.find(s => s.subjectId === clearSubjectId)?.subjectName || 'subject'}` : `Cleared ${recordsAffected} record${recordsAffected !== 1 ? 's' : ''} across ${clearSubjects.length} subject${clearSubjects.length !== 1 ? 's' : ''}`);
                fetchRef.current?.();
                setTimeout(async () => {
                    try {
                        if (clearClassId) { const subRes = await adminCAAPI.getSubjectsWithApproved(clearClassId, { termId: termId || undefined, sessionId: sessionId || undefined }); if (subRes.success && Array.isArray(subRes.data)) setClearSubjects(subRes.data); }
                        if (!clearSubjectId && clearClassId) { const classRes = await adminCAAPI.getClassesWithApproved({ termId: termId || undefined, sessionId: sessionId || undefined }); if (classRes.success && Array.isArray(classRes.data)) { setClearClasses(classRes.data); if (classRes.data.length === 0) { setClearInfo({ type: 'info', message: 'All approved records cleared.' }); setClearClassId(''); setClearSubjects([]); } else { const remaining = classRes.data.reduce((sum, c) => sum + c.approvedRecords, 0); setClearInfo({ type: 'success', message: `${classRes.data.length} class${classRes.data.length !== 1 ? 'es' : ''} remaining with ${remaining} records.` }); } } }
                        if (clearSubjectId) { setClearPreview(null); setClearPreviewAssessmentIds([]); setClearExcludedStudents(new Set()); setClearSubjectId(''); }
                    } catch (err) { console.error('[refreshClearPanel]', err); }
                }, 500);
            } else setClearError(response.message || 'Failed to clear approval status');
        } catch (err) { setClearError(err.response?.data?.message || err.message || 'Failed to clear approval status.'); }
        finally { setClearLoading(false); setTimeout(() => setClearProgress({ current: 0, total: 0, phase: '' }), 800); }
    }, [clearClassId, clearSubjectId, clearSubjects, clearPreview, clearExcludedStudents, clearPreviewAssessmentIds, termId, sessionId, getEffectiveClearCount]);

    const statusTabs = [
        { value: 'submitted', label: 'Submitted' },
        { value: 'draft',     label: 'Draft' },
        { value: 'approved',  label: 'Approved' }
    ];

    const bulkLabel = bulkLoading && bulkProgress.total > 0 ? `${bulkProgress.current}/${bulkProgress.total}` : null;

    const getActiveFiltersDescription = useCallback(() => {
        const parts = [];
        if (termId) { const t = terms.find(t => t._id === termId); if (t) parts.push(t.name); }
        if (sessionId) { const s = sessions.find(s => s._id === sessionId); if (s) parts.push(s.name); }
        if (classId) { const c = classes.find(c => c._id === classId); if (c) parts.push(c.name + (c.section ? ' ' + c.section : '')); }
        if (subjectId) { const s = subjects.find(s => s._id === subjectId); if (s) parts.push(s.name); }
        return parts.length > 0 ? parts.join(' → ') : 'All';
    }, [termId, sessionId, classId, subjectId, terms, sessions, classes, subjects]);

    // Generate visible page numbers for pagination
    const visiblePages = useMemo(() => {
        const pages = [];
        const maxVisible = 7;
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            let start = Math.max(2, currentPage - 2);
            let end = Math.min(totalPages - 1, currentPage + 2);
            if (currentPage <= 3) { start = 2; end = 5; }
            if (currentPage >= totalPages - 2) { start = totalPages - 4; end = totalPages - 1; }
            if (start > 2) pages.push('...');
            for (let i = start; i <= end; i++) pages.push(i);
            if (end < totalPages - 1) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    }, [currentPage, totalPages]);

    // Show range text like "Showing 1-20 of 245"
    const paginationRangeText = useMemo(() => {
        if (totalResults === 0) return 'No results';
        const from = (currentPage - 1) * pageSize + 1;
        const to = Math.min(currentPage * pageSize, totalResults);
        return `Showing ${from}–${to} of ${totalResults}`;
    }, [currentPage, pageSize, totalResults]);

    // ── Option helpers ──
    const optId   = (o) => o?._id ?? o?.id ?? '';
    const classOptLabel = (c) => c.classFullName || c.fullName || [c.name, c.level, c.section].filter(Boolean).join(' ') || c.className || 'Class';
    const clearClassLabel = (c) => `${c.classFullName || c.className || 'Class'} (${c.approvedRecords})`;
    const clearSubjectLabel = (s) => `${s.subjectName} (${s.approvedRecords})`;

    const statusMeta = getStatusMeta(status);

    return (
        <div className="aa-root">
            <style>{`
                .aa-root {
                    --bg: #f1f5f9; --surface: #ffffff; --border: #e2e8f0; --text: #0f172a; --text-secondary: #475569; --text-muted: #94a3b8;
                    --primary: #4f46e5; --primary-hover: #4338ca; --primary-light: #eef2ff;
                    --danger: #ef4444; --danger-hover: #dc2626; --success: #10b981; --success-light: #ecfdf5;
                    --warning: #f59e0b; --warning-light: #fffbeb;
                    --radius: 12px; --radius-sm: 8px;
                    --shadow-sm: 0 1px 2px rgba(0,0,0,0.05); --shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
                    --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1);
                    --transition: 150ms cubic-bezier(0.4, 0, 0.2, 1);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    color: var(--text); -webkit-font-smoothing: antialiased; background: var(--bg); min-height: 100vh;
                }
                .aa-toasts { position: fixed; top: 16px; right: 16px; z-index: 200; display: flex; flex-direction: column; gap: 8px; pointer-events: none; max-width: 420px; }
                .aa-toast { pointer-events: auto; display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; border-radius: var(--radius-sm); font-size: 0.84rem; font-weight: 500; box-shadow: var(--shadow-lg); animation: aaToastIn 0.3s cubic-bezier(0.16,1,0.3,1); line-height: 1.4; }
                .aa-toast--success { background: var(--success-light); color: #065f46; border: 1px solid #a7f3d0; }
                .aa-toast--error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
                .aa-toast svg { flex-shrink: 0; margin-top: 1px; }
                .aa-toast-content { flex: 1; }
                .aa-toast-detail { display: block; font-size: 0.78rem; opacity: 0.8; margin-top: 2px; }
                @keyframes aaToastIn { from { opacity: 0; transform: translateX(20px) scale(0.95); } to { opacity: 1; transform: translateX(0) scale(1); } }
                .aa-header { background: var(--surface); border-bottom: 1px solid var(--border); padding: 20px 24px; position: sticky; top: 0; z-index: 30; }
                .aa-header-content { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
                .aa-header-text { display: flex; align-items: center; gap: 14px; }
                .aa-header-icon { width: 44px; height: 44px; border-radius: 12px; background: var(--primary-light); display: flex; align-items: center; justify-content: center; color: var(--primary); flex-shrink: 0; }
                .aa-title { font-size: 1.35rem; font-weight: 700; color: var(--text); margin: 0; letter-spacing: -0.02em; }
                .aa-subtitle { font-size: 0.82rem; color: var(--text-muted); margin: 2px 0 0; }
                .aa-header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
                .aa-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: var(--radius-sm); font-size: 0.82rem; font-weight: 600; border: none; cursor: pointer; transition: all var(--transition); white-space: nowrap; line-height: 1.4; }
                .aa-btn:active { transform: scale(0.97); }
                .aa-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
                .aa-btn svg { width: 15px; height: 15px; flex-shrink: 0; }
                .aa-btn-success { background: var(--success); color: #fff; }
                .aa-btn-success:hover { background: #059669; }
                .aa-btn-ghost { background: var(--surface); color: var(--text-secondary); border: 1px solid var(--border); }
                .aa-btn-ghost:hover { background: #f8fafc; border-color: #cbd5e1; }
                .aa-btn-danger { background: var(--danger); color: #fff; }
                .aa-btn-danger:hover { background: var(--danger-hover); }
                .aa-btn-danger-outline { background: var(--surface); color: var(--danger); border: 1px solid #fecaca; }
                .aa-btn-danger-outline:hover { background: #fef2f2; border-color: #fca5a5; }
                .aa-btn-outline-secondary { background: var(--surface); color: var(--text-secondary); border: 1px solid var(--border); }
                .aa-btn-outline-secondary:hover { background: #f8fafc; border-color: #cbd5e1; }
                .aa-btn-sm { padding: 6px 12px; font-size: 0.78rem; }
                .aa-btn-sm svg { width: 13px; height: 13px; }
                .aa-btn-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: aaSpin 0.6s linear infinite; flex-shrink: 0; }
                .aa-btn-spinner--sm { width: 13px; height: 13px; }
                .aa-btn-spinner--dark { border-color: rgba(0,0,0,0.12); border-top-color: var(--text-secondary); }
                @keyframes aaSpin { to { transform: rotate(360deg); } }
                .aa-exclude-cb { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 5px; border: 2px solid #cbd5e1; background: var(--surface); cursor: pointer; transition: all var(--transition); flex-shrink: 0; }
                .aa-exclude-cb:hover { border-color: #94a3b8; background: #f8fafc; }
                .aa-exclude-cb--checked { background: var(--danger); border-color: var(--danger); }
                .aa-exclude-cb--checked:hover { background: var(--danger-hover); border-color: var(--danger-hover); }
                .aa-exclude-cb--indeterminate { background: var(--danger); border-color: var(--danger); }
                .aa-exclude-cb--indeterminate:hover { background: var(--danger-hover); border-color: var(--danger-hover); }
                .aa-exclude-cb svg { width: 12px; height: 12px; color: #fff; pointer-events: none; }
                .aa-exclude-cb:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
                .aa-exclusion-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 24px; background: #fef2f2; border-bottom: 1px solid #fecaca; animation: aaSlideDown 0.25s ease; }
                .aa-exclusion-bar-inner { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: #991b1b; font-weight: 500; }
                .aa-exclusion-bar-inner svg { flex-shrink: 0; }
                .aa-exclusion-bar-count { font-weight: 700; }
                .aa-exclusion-bar-actions { display: flex; gap: 6px; }
                .aa-exclusion-clear { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 6px; border: 1px solid #fecaca; background: var(--surface); color: #991b1b; font-size: 0.76rem; font-weight: 600; cursor: pointer; transition: all var(--transition); }
                .aa-exclusion-clear:hover { background: #fee2e2; border-color: #fca5a5; }
                .aa-exclusion-clear svg { width: 12px; height: 12px; }
                .aa-filters { background: var(--surface); border-bottom: 1px solid var(--border); padding: 16px 24px; }
                .aa-status-tabs { display: flex; gap: 4px; margin-bottom: 14px; background: #f1f5f9; border-radius: var(--radius-sm); padding: 3px; width: fit-content; }
                .aa-status-tab { display: inline-flex; align-items: center; gap: 7px; padding: 9px 18px; border: none; border-radius: 6px; font-size: 0.84rem; font-weight: 600; color: var(--text-muted); background: transparent; cursor: pointer; transition: all var(--transition); font-family: inherit; }
                .aa-status-tab:hover { color: var(--text-secondary); background: rgba(255,255,255,0.7); }
                .aa-status-tab--active { color: var(--tab-color); background: var(--tab-bg); box-shadow: var(--shadow-sm); }
                .aa-status-tab-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; opacity: 0.9; }
                .aa-filter-row { display: flex; gap: 12px; flex-wrap: wrap; }
                .aa-filter-field { flex: 1; min-width: 170px; display: flex; flex-direction: column; gap: 5px; }
                .aa-filter-field label { font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
                .aa-select-wrap { position: relative; display: flex; align-items: center; }
                .aa-select { width: 100%; padding: 9px 32px 9px 12px; background: #f8fafc; border: 1.5px solid transparent; border-radius: var(--radius-sm); font-size: 0.85rem; color: var(--text); outline: none; transition: all var(--transition); font-family: inherit; appearance: none; -webkit-appearance: none; cursor: pointer; }
                .aa-select:hover:not(:disabled) { background: #f1f5f9; }
                .aa-select:focus { background: var(--surface); border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
                .aa-select:disabled { opacity: 0.55; cursor: not-allowed; background: #f1f5f9; }
                .aa-select-chevron { position: absolute; right: 10px; color: var(--text-muted); pointer-events: none; }
                .aa-subject-loading { display: inline-flex; margin-left: 6px; }
                .aa-mini-spinner { display: inline-block; width: 12px; height: 12px; border: 2px solid #e2e8f0; border-top-color: var(--primary); border-radius: 50%; animation: aaSpin 0.6s linear infinite; }
                .aa-filter-hint { display: flex; align-items: center; gap: 6px; margin-top: 10px; font-size: 0.75rem; color: var(--text-muted); }
                .aa-crossterm-banner { display: flex; align-items: flex-start; gap: 10px; margin: 14px 24px 0; padding: 12px 16px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: var(--radius-sm); font-size: 0.8rem; color: #1e40af; }
                .aa-crossterm-banner svg { flex-shrink: 0; margin-top: 1px; }
                .aa-crossterm-banner b { font-weight: 700; }
                .aa-bulk-confirm { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 20px; background: var(--warning-light); border: 1px solid #fde68a; border-left: 4px solid var(--warning); border-radius: var(--radius-sm); margin: 14px 24px 0; animation: aaToastIn 0.25s ease; flex-wrap: wrap; }
                .aa-bulk-confirm--unapprove { background: #fef2f2; border-color: #fecaca; border-left-color: var(--danger); }
                .aa-bulk-confirm-inner { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: #92400e; font-weight: 500; }
                .aa-bulk-confirm--unapprove .aa-bulk-confirm-inner { color: #991b1b; }
                .aa-bulk-confirm-inner svg { flex-shrink: 0; color: var(--warning); }
                .aa-bulk-confirm--unapprove .aa-bulk-confirm-inner svg { color: var(--danger); }
                .aa-bulk-confirm-inner strong { font-weight: 800; }
                .aa-bulk-confirm-actions { display: flex; gap: 8px; }
                .aa-results-info { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 24px 8px; flex-wrap: wrap; }
                .aa-results-count { font-size: 0.84rem; color: var(--text-secondary); }
                .aa-results-count strong { color: var(--text); font-weight: 700; }
                .aa-results-status { font-size: 0.74rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
                .aa-table-wrap { margin: 0 24px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow-x: auto; box-shadow: var(--shadow-sm); }
                .aa-table { width: 100%; border-collapse: collapse; font-size: 0.84rem; min-width: 1020px; }
                .aa-table thead th { padding: 12px 14px; text-align: left; font-size: 0.66rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; background: #f8fafc; border-bottom: 1px solid var(--border); white-space: nowrap; position: sticky; top: 0; z-index: 2; }
                .aa-th-score, .aa-th-total, .aa-th-action, .aa-th-check { text-align: center; }
                .aa-th-max { font-weight: 500; color: var(--text-muted); opacity: 0.65; margin-left: 2px; }
                .aa-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: background var(--transition); }
                .aa-table tbody tr:last-child { border-bottom: none; }
                .aa-table tbody tr:hover { background: #f8fafc; }
                .aa-row--submitted { border-left: 3px solid #fbbf24; }
                .aa-row--approved { border-left: 3px solid #34d399; }
                .aa-row--draft { border-left: 3px solid #cbd5e1; }
                .aa-table td { padding: 12px 14px; vertical-align: middle; color: var(--text-secondary); }
                .aa-td-student { display: flex; flex-direction: column; gap: 2px; }
                .aa-student-name { font-weight: 700; color: var(--text); font-size: 0.86rem; }
                .aa-student-id { font-size: 0.74rem; color: var(--text-muted); font-variant-numeric: tabular-nums; }
                .aa-tag { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 6px; font-size: 0.76rem; font-weight: 600; white-space: nowrap; }
                .aa-tag--class { background: var(--primary-light); color: var(--primary); }
                .aa-subject-name { font-weight: 600; color: var(--text); font-size: 0.84rem; }
                .aa-td-score { text-align: center; font-variant-numeric: tabular-nums; font-weight: 500; }
                .aa-td-total { text-align: center; }
                .aa-total-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 46px; padding: 4px 10px; background: var(--primary-light); border-radius: 8px; font-weight: 800; font-size: 0.88rem; color: var(--primary); font-variant-numeric: tabular-nums; }
                .aa-grade-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 36px; height: 26px; padding: 0 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 800; letter-spacing: -0.01em; }
                .aa-status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 11px; border-radius: 100px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
                .aa-status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
                .aa-td-action { text-align: center; white-space: nowrap; }
                .aa-approve-btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 14px; background: var(--success-light); color: #059669; border: 1px solid #a7f3d0; border-radius: 8px; font-size: 0.76rem; font-weight: 700; cursor: pointer; transition: all var(--transition); font-family: inherit; }
                .aa-approve-btn:hover:not(:disabled) { background: #d1fae5; transform: translateY(-1px); }
                .aa-approve-btn:active:not(:disabled) { transform: translateY(0); }
                .aa-approve-btn:disabled { opacity: 0.55; cursor: not-allowed; }
                .aa-unapprove-btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 14px; background: var(--surface); color: #dc2626; border: 1.5px solid #fecaca; border-radius: 8px; font-size: 0.76rem; font-weight: 700; cursor: pointer; transition: all var(--transition); white-space: nowrap; font-family: inherit; }
                .aa-unapprove-btn:hover:not(:disabled) { background: #fef2f2; border-color: #f87171; color: #b91c1c; }
                .aa-unapprove-btn:disabled { opacity: 0.55; cursor: not-allowed; }
                .aa-btn-spinner--red { border-color: rgba(220,38,38,0.2); border-top-color: #dc2626; }
                .aa-approved-check { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; background: var(--success-light); color: #059669; }
                .aa-cards { display: none; flex-direction: column; gap: 12px; margin: 0 16px; }
                .aa-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 16px; box-shadow: var(--shadow-sm); position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 10px; }
                .aa-card::before { content: ''; position: absolute; top: 0; left: 0; bottom: 0; width: 3px; }
                .aa-card--submitted::before { background: #fbbf24; }
                .aa-card--approved::before { background: #34d399; }
                .aa-card--draft::before { background: #cbd5e1; }
                .aa-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
                .aa-card-student { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
                .aa-card-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
                .aa-card-scores { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #f8fafc; border-radius: var(--radius-sm); flex-wrap: wrap; }
                .aa-score-block { display: flex; flex-direction: column; gap: 2px; min-width: 44px; }
                .aa-score-block--total { margin-left: auto; text-align: right; }
                .aa-score-label { font-size: 0.62rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
                .aa-score-value { font-size: 1rem; font-weight: 700; color: var(--text); font-variant-numeric: tabular-nums; }
                .aa-score-value--total { font-size: 1.1rem; color: var(--primary); }
                .aa-score-max { font-size: 0.66rem; font-weight: 500; color: var(--text-muted); margin-left: 1px; }
                .aa-score-divider { color: #cbd5e1; flex-shrink: 0; }
                .aa-grade-badge--card { align-self: center; }
                .aa-card-action { display: flex; justify-content: flex-end; gap: 8px; padding-top: 10px; border-top: 1px solid var(--border); }
                .aa-card-action .aa-approve-btn, .aa-card-action .aa-unapprove-btn { flex: 1; justify-content: center; padding: 9px 16px; font-size: 0.82rem; }
                .aa-approved-label { display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 700; color: #059669; }
                .aa-pagination { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 24px 4px; flex-wrap: wrap; }
                .aa-pagination-controls { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
                .aa-page-btn { min-width: 32px; height: 32px; padding: 0 9px; border: 1px solid var(--border); background: var(--surface); color: var(--text-secondary); border-radius: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all var(--transition); font-family: inherit; display: inline-flex; align-items: center; justify-content: center; }
                .aa-page-btn:hover:not(:disabled):not(.aa-page-btn--active) { border-color: #cbd5e1; background: #f8fafc; }
                .aa-page-btn--active { background: var(--primary); color: #fff; border-color: var(--primary); }
                .aa-page-btn:disabled { opacity: 0.45; cursor: not-allowed; }
                .aa-page-ellipsis { min-width: 22px; text-align: center; color: var(--text-muted); font-weight: 700; }
                .aa-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 56px 20px; background: var(--surface); border-radius: var(--radius); border: 2px dashed var(--border); margin: 0 24px; gap: 4px; }
                .aa-empty-illustration { width: 76px; height: 76px; display: flex; align-items: center; justify-content: center; background: #f8fafc; border-radius: 50%; color: var(--text-muted); margin-bottom: 10px; }
                .aa-empty h3 { font-size: 1.05rem; font-weight: 700; color: var(--text); margin: 0 0 6px; }
                .aa-empty p { color: var(--text-secondary); font-size: 0.86rem; margin: 0; max-width: 380px; }
                .aa-table-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 56px 20px; gap: 14px; color: var(--text-muted); font-size: 0.86rem; background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); margin: 0 24px; }
                .aa-inline-loader { width: 40px; height: 40px; position: relative; }
                .aa-loader-ring { position: absolute; inset: 0; border: 3px solid transparent; border-radius: 50%; }
                .aa-loader-ring:nth-child(1) { border-top-color: var(--primary); animation: aaSpin 1s linear infinite; }
                .aa-loader-ring:nth-child(2) { border-right-color: #fbbf24; animation: aaSpin 1.4s linear infinite reverse; inset: 5px; }
                .aa-loader-ring:nth-child(3) { border-bottom-color: #818cf8; animation: aaSpin 0.9s linear infinite; inset: 10px; }
                .aa-modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.55); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 300; padding: 16px; animation: aaFadeIn 0.2s ease; }
                @keyframes aaFadeIn { from { opacity: 0; } to { opacity: 1; } }
                .aa-modal { background: var(--surface); border-radius: var(--radius); width: 100%; max-width: 660px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: var(--shadow-lg); animation: aaToastIn 0.25s cubic-bezier(0.16,1,0.3,1); overflow: hidden; }
                .aa-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border); }
                .aa-modal-title { font-size: 1.02rem; font-weight: 800; color: var(--text); margin: 0; }
                .aa-modal-subtitle { font-size: 0.78rem; color: var(--text-muted); margin: 2px 0 0; }
                .aa-modal-close { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text-secondary); cursor: pointer; transition: all var(--transition); }
                .aa-modal-close:hover:not(:disabled) { background: #f8fafc; }
                .aa-modal-close:disabled { opacity: 0.5; cursor: not-allowed; }
                .aa-modal-body { padding: 18px 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
                .aa-modal-footer { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 14px 20px; border-top: 1px solid var(--border); background: #f8fafc; flex-wrap: wrap; }
                .aa-info-banner { padding: 10px 14px; border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 500; line-height: 1.45; }
                .aa-info-banner--success { background: var(--success-light); color: #065f46; border: 1px solid #a7f3d0; }
                .aa-info-banner--error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
                .aa-info-banner--info { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
                .aa-preview-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
                .aa-preview-title { font-size: 0.82rem; font-weight: 800; color: var(--text); text-transform: uppercase; letter-spacing: 0.04em; }
                .aa-preview-toggle { display: inline-flex; align-items: center; gap: 6px; font-size: 0.76rem; font-weight: 600; color: var(--text-secondary); background: none; border: none; cursor: pointer; padding: 4px 8px; border-radius: 6px; font-family: inherit; }
                .aa-preview-toggle:hover { background: #f1f5f9; }
                .aa-preview-list { border: 1px solid var(--border); border-radius: var(--radius-sm); max-height: 260px; overflow-y: auto; }
                .aa-preview-row { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-bottom: 1px solid #f1f5f9; font-size: 0.8rem; }
                .aa-preview-row:last-child { border-bottom: none; }
                .aa-preview-row--excluded { opacity: 0.45; }
                .aa-preview-name { font-weight: 600; color: var(--text); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .aa-preview-id { font-size: 0.72rem; color: var(--text-muted); font-variant-numeric: tabular-nums; }
                .aa-preview-score { font-weight: 700; font-variant-numeric: tabular-nums; }
                @media (max-width: 900px) {
                    .aa-table-wrap { display: none; }
                    .aa-cards { display: flex; }
                    .aa-filter-row { flex-direction: column; }
                    .aa-exclusion-bar, .aa-results-info, .aa-pagination { padding-left: 16px; padding-right: 16px; }
                    .aa-bulk-confirm, .aa-crossterm-banner { margin-left: 16px; margin-right: 16px; }
                    .aa-empty, .aa-table-loading { margin-left: 16px; margin-right: 16px; }
                }
                @media (max-width: 500px) {
                    .aa-header-content { flex-direction: column; align-items: stretch; }
                    .aa-header-actions { justify-content: space-between; }
                    .aa-bulk-confirm { flex-direction: column; align-items: stretch; }
                    .aa-bulk-confirm-actions { justify-content: flex-end; }
                    .aa-toasts { left: 14px; right: 14px; max-width: none; }
                    .aa-card-scores { padding: 10px; gap: 6px; }
                    .aa-score-block { min-width: 40px; }
                }
            `}</style>

            {/* ═══════════ TOASTS ═══════════ */}
            <div className="aa-toasts">
                {success && (
                    <div className="aa-toast aa-toast--success">
                        <IconCheck />
                        <div className="aa-toast-content">
                            {success}
                            {bulkApproveResult && (
                                <span className="aa-toast-detail">
                                    {bulkApproveResult.count} approved{bulkApproveResult.excluded > 0 ? ` · ${bulkApproveResult.excluded} excluded` : ''}
                                </span>
                            )}
                        </div>
                    </div>
                )}
                {error && (
                    <div className="aa-toast aa-toast--error">
                        <IconAlert />
                        <div className="aa-toast-content">{error}</div>
                    </div>
                )}
            </div>

            {/* ═══════════ HEADER ═══════════ */}
            <header className="aa-header">
                <div className="aa-header-content">
                    <div className="aa-header-text">
                        <div className="aa-header-icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                        </div>
                        <div>
                            <h1 className="aa-title">Approve Assessments</h1>
                            <p className="aa-subtitle">
                                {activeTermName || 'All Terms'} · {activeSessionName || 'All Sessions'} · Filter: {getActiveFiltersDescription()}
                            </p>
                        </div>
                    </div>
                    <div className="aa-header-actions">
                        {status === 'submitted' && (
                            <button
                                className="aa-btn aa-btn-success"
                                onClick={() => setConfirmBulk(true)}
                                disabled={bulkLoading || effectivePendingCount === 0}
                            >
                                {bulkLoading ? <span className="aa-btn-spinner" /> : <IconCheck />}
                                {bulkLabel ? `Approving ${bulkLabel}…` : `Approve All (${effectivePendingCount})`}
                            </button>
                        )}
                        {status === 'approved' && (
                            <button
                                className="aa-btn aa-btn-danger-outline"
                                onClick={() => setConfirmBulkUnapprove(true)}
                                disabled={bulkLoading || effectiveApprovedCount === 0}
                            >
                                {bulkLoading ? <span className="aa-btn-spinner aa-btn-spinner--red" /> : <IconUndo />}
                                {bulkLabel ? `Unapproving ${bulkLabel}…` : `Unapprove All (${effectiveApprovedCount})`}
                            </button>
                        )}
                        <button className="aa-btn aa-btn-ghost" onClick={openClearPanel} disabled={bulkLoading}>
                            <IconUndo />
                            Clear Approvals
                        </button>
                    </div>
                </div>
            </header>

            {/* ═══════════ BULK CONFIRM BARS ═══════════ */}
            {confirmBulk && status === 'submitted' && (
                <div className="aa-bulk-confirm">
                    <div className="aa-bulk-confirm-inner">
                        <IconAlert />
                        <span>Approve <strong>{effectivePendingCount}</strong> submitted assessment{effectivePendingCount !== 1 ? 's' : ''} for <strong>{getActiveFiltersDescription()}</strong>?</span>
                    </div>
                    <div className="aa-bulk-confirm-actions">
                        <button className="aa-btn aa-btn-sm aa-btn-outline-secondary" onClick={() => setConfirmBulk(false)}>Cancel</button>
                        <button className="aa-btn aa-btn-sm aa-btn-success" onClick={handleApproveAll}>Yes, Approve All</button>
                    </div>
                </div>
            )}
            {confirmBulkUnapprove && status === 'approved' && (
                <div className="aa-bulk-confirm aa-bulk-confirm--unapprove">
                    <div className="aa-bulk-confirm-inner">
                        <IconAlert />
                        <span>Unapprove <strong>{effectiveApprovedCount}</strong> approved assessment{effectiveApprovedCount !== 1 ? 's' : ''} for <strong>{getActiveFiltersDescription()}</strong>? They will return to <strong>Submitted</strong>.</span>
                    </div>
                    <div className="aa-bulk-confirm-actions">
                        <button className="aa-btn aa-btn-sm aa-btn-outline-secondary" onClick={() => setConfirmBulkUnapprove(false)}>Cancel</button>
                        <button className="aa-btn aa-btn-sm aa-btn-danger" onClick={handleUnapproveAll}>Yes, Unapprove All</button>
                    </div>
                </div>
            )}

            {/* ═══════════ EXCLUSION BAR ═══════════ */}
            {excludedIds.size > 0 && (
                <div className="aa-exclusion-bar">
                    <div className="aa-exclusion-bar-inner">
                        <IconAlert />
                        <span><span className="aa-exclusion-bar-count">{excludedIds.size}</span> assessment{excludedIds.size !== 1 ? 's' : ''} will be excluded from bulk actions</span>
                    </div>
                    <div className="aa-exclusion-bar-actions">
                        <button className="aa-exclusion-clear" onClick={clearExclusions}>
                            <IconX /> Clear selection
                        </button>
                    </div>
                </div>
            )}

            {/* ═══════════ FILTERS ═══════════ */}
            <div className="aa-filters">
                <div className="aa-status-tabs">
                    {statusTabs.map(tab => {
                        const meta = getStatusMeta(tab.value);
                        const active = status === tab.value;
                        return (
                            <button
                                key={tab.value}
                                className={`aa-status-tab ${active ? 'aa-status-tab--active' : ''}`}
                                style={{ '--tab-color': meta.color, '--tab-bg': meta.bg }}
                                onClick={() => setStatus(tab.value)}
                            >
                                <span className="aa-status-tab-dot" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
                <div className="aa-filter-row">
                    <div className="aa-filter-field">
                        <label>Term</label>
                        <div className="aa-select-wrap">
                            <select className="aa-select" value={termId} onChange={(e) => setTermId(e.target.value)}>
                                <option value="">All Terms</option>
                                {terms.map(t => <option key={optId(t)} value={optId(t)}>{t.name}</option>)}
                            </select>
                            <span className="aa-select-chevron"><IconChevron /></span>
                        </div>
                    </div>
                    <div className="aa-filter-field">
                        <label>Session</label>
                        <div className="aa-select-wrap">
                            <select className="aa-select" value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
                                <option value="">All Sessions</option>
                                {sessions.map(s => <option key={optId(s)} value={optId(s)}>{s.name}</option>)}
                            </select>
                            <span className="aa-select-chevron"><IconChevron /></span>
                        </div>
                    </div>
                    <div className="aa-filter-field">
                        <label>Class</label>
                        <div className="aa-select-wrap">
                            <select className="aa-select" value={classId} onChange={handleClassChange}>
                                <option value="">All Classes</option>
                                {classes.map(c => <option key={optId(c)} value={optId(c)}>{classOptLabel(c)}</option>)}
                            </select>
                            <span className="aa-select-chevron"><IconChevron /></span>
                        </div>
                    </div>
                    <div className="aa-filter-field">
                        <label>
                            Subject
                            {subjectsLoading && <span className="aa-subject-loading"><span className="aa-mini-spinner" /></span>}
                        </label>
                        <div className="aa-select-wrap">
                            <select
                                className="aa-select"
                                value={subjectId}
                                onChange={(e) => setSubjectId(e.target.value)}
                                disabled={!classId || subjectsLoading}
                            >
                                <option value="">{!classId ? 'Select a class first' : 'All Subjects'}</option>
                                {subjects.map(s => <option key={optId(s)} value={optId(s)}>{s.name}</option>)}
                            </select>
                            <span className="aa-select-chevron"><IconChevron /></span>
                        </div>
                    </div>
                </div>
                <div className="aa-filter-hint">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                    Showing: {getActiveFiltersDescription()}
                    {filterOptionsLoading && <span className="aa-subject-loading"><span className="aa-mini-spinner" /></span>}
                </div>
            </div>

            {/* ═══════════ CROSS-TERM BANNER (approved tab) ═══════════ */}
            {isCrossTermApproved && (
                <div className="aa-crossterm-banner">
                    <IconAlert />
                    <div>
                        <b>Approved records span {approvedSummary.byTerm.length} term/session periods.</b>
                        <div style={{ marginTop: 4 }}>
                            {approvedSummary.byTerm.map((t, i) => (
                                <span key={i} style={{ marginRight: 12 }}>
                                    {t.termName || 'Term'} {t.sessionName ? `(${t.sessionName})` : ''}: <b>{t.count}</b>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════ RESULTS INFO ═══════════ */}
            {!loading && assessments.length > 0 && (
                <div className="aa-results-info">
                    <span className="aa-results-count"><strong>{paginationRangeText}</strong></span>
                    <span className="aa-results-status" style={{ color: statusMeta.color }}>
                        <span className="aa-status-dot" style={{ display: 'inline-block', background: statusMeta.dot, marginRight: 6 }} />
                        {statusMeta.label}
                    </span>
                </div>
            )}

            {/* ═══════════ LOADING ═══════════ */}
            {loading && (
                <div className="aa-table-loading">
                    <div className="aa-inline-loader">
                        <span className="aa-loader-ring" />
                        <span className="aa-loader-ring" />
                        <span className="aa-loader-ring" />
                    </div>
                    Loading assessments…
                </div>
            )}

            {/* ═══════════ EMPTY ═══════════ */}
            {!loading && assessments.length === 0 && (
                <div className="aa-empty">
                    <div className="aa-empty-illustration"><IconUsers /></div>
                    <h3>No {statusMeta.label.toLowerCase()} assessments</h3>
                    <p>There are no {statusMeta.label.toLowerCase()} assessments for <b>{getActiveFiltersDescription()}</b>. Try adjusting the filters above.</p>
                </div>
            )}

            {/* ═══════════ DESKTOP TABLE ═══════════ */}
            {!loading && assessments.length > 0 && (
                <div className="aa-table-wrap">
                    <table className="aa-table">
                        <thead>
                            <tr>
                                <th className="aa-th-check" style={{ width: 40 }} title="Exclude from bulk actions">
                                    <ExcludeCheckbox checked={isAllExcluded} indeterminate={isSomeExcluded} onChange={toggleExcludeAll} />
                                </th>
                                <th>Student</th>
                                <th>Class</th>
                                <th>Subject</th>
                                <th className="aa-th-score">Test<span className="aa-th-max">/20</span></th>
                                <th className="aa-th-score">NT<span className="aa-th-max">/10</span></th>
                                <th className="aa-th-score">AS<span className="aa-th-max">/10</span></th>
                                <th className="aa-th-score">CA<span className="aa-th-max">/40</span></th>
                                <th className="aa-th-score">Exam<span className="aa-th-max">/60</span></th>
                                <th className="aa-th-total">Total<span className="aa-th-max">/100</span></th>
                                <th className="aa-th-score">Grade</th>
                                <th>Status</th>
                                <th className="aa-th-action">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assessments.map((a) => {
                                const meta = getStatusMeta(a.status);
                                const isApproved = a.status === 'approved';
                                return (
                                    <tr key={a._id} className={`aa-row--${a.status}`}>
                                        <td className="aa-th-check">
                                            <ExcludeCheckbox
                                                checked={excludedIds.has(a._id)}
                                                indeterminate={false}
                                                onChange={() => toggleExclude(a._id)}
                                            />
                                        </td>
                                        <td>
                                            <div className="aa-td-student">
                                                {/* ✅ OPTION 1 FIX — flat fields from API */}
                                                <span className="aa-student-name">{a.firstName} {a.lastName}</span>
                                                <span className="aa-student-id">{a.admissionNumber || '—'}</span>
                                            </div>
                                        </td>
                                        <td><span className="aa-tag aa-tag--class">{a.className || '—'}</span></td>
                                        <td><span className="aa-subject-name">{a.subjectName || '—'}</span></td>
                                        <td className="aa-td-score">{a.testScore ?? 0}</td>
                                        <td className="aa-td-score">{a.noteTakingScore ?? 0}</td>
                                        <td className="aa-td-score">{a.assignmentScore ?? 0}</td>
                                        <td className="aa-td-score">{a.totalCA ?? 0}</td>
                                        <td className="aa-td-score">{a.examScore ?? 0}</td>
                                        <td className="aa-td-total"><span className="aa-total-badge">{a.totalScore ?? 0}</span></td>
                                        <td className="aa-th-score">
                                            <span className="aa-grade-badge" style={{ background: getGradeBg(a.grade), color: getGradeColor(a.grade) }}>
                                                {a.grade || '—'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="aa-status-badge" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.borderColor}` }}>
                                                <span className="aa-status-dot" style={{ background: meta.dot }} />
                                                {meta.label}
                                            </span>
                                        </td>
                                        <td className="aa-td-action">
                                            {isApproved ? (
                                                unapprovingId === a._id
                                                    ? <span className="aa-btn-spinner aa-btn-spinner--sm aa-btn-spinner--red" style={{ display: 'inline-block' }} />
                                                    : (
                                                        <button
                                                            className="aa-unapprove-btn"
                                                            onClick={() => handleUnapprove(a._id)}
                                                            disabled={bulkLoading}
                                                            title="Return to Submitted"
                                                        >
                                                            <IconUndo /> Unapprove
                                                        </button>
                                                    )
                                            ) : (
                                                <button
                                                    className="aa-approve-btn"
                                                    onClick={() => handleApprove(a._id)}
                                                    disabled={bulkLoading}
                                                    title="Approve this assessment"
                                                >
                                                    <IconCheck /> Approve
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ═══════════ MOBILE CARDS ═══════════ */}
            {!loading && assessments.length > 0 && (
                <div className="aa-cards">
                    {assessments.map((a) => {
                        const meta = getStatusMeta(a.status);
                        const isApproved = a.status === 'approved';
                        return (
                            <div key={a._id} className={`aa-card aa-card--${a.status}`}>
                                <div className="aa-card-top">
                                    <div className="aa-card-student">
                                        {/* ✅ OPTION 1 FIX — flat fields from API */}
                                        <span className="aa-student-name">{a.firstName} {a.lastName}</span>
                                        <span className="aa-student-id">{a.admissionNumber || '—'}</span>
                                    </div>
                                    <span className="aa-status-badge" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.borderColor}` }}>
                                        <span className="aa-status-dot" style={{ background: meta.dot }} />
                                        {meta.label}
                                    </span>
                                </div>

                                <div className="aa-card-meta">
                                    <span className="aa-tag aa-tag--class">{a.className || '—'}</span>
                                    <span className="aa-subject-name">{a.subjectName || '—'}</span>
                                    <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                        Exclude
                                        <ExcludeCheckbox
                                            checked={excludedIds.has(a._id)}
                                            indeterminate={false}
                                            onChange={() => toggleExclude(a._id)}
                                        />
                                    </label>
                                </div>

                                <div className="aa-card-scores">
                                    <div className="aa-score-block">
                                        <span className="aa-score-label">Test</span>
                                        <span className="aa-score-value">{a.testScore ?? 0}<span className="aa-score-max">/20</span></span>
                                    </div>
                                    <span className="aa-score-divider">|</span>
                                    <div className="aa-score-block">
                                        <span className="aa-score-label">CA</span>
                                        <span className="aa-score-value">{a.totalCA ?? 0}<span className="aa-score-max">/40</span></span>
                                    </div>
                                    <span className="aa-score-divider">|</span>
                                    <div className="aa-score-block">
                                        <span className="aa-score-label">Exam</span>
                                        <span className="aa-score-value">{a.examScore ?? 0}<span className="aa-score-max">/60</span></span>
                                    </div>
                                    <div className="aa-score-block aa-score-block--total">
                                        <span className="aa-score-label">Total</span>
                                        <span className="aa-score-value aa-score-value--total">{a.totalScore ?? 0}</span>
                                    </div>
                                    <span className="aa-grade-badge aa-grade-badge--card" style={{ background: getGradeBg(a.grade), color: getGradeColor(a.grade) }}>
                                        {a.grade || '—'}
                                    </span>
                                </div>

                                <div className="aa-card-action">
                                    {isApproved ? (
                                        unapprovingId === a._id
                                            ? <span className="aa-btn-spinner aa-btn-spinner--sm aa-btn-spinner--red" style={{ display: 'inline-block' }} />
                                            : (
                                                <button className="aa-unapprove-btn" onClick={() => handleUnapprove(a._id)} disabled={bulkLoading}>
                                                    <IconUndo /> Unapprove
                                                </button>
                                            )
                                    ) : (
                                        <button className="aa-approve-btn" onClick={() => handleApprove(a._id)} disabled={bulkLoading}>
                                            <IconCheck /> Approve Assessment
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ═══════════ PAGINATION ═══════════ */}
            {!loading && totalResults > 0 && (
                <div className="aa-pagination">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="aa-results-count" style={{ fontSize: '0.78rem' }}>Rows:</span>
                        <div className="aa-select-wrap" style={{ width: 78 }}>
                            <select className="aa-select" value={pageSize} onChange={handlePageSizeChange} style={{ padding: '6px 28px 6px 10px', fontSize: '0.8rem' }}>
                                {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                            <span className="aa-select-chevron" style={{ right: 8 }}><IconChevron /></span>
                        </div>
                    </div>
                    <div className="aa-pagination-controls">
                        <button className="aa-page-btn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>‹</button>
                        {visiblePages.map((p, i) => (
                            p === '...'
                                ? <span key={`ell-${i}`} className="aa-page-ellipsis">…</span>
                                : (
                                    <button
                                        key={p}
                                        className={`aa-page-btn ${p === currentPage ? 'aa-page-btn--active' : ''}`}
                                        onClick={() => goToPage(p)}
                                    >
                                        {p}
                                    </button>
                                )
                        ))}
                        <button className="aa-page-btn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>›</button>
                    </div>
                </div>
            )}

            {/* ═══════════ CLEAR APPROVAL PANEL ═══════════ */}
            {showClearPanel && (
                <div className="aa-modal-overlay">
                    <div className="aa-modal">
                        <div className="aa-modal-header">
                            <div>
                                <h3 className="aa-modal-title">Clear Approval Status</h3>
                                <p className="aa-modal-subtitle">Reset approved CAs back to draft — scoped to {activeTermName || 'All Terms'} / {activeSessionName || 'All Sessions'}</p>
                            </div>
                            <button className="aa-modal-close" onClick={closeClearPanel} disabled={clearLoading}><IconX /></button>
                        </div>

                        <div className="aa-modal-body">
                            {(clearSuccess || clearError || clearInfo) && (
                                clearSuccess ? <div className="aa-info-banner aa-info-banner--success">{clearSuccess}</div>
                                : clearError ? <div className="aa-info-banner aa-info-banner--error">{clearError}</div>
                                : <div className={`aa-info-banner aa-info-banner--${clearInfo.type}`}>{clearInfo.message}</div>
                            )}

                            <div className="aa-filter-row">
                                <div className="aa-filter-field">
                                    <label>Class with approved records</label>
                                    <div className="aa-select-wrap">
                                        <select className="aa-select" value={clearClassId} onChange={handleClearClassChange} disabled={clearClassesLoading || clearLoading}>
                                            <option value="">{clearClassesLoading ? 'Loading classes…' : 'Select class'}</option>
                                            {clearClasses.map(c => <option key={c.classId} value={c.classId}>{clearClassLabel(c)}</option>)}
                                        </select>
                                        <span className="aa-select-chevron"><IconChevron /></span>
                                    </div>
                                </div>
                                <div className="aa-filter-field">
                                    <label>
                                        Subject (optional — leave blank to clear entire class)
                                        {clearSubjectsLoading && <span className="aa-subject-loading"><span className="aa-mini-spinner" /></span>}
                                    </label>
                                    <div className="aa-select-wrap">
                                        <select
                                            className="aa-select"
                                            value={clearSubjectId}
                                            onChange={handleClearSubjectChange}
                                            disabled={!clearClassId || clearSubjectsLoading || clearLoading}
                                        >
                                            <option value="">{!clearClassId ? 'Select a class first' : 'All subjects in class'}</option>
                                            {clearSubjects.map(s => <option key={s.subjectId} value={s.subjectId}>{clearSubjectLabel(s)}</option>)}
                                        </select>
                                        <span className="aa-select-chevron"><IconChevron /></span>
                                    </div>
                                </div>
                            </div>

                            {/* Preview */}
                            {clearSubjectId && (
                                clearPreviewLoading ? (
                                    <div className="aa-table-loading" style={{ margin: 0, padding: '28px 16px' }}>
                                        <div className="aa-inline-loader">
                                            <span className="aa-loader-ring" /><span className="aa-loader-ring" /><span className="aa-loader-ring" />
                                        </div>
                                        Loading preview…
                                    </div>
                                ) : clearPreview && (
                                    <div>
                                        <div className="aa-preview-head">
                                            <span className="aa-preview-title">
                                                {clearPreview.subjectInfo?.name || 'Subject'} — {clearPreview.totalRecords} record{clearPreview.totalRecords !== 1 ? 's' : ''}
                                            </span>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button className="aa-preview-toggle" onClick={toggleAllClearStudentsExclusion}>
                                                    {clearExcludedStudents.size === clearPreview.students.length ? 'Include all' : 'Exclude all'}
                                                </button>
                                                <button className="aa-preview-toggle" onClick={clearClearStudentExclusions}>Clear exclusions</button>
                                                <button className="aa-preview-toggle" onClick={() => setPreviewExpanded(v => !v)}>
                                                    {previewExpanded ? 'Hide ▲' : 'Show ▼'}
                                                </button>
                                            </div>
                                        </div>
                                        {previewExpanded && (
                                            <div className="aa-preview-list" style={{ marginTop: 8 }}>
                                                {clearPreview.students.map(s => {
                                                    const excluded = clearExcludedStudents.has(s.studentId);
                                                    return (
                                                        <div key={s.studentId} className={`aa-preview-row ${excluded ? 'aa-preview-row--excluded' : ''}`}>
                                                            <ExcludeCheckbox checked={excluded} indeterminate={false} onChange={() => toggleClearStudentExclusion(s.studentId)} />
                                                            <span className="aa-preview-name" title={s.name}>{s.name}</span>
                                                            <span className="aa-preview-id">{s.admissionNumber || '—'}</span>
                                                            <span className="aa-preview-score">{s.totalScore}</span>
                                                            <span className="aa-grade-badge" style={{ background: getGradeBg(s.grade), color: getGradeColor(s.grade), minWidth: 28, height: 22, fontSize: '0.72rem' }}>{s.grade || '—'}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {clearExcludedStudents.size > 0 && (
                            <div className="aa-info-banner aa-info-banner--info" style={{ marginTop: 8 }}>
                                                {clearExcludedStudents.size} student{clearExcludedStudents.size !== 1 ? 's' : ''} excluded — {getEffectiveClearCount()} record{getEffectiveClearCount() !== 1 ? 's' : ''} will be cleared.
                                            </div>
                                        )}
                                    </div>
                                )
                            )}

                            {clearProgress.total > 0 && (
                                <div className="aa-info-banner aa-info-banner--info">{clearProgress.phase}</div>
                            )}
                        </div>

                        <div className="aa-modal-footer">
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {clearClassId
                                    ? clearSubjectId
                                        ? `Ready to clear "${clearSubjects.find(s => s.subjectId === clearSubjectId)?.subjectName || 'selected subject'}" records.`
                                        : `Ready to clear ALL approved records in this class.`
                                    : 'Select a class to begin.'}
                            </span>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="aa-btn aa-btn-outline-secondary" onClick={closeClearPanel} disabled={clearLoading}>Cancel</button>
                                <button
                                    className="aa-btn aa-btn-danger"
                                    disabled={!clearClassId || clearLoading || (clearSubjectId && getEffectiveClearCount() === 0)}
                                    onClick={() => {
                                        if (clearConfirmAction) { handleConfirmClear(); setClearConfirmAction(null); }
                                        else setClearConfirmAction({ type: clearSubjectId ? 'subject' : 'class' });
                                    }}
                                >
                                    {clearLoading
                                        ? <><span className="aa-btn-spinner" /> Clearing…</>
                                        : clearConfirmAction
                                            ? 'Click again to confirm'
                                            : `Clear${clearSubjectId && clearPreview ? ` ${getEffectiveClearCount()} Record${getEffectiveClearCount() !== 1 ? 's' : ''}` : ' Approvals'}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApproveAssessments;