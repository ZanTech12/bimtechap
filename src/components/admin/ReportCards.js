import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { classesAPI, termsAPI, reportCardsAPI } from '../../api';
import { useSchoolSettings } from '../../hooks/useSchoolSettings';
import './ReportCards.css';

// ✅ FIXED: Prisma migration — IDs are now Int `id` (was Mongo `_id`)
const docId = (o) => o?._id ?? o?.id ?? null;

// Modern Skeleton Loader for Cards
const SkeletonCard = () => (
  <div className="rc-card rc-skeleton-wrapper">
    <div className="rc-card-header">
      <div className="rc-icon-box skeleton-shimmer"></div>
      <div className="rc-header-text">
        <div className="skeleton-shimmer skeleton-line w-60"></div>
        <div className="skeleton-shimmer skeleton-line w-40 mt-1"></div>
      </div>
    </div>
    <div className="rc-card-body">
      <div className="skeleton-shimmer skeleton-block h-40"></div>
    </div>
    <div className="rc-card-footer">
      <div className="skeleton-shimmer skeleton-line w-100"></div>
    </div>
  </div>
);

// Sub-component to display individual class comment status
// Receives pre-fetched `status` prop — no N+1 API calls.
const ClassCard = ({
  cls,
  status,         // Pre-fetched status object for this class
  classId,        // ✅ FIXED: resolved once by parent (id or _id)
  navigate,
  isSelected,
  onToggleSelect,
  onPrint
}) => {
  const totalClassTeacherRemarks = status?.classTeacherCommentCount || 0;
  const totalSubjectRemarks = status?.teacherCommentCount || 0;
  const uniqueSubjects = status?.uniqueSubjectsCount || 0;

  const hasRequiredData = totalClassTeacherRemarks > 0 || totalSubjectRemarks > 0;

  const getCardStatusStyle = () => {
    if (!hasRequiredData) return 'border-neutral';
    if (totalClassTeacherRemarks > 0 && totalSubjectRemarks > 0) return 'border-success';
    return 'border-warning';
  };

  const handleCardClick = (e) => {
    if (
      e.target.closest('.rc-checkbox-wrapper') ||
      e.target.closest('.rc-print-btn') ||
      e.target.closest('.rc-action-btn')
    ) {
      return;
    }
    if (classId != null) {
      navigate(`/admin/report-cards/class/${classId}?termId=${status?.termId}`);
    }
  };

  const handlePrintClick = (e) => {
    e.stopPropagation();
    onPrint(classId);
  };

  return (
    <div
      className={`rc-card ${getCardStatusStyle()} ${isSelected ? 'rc-card-selected' : ''}`}
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Header with Checkbox */}
      <div className="rc-card-header">
        <div className="rc-checkbox-wrapper">
          <label className="rc-checkbox-label">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelect(classId);
              }}
              className="rc-checkbox-input"
            />
            <span className="rc-checkbox-custom"></span>
          </label>
        </div>
        <div className="rc-icon-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
        </div>
        <div className="rc-header-text">
          <h3>{cls.name} {cls.section}</h3>
          <p>{cls.level}</p>
        </div>
      </div>

      {/* Body Status */}
      <div className="rc-card-body">
        <div className="rc-status-container">
          {/* Class Teacher Status */}
          <div className="rc-status-row">
            <span className="rc-status-label">Class Teacher</span>
            {totalClassTeacherRemarks > 0 ? (
              <span className="rc-badge success">
                <span className="rc-dot"></span>
                {totalClassTeacherRemarks} Comment{totalClassTeacherRemarks > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="rc-badge warning">
                <span className="rc-dot"></span>
                Pending
              </span>
            )}
          </div>

          {/* Subject Remarks Status */}
          <div className="rc-status-row">
            <span className="rc-status-label">Subjects</span>
            {totalSubjectRemarks > 0 ? (
              <span className="rc-badge success">
                <span className="rc-dot"></span>
                {uniqueSubjects > 0
                  ? `${uniqueSubjects} Subject${uniqueSubjects > 1 ? 's' : ''}`
                  : `${totalSubjectRemarks} Remark${totalSubjectRemarks > 1 ? 's' : ''}`
                }
              </span>
            ) : (
              <span className="rc-badge warning">
                <span className="rc-dot"></span>
                No Remarks
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="rc-card-footer">
        <div className="rc-footer-actions">
          <button
            className="rc-action-btn rc-action-secondary"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick(e);
            }}
          >
            View
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
          <button
            className="rc-action-btn rc-print-btn"
            onClick={handlePrintClick}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

const ReportCards = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [terms, setTerms] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClasses, setSelectedClasses] = useState(new Set());
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // ✅ LIVE SCHOOL SETTINGS — name, address, website, email, motto, logo
  const school = useSchoolSettings();

  useEffect(() => {
    fetchData();
  }, []);

  // Reset selections when term changes
  useEffect(() => {
    setSelectedClasses(new Set());
  }, [selectedTerm]);

  const fetchData = async () => {
    try {
      setError(null);
      const [classesRes, termsRes] = await Promise.all([
        classesAPI.getAllForDropdown(),
        termsAPI.getAll()
      ]);

      const classesData = classesRes?.data?.data || classesRes?.data || classesRes || [];
      setClasses(Array.isArray(classesData) ? classesData : []);

      const termsData = termsRes?.data || termsRes || [];
      setTerms(Array.isArray(termsData) ? termsData : []);

      const active = Array.isArray(termsData)
        ? termsData.find(t => t.status === 'active' || t.isActive)
        : null;
      // ✅ FIXED: docId — was active._id (undefined on Prisma backend)
      if (active) setSelectedTerm(docId(active));
    } catch (err) {
      console.error("Error fetching report card data:", err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Single optimized query replacing N+1 calls
  const {
    data: statusMap,
    isLoading: isStatusLoading,
    isError: isStatusError
  } = useQuery({
    queryKey: ['report-card-status', selectedTerm],
    queryFn: () => reportCardsAPI.getStatus(selectedTerm),
    enabled: !!selectedTerm && !loading,
    staleTime: 60000,
    // ✅ FIXED: tolerant normalizer — accepts { [classId]: {...} } map OR
    // an array of { classId / classInfo / class, ...counts }
    select: (res) => {
      const d = res?.data || res || {};
      if (Array.isArray(d)) {
        const map = {};
        d.forEach((s) => {
          const key = s.classId ?? docId(s.classInfo) ?? docId(s.class);
          if (key != null) map[key.toString()] = s;
        });
        return map;
      }
      return d;
    }
  });

  const selectedTermObj = useMemo(() => {
    return terms.find(t => docId(t) === Number(selectedTerm) || docId(t) === selectedTerm);
  }, [terms, selectedTerm]);

  const toggleClassSelection = useCallback((classId) => {
    setSelectedClasses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(classId)) {
        newSet.delete(classId);
      } else {
        newSet.add(classId);
      }
      return newSet;
    });
  }, []);

  const selectAllClasses = useCallback(() => {
    const allIds = classes.map(c => docId(c));
    if (selectedClasses.size === allIds.length) {
      setSelectedClasses(new Set());
    } else {
      setSelectedClasses(new Set(allIds));
    }
  }, [selectedClasses.size, classes]);

  const handleSinglePrint = useCallback((classId) => {
    navigate(`/admin/report-cards/print?termId=${selectedTerm}&classIds=${classId}`);
  }, [navigate, selectedTerm]);

  const handleBulkPrint = useCallback(async () => {
    if (selectedClasses.size === 0) return;

    setIsPrinting(true);
    try {
      const classIds = Array.from(selectedClasses).join(',');
      navigate(`/admin/report-cards/print?termId=${selectedTerm}&classIds=${classIds}`);
    } catch (err) {
      console.error('Print error:', err);
    } finally {
      setIsPrinting(false);
      setShowPrintModal(false);
    }
  }, [selectedClasses, navigate, selectedTerm]);

  const handlePrintAll = useCallback(() => {
    if (classes.length === 0) return;

    setIsPrinting(true);
    try {
      // ✅ FIXED: docId — was classes.map(c => c._id)
      const classIds = classes.map(c => docId(c)).join(',');
      navigate(`/admin/report-cards/print?termId=${selectedTerm}&classIds=${classIds}`);
    } catch (err) {
      console.error('Print error:', err);
    } finally {
      setIsPrinting(false);
      setShowPrintModal(false);
    }
  }, [classes, navigate, selectedTerm]);

  const isAllSelected = classes.length > 0 && selectedClasses.size === classes.length;
  const isSomeSelected = selectedClasses.size > 0 && selectedClasses.size < classes.length;

  // Determine loading state (initial load OR status fetch)
  const isGridLoading = loading || isStatusLoading;

  return (
    <div className="rc-page">
      {/* ✅ LIVE SCHOOL BRANDING STRIP (site settings) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '14px 18px',
          marginBottom: 16,
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
        }}
      >
        {school.logoUrl ? (
          <img
            src={school.logoUrl}
            alt={`${school.name || 'School'} logo`}
            style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : null}
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.02em' }}>
            {school.name || 'School Report Cards'}
          </h2>
          {(school.address || school.website || school.email || school.motto) && (
            <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: '#64748b' }}>
              {[school.address, school.website, school.email, school.motto ? `"${school.motto}"` : ''].filter(Boolean).join('  •  ')}
            </p>
          )}
        </div>
      </div>

      {/* Header Section */}
      <div className="rc-top-bar">
        <div className="rc-title-section">
          <h1>Report Cards</h1>
          <p className="rc-subtitle">Manage and preview teacher remarks before generating.</p>
        </div>
        <div className="rc-header-controls">
          <div className="rc-filter-wrapper">
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              disabled={loading}
              className="rc-select"
            >
              <option value="" disabled>Select Term</option>
              {/* ✅ FIXED: docId for keys/values */}
              {terms.map(t => (
                <option key={docId(t)} value={docId(t)}>
                  {t.name}{t.session?.name ? ` • ${t.session.name}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedTerm && !loading && classes.length > 0 && (
        <div className="rc-bulk-bar">
          <div className="rc-bulk-left">
            <label className="rc-checkbox-label rc-select-all-label">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(el) => { if (el) el.indeterminate = isSomeSelected; }}
                onChange={selectAllClasses}
                className="rc-checkbox-input"
              />
              <span className="rc-checkbox-custom"></span>
              <span className="rc-select-all-text">
                {isAllSelected
                  ? 'Deselect All'
                  : isSomeSelected
                    ? `${selectedClasses.size} Selected`
                    : 'Select All'
                }
              </span>
            </label>
          </div>
          <div className="rc-bulk-right">
            <button
              className="rc-bulk-btn rc-bulk-btn-primary"
              onClick={handlePrintAll}
              disabled={isPrinting}
            >
              {isPrinting ? (
                <>
                  <span className="rc-spinner"></span>
                  Printing...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                  </svg>
                  Print All Classes
                </>
              )}
            </button>
            <button
              className="rc-bulk-btn rc-bulk-btn-secondary"
              onClick={() => setShowPrintModal(true)}
              disabled={selectedClasses.size === 0}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              Print Selected
              {selectedClasses.size > 0 && (
                <span className="rc-bulk-count">{selectedClasses.size}</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Print Confirmation Modal */}
      {showPrintModal && (
        <div className="rc-modal-overlay" onClick={() => setShowPrintModal(false)}>
          <div className="rc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rc-modal-header">
              <h3>Confirm Bulk Print</h3>
              <button
                className="rc-modal-close"
                onClick={() => setShowPrintModal(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="rc-modal-body">
              <div className="rc-modal-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9"></polyline>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
              </div>
              <p className="rc-modal-text">
                You are about to generate report cards for <strong>{selectedClasses.size} class{selectedClasses.size > 1 ? 'es' : ''}</strong>.
              </p>
              <div className="rc-modal-classes-preview">
                {classes
                  .filter(c => selectedClasses.has(docId(c)))
                  .map(c => (
                    <span key={docId(c)} className="rc-modal-class-tag">
                      {c.name} {c.section}
                    </span>
                  ))
                }
              </div>
              <p className="rc-modal-subtext">
                Term: <strong>{selectedTermObj?.name}</strong>
                {selectedTermObj?.session?.name && <> • Session: <strong>{selectedTermObj.session.name}</strong></>}
              </p>
            </div>
            <div className="rc-modal-footer">
              <button
                className="rc-modal-btn rc-modal-btn-cancel"
                onClick={() => setShowPrintModal(false)}
              >
                Cancel
              </button>
              <button
                className="rc-modal-btn rc-modal-btn-confirm"
                onClick={handleBulkPrint}
                disabled={isPrinting}
              >
                {isPrinting ? (
                  <>
                    <span className="rc-spinner"></span>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Generate Report Cards
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Banners */}
      {error && (
        <div className="rc-banner error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <div className="rc-banner-content">
            <strong>Connection Error</strong>
            <span>{error}</span>
          </div>
          <button onClick={fetchData} className="rc-banner-btn">Retry</button>
        </div>
      )}

      {!selectedTerm && !loading && !error && (
        <div className="rc-banner info">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          <span>Please select a term from the dropdown to view class statuses.</span>
        </div>
      )}

      {isStatusError && selectedTerm && (
        <div className="rc-banner error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          <div className="rc-banner-content">
            <strong>Status Fetch Error</strong>
            <span>Failed to load report card statuses.</span>
          </div>
          <button onClick={() => window.location.reload()} className="rc-banner-btn">Reload</button>
        </div>
      )}

      {!loading && !error && classes.length === 0 && (
        <div className="rc-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
          <h3>No Classes Found</h3>
          <p>You need to add classes before you can manage report cards.</p>
        </div>
      )}

      {/* Grid Layout */}
      {isGridLoading ? (
        <div className="rc-grid">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="rc-grid">
          {classes.map(cls => {
            const classId = docId(cls); // ✅ FIXED: resolved once, used everywhere
            return (
              <ClassCard
                key={classId}
                cls={cls}
                classId={classId}
                status={{
                  ...(statusMap?.[classId] || statusMap?.[String(classId)] || {}),
                  termId: selectedTerm
                }}
                navigate={navigate}
                isSelected={selectedClasses.has(classId)}
                onToggleSelect={toggleClassSelection}
                onPrint={handleSinglePrint}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReportCards;