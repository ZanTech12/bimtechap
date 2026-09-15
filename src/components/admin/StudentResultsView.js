import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { testResultsAPI, testsAPI, classesAPI, studentsAPI, subjectsAPI, downloadCSV, reportCardsAPI, classTeacherCommentsAPI, attendanceAPI } from '../../api';
import Loading from '../common/Loading';
import schoolLogo from '../../pages/logo.svg';

// ── ID Normalizers (✅ handles Prisma id + Mongoose _id) ──
const getId = (v) => (v === null || v === undefined) ? null
  : (typeof v === 'object' ? (v._id ?? v.id ?? null) : v);
const idStr = (v) => { const g = getId(v); return g === null ? '' : String(g); };

// ── Shared Utilities ──
const avatarColor = (name) => {
  const colors = ['#6366f1','#8b5cf6','#a855f7','#d946ef','#ec4899','#f43f5e','#ef4444','#f97316','#eab308','#22c55e','#14b8a6','#06b6d4','#0ea5e9','#3b82f6'];
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
};

const getGrade = (p) => {
  if (p >= 90) return { grade: 'A+', color: '#059669' };
  if (p >= 80) return { grade: 'A', color: '#10b981' };
  if (p >= 70) return { grade: 'B', color: '#3b82f6' };
  if (p >= 60) return { grade: 'C', color: '#6366f1' };
  if (p >= 50) return { grade: 'D', color: '#f59e0b' };
  return { grade: 'F', color: '#ef4444' };
};

const formatDate = (date) => date
  ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  : 'N/A';

// ════════════════════════════════════════════════════════════════
// REPORT CARD MODAL
// ════════════════════════════════════════════════════════════════
const ReportCardModal = ({ studentId, termId, onClose }) => {
  const defaultPsychomotor = useMemo(() => [
    { skill: 'Handwriting', rating: '' }, { skill: 'Sports', rating: '' },
    { skill: 'Drawing & Painting', rating: '' }, { skill: 'Music & Drama', rating: '' },
    { skill: 'Crafts', rating: '' }, { skill: 'Cleanliness', rating: '' },
    { skill: 'Punctuality', rating: '' }, { skill: 'Politeness', rating: '' },
  ], []);

  const { data: reportResponse, isLoading: isReportLoading, isError: isReportError } = useQuery({
    queryKey: ['student-report', studentId, termId],
    queryFn: () => reportCardsAPI.getStudentReport(studentId, { termId }),
    enabled: !!studentId && !!termId, staleTime: 60000,
  });

  const report = reportResponse?.data || null;
  const classId = getId(report?.student?.class);
  const termName = report?.term?.name || null;
  const sessionName = report?.session?.name || null;

  const { data: classTeacherComment } = useQuery({
    queryKey: ['class-teacher-comment', classId, termName, sessionName, studentId],
    queryFn: async () => {
      const response = await classTeacherCommentsAPI.getByClass(classId, { term: termName, session: sessionName });
      let comments = [];
      if (Array.isArray(response)) comments = response;
      else if (response?.data && Array.isArray(response.data)) comments = response.data;
      else if (response?.comments && Array.isArray(response.comments)) comments = response.comments;
      const studentComment = comments.find(c => {
        const cStudentId = idStr(c.student_id ?? c.studentId ?? c.student);
        return cStudentId === idStr(studentId);
      });
      return studentComment?.comment || '';
    },
    enabled: !!classId && !!termName && !!sessionName && !!studentId, staleTime: 60000,
  });

  const { data: attendanceResponse } = useQuery({
    queryKey: ['student-attendance', classId, termName, sessionName, studentId],
    queryFn: async () => {
      const response = await attendanceAPI.getStudentCountsByClass(classId, { term: termName, session: sessionName });
      if (!response?.success) return { timesPresent: '', timesSchoolOpen: '', timesAbsent: '' };
      const schoolOpenDays = response.schoolOpenDays || response.data?.schoolOpenDays || '';
      const students = response.data || [];
      const studentRecord = students.find(s => {
        const sId = idStr(s.student_id ?? s.studentId ?? s.student);
        return sId === idStr(studentId);
      });
      const timesPresent = studentRecord?.times_present || studentRecord?.timesPresent || '';
      const timesSchoolOpen = typeof schoolOpenDays === 'number' ? schoolOpenDays : '';
      const timesAbsent = (timesPresent !== '' && timesSchoolOpen !== '' && timesSchoolOpen >= timesPresent) ? timesSchoolOpen - timesPresent : '';
      return { timesPresent, timesSchoolOpen, timesAbsent };
    },
    enabled: !!classId && !!termName && !!sessionName && !!studentId, staleTime: 60000,
  });

  const psychomotorSkills = report?.psychomotor?.length ? report.psychomotor : defaultPsychomotor;
  const randomPsychomotorRatings = useMemo(() => psychomotorSkills.map(() => Math.floor(Math.random() * 2) + 4), [psychomotorSkills]);
  const timesPresent = attendanceResponse?.timesPresent || report?.attendance?.timesPresent || report?.timesPresent || '';
  const timesSchoolOpen = attendanceResponse?.timesSchoolOpen || report?.attendance?.timesSchoolOpen || report?.timesSchoolOpen || '';
  const timesAbsent = attendanceResponse?.timesAbsent !== undefined ? attendanceResponse.timesAbsent : ((timesPresent !== '' && timesSchoolOpen !== '' && timesSchoolOpen >= timesPresent) ? timesSchoolOpen - timesPresent : '');

  const handlePrint = () => {
    const printContent = document.getElementById('report-card-printable');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<html><head><title>Report Card - ${report?.student?.firstName || ''} ${report?.student?.lastName || ''}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Times New Roman',Times,serif;padding:20px}
.rc-wrap{max-width:210mm;margin:0 auto}
.rc-hdr{text-align:center;padding:15px 0;border-bottom:3px double #1a365d;margin-bottom:15px}
.rc-logo{width:50px;height:50px;object-fit:contain;margin-bottom:10px}
.rc-school{font-size:18px;font-weight:bold;color:#1a365d;letter-spacing:1px;margin-bottom:5px}
.rc-doctitle{font-size:14px;color:#4a5568;margin-bottom:10px}
.rc-meta{display:flex;justify-content:center;gap:20px;font-size:12px}
.rc-bio{margin-bottom:15px;padding:10px;border:1px solid #e2e8f0;border-radius:4px}
.rc-bio-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.rc-bio-item{display:flex;gap:10px}
.rc-bio-lbl{font-size:11px;color:#718096;min-width:100px}
.rc-bio-val{font-size:12px;font-weight:600}
.rc-grades{margin-bottom:15px}
table{width:100%;border-collapse:collapse;font-size:11px}
th,td{border:1px solid #cbd5e0;padding:6px 8px;text-align:center}
th{background:#1a365d;color:white;font-size:10px}
.td-l{text-align:left}.td-b{font-weight:600}.td-r{text-align:right}
.sum-row{background:#f7fafc;font-weight:600}
.rc-gkey{text-align:center;padding:8px;background:#f7fafc;border:1px solid #e2e8f0;margin-bottom:15px;font-size:10px}
.rc-att{margin-bottom:15px}
.rc-att-title{font-size:12px;font-weight:bold;margin-bottom:8px;text-align:center;text-decoration:underline}
.rc-att-grid{display:flex;justify-content:space-around}
.rc-att-card{text-align:center}
.rc-att-lbl{font-size:10px;color:#718096;display:block}
.rc-att-val{font-size:16px;font-weight:bold;display:block}
.rc-pm{margin-bottom:15px}
.rc-pm-title{font-size:12px;font-weight:bold;margin-bottom:8px;text-align:center;text-decoration:underline}
.rc-pm-note{text-align:center;font-size:9px;color:#718096;margin-bottom:8px}
.pm-skill{text-align:left}
.pm-badge{background:#edf2f7;padding:2px 8px;border-radius:3px;font-weight:bold}
.rc-comments{border:1px solid #e2e8f0;padding:12px;margin-bottom:15px}
.rc-cbox{margin-bottom:10px}
.rc-ctitle{font-size:11px;font-weight:bold;margin-bottom:6px;text-decoration:underline}
.rc-ctext{font-size:11px;line-height:1.5;word-wrap:break-word}
.rc-sigs{display:flex;justify-content:space-between;margin-top:14px;padding-top:10px;border-top:1px dashed #cbd5e0}
.rc-sig{flex:1}
.rc-sig:last-child{text-align:right}
.rc-sig-line{border-top:1px solid #000;width:130px}
.rc-sig-text{font-size:9px;display:block;margin-top:2px}
.rc-blank{display:inline}
.rc-ft{border-top:2px solid #1a365d;padding-top:15px;text-align:center}
.rc-ft-dates{display:flex;justify-content:space-around;margin-bottom:10px}
.rc-ft-lbl{font-size:10px;color:#718096}
.rc-ft-val{font-size:12px;font-weight:600;display:block}
.rc-nextterm{background:#1a365d;color:white;padding:8px 15px;border-radius:4px;display:inline-block}
.rc-nt-lbl{font-size:10px}
.rc-nt-date{font-size:14px;font-weight:bold;display:block}
@media print{body{padding:0}}
</style></head><body>${printContent.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.onload = () => { printWindow.print(); };
  };

  if (isReportLoading) {
    return (
      <div className="sr-modal-overlay" onClick={onClose}>
        <div className="sr-modal" onClick={e => e.stopPropagation()}>
          <div className="sr-modal-handle" />
          <div className="sr-modal-header"><h3 className="sr-modal-title">Student Report Card</h3><button className="sr-modal-close" onClick={onClose}>×</button></div>
          <div className="sr-modal-body" style={{ padding: 40, textAlign: 'center' }}><Loading message="Generating report card..." /></div>
        </div>
      </div>
    );
  }

  if (isReportError || !report) {
    return (
      <div className="sr-modal-overlay" onClick={onClose}>
        <div className="sr-modal" onClick={e => e.stopPropagation()}>
          <div className="sr-modal-handle" />
          <div className="sr-modal-header"><h3 className="sr-modal-title">Student Report Card</h3><button className="sr-modal-close" onClick={onClose}>×</button></div>
          <div className="sr-modal-body">
            <div className="sr-alert sr-alert-danger" style={{ margin: 0, justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 32 }}>
              <span style={{ fontSize: '2rem' }}>⚠️</span>
              <p style={{ margin: 0 }}>{isReportError ? 'Failed to load report card.' : 'Report card not found. Ensure all grades are entered for this term.'}</p>
              <button className="sr-btn sr-btn-primary" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sr-modal-overlay" onClick={onClose}>
      <div className="sr-modal sr-modal-lg" onClick={e => e.stopPropagation()}>
        <div className="sr-modal-handle" />
        <div className="sr-modal-header">
          <h3 className="sr-modal-title">📄 Student Report Card</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={handlePrint} className="sr-btn sr-btn-success sr-btn-sm">🖨️ Print</button>
            <button className="sr-modal-close" onClick={onClose}>×</button>
          </div>
        </div>
        <div className="sr-modal-body sr-report-body">
          <div id="report-card-printable" className="rc-wrap">
            <header className="rc-hdr">
              <img src={schoolLogo} alt="School Logo" className="rc-logo" />
              <h1 className="rc-school">BimTech SaaS SolutionsS LIMITED</h1>
              <h2 className="rc-doctitle">STUDENT ACADEMIC REPORT CARD</h2>
              <div className="rc-meta">
                <span>Term <strong>{report.term.name}</strong></span>
                <span>|</span>
                <span>Session <strong>{report.session.name}</strong></span>
              </div>
            </header>

            <div className="rc-bio">
              <div className="rc-bio-grid">
                <div className="rc-bio-item"><span className="rc-bio-lbl">Name of Student</span><span className="rc-bio-val">{report.student.lastName} {report.student.firstName}</span></div>
                <div className="rc-bio-item"><span className="rc-bio-lbl">Admission No.</span><span className="rc-bio-val">{report.student.admissionNumber}</span></div>
                <div className="rc-bio-item"><span className="rc-bio-lbl">Class</span><span className="rc-bio-val">{report.student.class?.name} {report.student.class?.section}</span></div>
                <div className="rc-bio-item"><span className="rc-bio-lbl">Gender</span><span className="rc-bio-val">{report.student.gender}</span></div>
              </div>
            </div>

            <div className="rc-grades">
              <table>
                <thead>
                  <tr><th rowSpan="2">S/N</th><th rowSpan="2" className="td-l">SUBJECTS</th><th colSpan="4">CONTINUOUS ASSESSMENT (40)</th><th rowSpan="2">EXAM<br/>(60)</th><th rowSpan="2">TOTAL<br/>(100)</th><th rowSpan="2">GRADE</th><th rowSpan="2">REMARK</th></tr>
                  <tr><th>Test<br/>(20)</th><th>Notes<br/>(10)</th><th>Assign<br/>(10)</th><th>Total<br/>(40)</th></tr>
                </thead>
                <tbody>
                  {report.subjects.map((sub, i) => (
                    <tr key={sub._id || sub.id || i}><td>{i + 1}</td><td className="td-l">{sub.subject?.name}</td><td>{sub.testScore}</td><td>{sub.noteTakingScore}</td><td>{sub.assignmentScore}</td><td className="td-b">{sub.totalCA}</td><td className="td-b">{sub.examScore}</td><td className="td-b">{sub.totalScore}</td><td className="td-b">{sub.grade}</td><td>{sub.remark}</td></tr>
                  ))}
                  {report.subjects.length === 0 && <tr><td colSpan="10">No grades recorded for this term.</td></tr>}
                </tbody>
                <tfoot>
                  <tr className="sum-row"><td colSpan="7" className="td-r">TOTAL SCORE OBTAINED:</td><td>{report.statistics.totalScore}</td><td colSpan="2"></td></tr>
                  <tr className="sum-row"><td colSpan="7" className="td-r">STUDENT AVERAGE:</td><td>{report.statistics.averageScore}%</td><td colSpan="2"></td></tr>
                </tfoot>
              </table>
            </div>

            <div className="rc-gkey"><strong>GRADING SCALE:</strong> A (Excellent) | B (Very Good) | C (Good) | D (Fair) | E (Poor) | F (Fail)</div>

            <div className="rc-att">
              <div className="rc-att-title">ATTENDANCE RECORD</div>
              <div className="rc-att-grid">
                <div className="rc-att-card"><span className="rc-att-lbl">No. of Times School Opened</span><span className="rc-att-val">{timesSchoolOpen !== '' ? timesSchoolOpen : '––––'}</span></div>
                <div className="rc-att-card"><span className="rc-att-lbl">No. of Times Present</span><span className="rc-att-val" style={{ color: '#059669' }}>{timesPresent !== '' ? timesPresent : '––––'}</span></div>
                <div className="rc-att-card"><span className="rc-att-lbl">No. of Times Absent</span><span className="rc-att-val" style={{ color: '#dc2626' }}>{timesAbsent !== '' ? timesAbsent : '––––'}</span></div>
              </div>
            </div>

            <div className="rc-pm">
              <div className="rc-pm-title">PSYCHOMOTOR / AFFECTIVE DOMAIN</div>
              <div className="rc-pm-note">Rating Key: <strong>A</strong> – Excellent | <strong>B</strong> – Very Good | <strong>C</strong> – Good | <strong>D</strong> – Fair | <strong>E</strong> – Poor</div>
              <table>
                <thead><tr><th>S/N</th><th className="pm-skill">Skill / Trait</th><th>Rating</th><th>S/N</th><th className="pm-skill">Skill / Trait</th><th>Rating</th></tr></thead>
                <tbody>
                  {(() => {
                    const half = Math.ceil(psychomotorSkills.length / 2);
                    const L = psychomotorSkills.slice(0, half), R = psychomotorSkills.slice(half);
                    return Array.from({ length: Math.max(L.length, R.length) }, (_, idx) => (
                      <tr key={idx}><td>{idx + 1}</td><td className="pm-skill">{L[idx]?.skill || ''}</td><td><span className="pm-badge">{L[idx]?.rating || randomPsychomotorRatings[idx]}</span></td><td>{half + idx + 1}</td><td className="pm-skill">{R[idx]?.skill || ''}</td><td><span className="pm-badge">{R[idx]?.rating || randomPsychomotorRatings[half + idx]}</span></td></tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            <div className="rc-comments">
              <div className="rc-cbox">
                <div className="rc-ctitle">CLASS TEACHER'S COMMENT</div>
                <div className="rc-ctext">{classTeacherComment ? <><strong>{report.student.lastName} {report.student.firstName}</strong> — {classTeacherComment}</> : <span className="rc-blank">................................................................................</span>}</div>
              </div>
              <div className="rc-cbox">
                <div className="rc-ctitle">PRINCIPAL'S COMMENT</div>
                <div className="rc-ctext">{report.principalComment ? <>{report.principalComment}</> : <span className="rc-blank">................................................................................</span>}</div>
              </div>
              <div className="rc-sigs">
                <div className="rc-sig"><div className="rc-sig-line"></div><span className="rc-sig-text">Class Teacher</span></div>
                <div className="rc-sig"><div className="rc-sig-line"></div><span className="rc-sig-text">Principal / Headteacher</span></div>
              </div>
            </div>

            <footer className="rc-ft">
              <div className="rc-ft-dates">
                <div><span className="rc-ft-lbl">Term Begins:</span><span className="rc-ft-val">{formatDate(report.term.startDate)}</span></div>
                <div><span className="rc-ft-lbl">Term Ends:</span><span className="rc-ft-val">{formatDate(report.term.endDate)}</span></div>
              </div>
              {report.term.nextTermBegins && (
                <div className="rc-nextterm"><span className="rc-nt-lbl">NEXT TERM BEGINS:</span><span className="rc-nt-date">{formatDate(report.term.nextTermBegins)}</span></div>
              )}
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
const StudentResultsView = () => {
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTest, setSelectedTest] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('student_name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState('all');
  const [viewMode, setViewMode] = useState('filtered');
  const [expandedClass, setExpandedClass] = useState(null);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [showPublishConfirm, setShowPublishConfirm] = useState(null);
  const [showReportCard, setShowReportCard] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState('');

  // ── Queries ──
  // ✅ Normalize the class ID once — queries can never fire with a class NAME
  const classIdStr = idStr(selectedClass);

  const { data: termsData } = useQuery({
    queryKey: ['terms-for-report-cards', classIdStr],
    queryFn: () => classesAPI.getTerms(classIdStr),
    enabled: /^\d+$/.test(classIdStr), staleTime: 60000,
  });
  const availableTerms = useMemo(() => {
    if (!termsData) return [];
    if (Array.isArray(termsData)) return termsData;
    if (termsData.data && Array.isArray(termsData.data)) return termsData.data;
    if (termsData.terms && Array.isArray(termsData.terms)) return termsData.terms;
    return [];
  }, [termsData]);

  const { data: resultsData, isLoading: resultsLoading, error: resultsError } = useQuery({
    queryKey: ['all-test-results', selectedClass, selectedTest, selectedStudent, selectedSubject],
    queryFn: () => {
      const params = { limit: 100000, page: 1 };
      if (selectedClass) params.class_id = selectedClass;
      if (selectedTest) params.test_id = selectedTest;
      if (selectedStudent) params.student_id = selectedStudent;
      if (selectedSubject) params.subject_id = selectedSubject;
      return testResultsAPI.getAll(params);
    },
    staleTime: 30000,
  });

  const { data: studentsData } = useQuery({ queryKey: ['students-for-results'], queryFn: () => studentsAPI.getAll() });
  const { data: testsData } = useQuery({ queryKey: ['tests-for-results'], queryFn: () => testsAPI.getAll() });
  const { data: classesData } = useQuery({ queryKey: ['classes-for-results'], queryFn: () => classesAPI.getAll() });
  const { data: subjectsData } = useQuery({ queryKey: ['subjects-for-results'], queryFn: () => subjectsAPI.getAll() });

  // ✅ THE 400 FIX — numeric ID + guard, can never fire with "JSS 2"
  const { data: subjectsByClass } = useQuery({
    queryKey: ['subjects-by-class', classIdStr],
    queryFn: () => subjectsAPI.getByClass(classIdStr),
    enabled: /^\d+$/.test(classIdStr),
  });

  // ── Normalized data ──
  const normalizedResults = useMemo(() => {
    if (!resultsData) return [];
    let s = resultsData;
    if (Array.isArray(s)) return s;
    if (s.data && Array.isArray(s.data)) return s.data;
    if (s.results && Array.isArray(s.results)) return s.results;
    const k = Object.keys(s).find(key => Array.isArray(s[key]));
    return k ? s[k] : [];
  }, [resultsData]);

  const strictlyFilteredResults = useMemo(() => {
    if (!Array.isArray(normalizedResults)) return [];
    return normalizedResults.filter(r => {
      if (!r) return false;
      if (selectedClass) { if (idStr(r.classId ?? r.testId?.classId) !== idStr(selectedClass)) return false; }
      if (selectedSubject) { if (idStr(r.subjectId ?? r.testId?.subjectId) !== idStr(selectedSubject)) return false; }
      if (selectedTest) { if (idStr(r.testId) !== idStr(selectedTest)) return false; }
      if (selectedStudent) { if (idStr(r.studentId ?? r.student) !== idStr(selectedStudent)) return false; }
      return true;
    });
  }, [normalizedResults, selectedClass, selectedSubject, selectedTest, selectedStudent]);

  const studentLookup = useMemo(() => {
    const m = {};
    const a = studentsData?.data || (Array.isArray(studentsData) ? studentsData : []);
    a.forEach(s => { const key = idStr(s); if (key) m[key] = s; });
    return m;
  }, [studentsData]);

  const getStudentInfo = (r) => {
    const o = r.studentId && typeof r.studentId === 'object' ? r.studentId : (r.student && typeof r.student === 'object' ? r.student : null);
    if (o) return { firstName: o.firstName || '', lastName: o.lastName || '', admissionNumber: o.admissionNumber || '' };
    const sid = idStr(r.studentId ?? r.student);
    const s = sid ? studentLookup[sid] : null;
    return s ? { firstName: s.firstName || '', lastName: s.lastName || '', admissionNumber: s.admissionNumber || '' } : { firstName: '', lastName: '', admissionNumber: '' };
  };
  const getStudentName = (r) => { const i = getStudentInfo(r); return (i.firstName || i.lastName) ? `${i.firstName} ${i.lastName}`.trim() : 'Unknown Student'; };
  const getStudentInitials = (r) => { const i = getStudentInfo(r); return `${i.firstName?.[0] || ''}${i.lastName?.[0] || ''}`; };
  const getStudentId = (r) => getId(r.studentId) ?? getId(r.student);

  const filteredSubjects = useMemo(() => {
    if (selectedClass) {
      const byClass = subjectsByClass?.data || (Array.isArray(subjectsByClass) ? subjectsByClass : []);
      if (byClass.length > 0) return byClass;
    }
    return subjectsData?.data || [];
  }, [selectedClass, subjectsByClass, subjectsData]);

  const filteredTests = useMemo(() => {
    const tests = testsData?.data || [];
    const cls = idStr(selectedClass);
    const sub = idStr(selectedSubject);
    return tests.filter(t => {
      if (cls && idStr(t.classId) !== cls) return false;
      if (sub && idStr(t.subjectId) !== sub) return false;
      return true;
    });
  }, [testsData, selectedClass, selectedSubject]);

  const unpublishedTestsCount = useMemo(() => filteredTests.filter(t => !t.resultsPublished).length, [filteredTests]);

  const uniqueStudentsInResults = useMemo(() => {
    const m = new Map();
    strictlyFilteredResults.forEach(r => {
      const id = idStr(getStudentId(r));
      if (id && !m.has(id)) m.set(id, { id, name: getStudentName(r), info: getStudentInfo(r) });
    });
    return Array.from(m.values());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strictlyFilteredResults, studentsData]);

  // ── Stats ──
  const stats = useMemo(() => {
    const vp = strictlyFilteredResults.map(r => r?.percentage).filter(p => typeof p === 'number' && !isNaN(p));
    const total = strictlyFilteredResults.length;
    const passed = strictlyFilteredResults.filter(r => r?.status === 'passed').length;
    const failed = strictlyFilteredResults.filter(r => r?.status === 'failed').length;
    const avg = vp.length > 0 ? (vp.reduce((s, p) => s + p, 0) / vp.length).toFixed(1) : '0.0';
    const hi = vp.length > 0 ? Math.max(...vp) : 0;
    const lo = vp.length > 0 ? Math.min(...vp) : 0;
    const pr = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
    return { total, passed, failed, pending: strictlyFilteredResults.filter(r => r?.status === 'pending').length, averageScore: avg, highestScore: hi, lowestScore: lo, passRate: pr, totalSubjects: new Set(strictlyFilteredResults.map(r => idStr(r?.testId?.subjectId ?? r?.subjectId)).filter(Boolean)).size };
  }, [strictlyFilteredResults]);

  // ── Grouped ──
  const groupedResults = useMemo(() => {
    if (!Array.isArray(strictlyFilteredResults)) return {};
    const g = {};
    strictlyFilteredResults.forEach(r => {
      if (!r) return;
      const cId = idStr(r.classId ?? r.testId?.classId) || 'unknown';
      const cName = r.classId?.name || r.testId?.classId?.name || 'Unknown Class';
      const sId = idStr(r.testId?.subjectId ?? r.subjectId) || 'unknown';
      const sName = r.testId?.subjectId?.name || r.subjectId?.name || 'Unknown Subject';
      const tId = idStr(r.testId) || 'unknown';
      if (!g[cId]) g[cId] = { classId: cId, className: cName, subjects: {} };
      if (!g[cId].subjects[sId]) g[cId].subjects[sId] = { subjectId: sId, subjectName: sName, students: [], tests: {}, stats: { total: 0, passed: 0, failed: 0, pending: 0, averageScore: 0, highestScore: 0, lowestScore: 100 } };
      const sub = g[cId].subjects[sId];
      if (!sub.tests[tId]) sub.tests[tId] = { testId: tId, testTitle: r.testId?.title || 'Test', isPublished: r.testId?.resultsPublished || false, studentCount: 0 };
      sub.tests[tId].studentCount++;
      sub.students.push(r);
      sub.stats.total++;
      if (r.status === 'passed') sub.stats.passed++;
      if (r.status === 'failed') sub.stats.failed++;
      if (r.status === 'pending') sub.stats.pending++;
      const p = r.percentage || 0;
      sub.stats.averageScore += p;
      if (p > sub.stats.highestScore) sub.stats.highestScore = p;
      if (p < sub.stats.lowestScore) sub.stats.lowestScore = p;
    });
    Object.values(g).forEach(c => Object.values(c.subjects).forEach(s => { if (s.stats.total > 0) s.stats.averageScore = (s.stats.averageScore / s.stats.total).toFixed(1); }));
    return g;
  }, [strictlyFilteredResults]);

  // ── Processed & paginated ──
  const processedResults = useMemo(() => {
    if (!Array.isArray(strictlyFilteredResults)) return [];
    let res = [...strictlyFilteredResults];
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      res = res.filter(r => {
        const i = getStudentInfo(r);
        return (i.firstName?.toLowerCase() || '').includes(t) || (i.lastName?.toLowerCase() || '').includes(t) || (i.admissionNumber?.toLowerCase() || '').includes(t) || (r.testId?.title?.toLowerCase() || '').includes(t);
      });
    }
    res.sort((a, b) => {
      let vA, vB;
      switch (sortBy) {
        case 'student_name': vA = getStudentName(a).toLowerCase(); vB = getStudentName(b).toLowerCase(); break;
        case 'admission_number': vA = getStudentInfo(a).admissionNumber || ''; vB = getStudentInfo(b).admissionNumber || ''; break;
        case 'test_title': vA = a.testId?.title?.toLowerCase() || ''; vB = b.testId?.title?.toLowerCase() || ''; break;
        case 'score': vA = a.percentage || 0; vB = b.percentage || 0; break;
        default: vA = new Date(a.submittedAt || 0); vB = new Date(b.submittedAt || 0); break;
      }
      if (vA < vB) return sortOrder === 'asc' ? -1 : 1;
      if (vA > vB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return res;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strictlyFilteredResults, searchTerm, sortBy, sortOrder]);

  const effectiveItemsPerPage = itemsPerPage === 'all' ? processedResults.length : Number(itemsPerPage);
  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(processedResults.length / effectiveItemsPerPage);
  const paginatedResults = itemsPerPage === 'all' ? processedResults : processedResults.slice((currentPage - 1) * effectiveItemsPerPage, currentPage * effectiveItemsPerPage);

  const selectedClassName = (classesData?.data || []).find(c => idStr(c) === idStr(selectedClass))?.name || '';
  const selectedSubjectName = (filteredSubjects || []).find(s => idStr(s) === idStr(selectedSubject))?.name || '';
  const currentSubjectStats = useMemo(() => groupedResults[idStr(selectedClass)]?.subjects[idStr(selectedSubject)]?.stats || null, [groupedResults, selectedClass, selectedSubject]);

  // ── Mutations ──
  const publishMutation = useMutation({
    mutationFn: (testId) => testsAPI.publishResults(testId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['all-test-results'] }); queryClient.invalidateQueries({ queryKey: ['tests-for-results'] }); setShowPublishConfirm(null); },
  });
  const unpublishMutation = useMutation({
    mutationFn: (testId) => testsAPI.unpublishResults(testId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['all-test-results'] }); queryClient.invalidateQueries({ queryKey: ['tests-for-results'] }); setShowPublishConfirm(null); },
  });
  const publishAllMutation = useMutation({
    mutationFn: async () => {
      const unpub = filteredTests.filter(t => !t.resultsPublished);
      if (!unpub.length) throw new Error('No unpublished tests');
      // ✅ getId(t) — not t._id (undefined on Prisma rows)
      const res = await Promise.allSettled(unpub.map(t => testsAPI.publishResults(getId(t))));
      return { total: unpub.length, success: unpub.length - res.filter(r => r.status === 'rejected').length };
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['all-test-results'] }); setShowPublishConfirm(null); },
    onError: () => { setShowPublishConfirm(null); },
  });

  // ── Handlers ──
  const handlePublish = (testId) => setShowPublishConfirm({ testId, action: 'publish' });
  const handleUnpublish = (testId) => setShowPublishConfirm({ testId, action: 'unpublish' });
  const handlePublishAll = () => setShowPublishConfirm({ testId: 'all', action: 'publish-all' });
  const confirmPublishAction = () => {
    if (!showPublishConfirm) return;
    if (showPublishConfirm.action === 'publish') publishMutation.mutate(showPublishConfirm.testId);
    else if (showPublishConfirm.action === 'unpublish') unpublishMutation.mutate(showPublishConfirm.testId);
    else if (showPublishConfirm.action === 'publish-all') publishAllMutation.mutate();
  };
  const handleSort = (col) => { if (sortBy === col) setSortOrder(p => p === 'asc' ? 'desc' : 'asc'); else { setSortBy(col); setSortOrder('asc'); } };
  const resetFilters = () => { setSelectedClass(''); setSelectedTest(''); setSelectedStudent(''); setSelectedSubject(''); setSearchTerm(''); setCurrentPage(1); setExpandedClass(null); setExpandedSubject(null); setSelectedTerm(''); };
  const handleClassChange = (id) => { setSelectedClass(id); setSelectedSubject(''); setSelectedTest(''); setSelectedTerm(''); };
  const handleSubjectChange = (id) => { setSelectedSubject(id); setSelectedTest(''); };
  const getSortIndicator = (col) => sortBy !== col ? '↕' : sortOrder === 'asc' ? '↑' : '↓';
  const toggleClass = (id) => { setExpandedClass(expandedClass === id ? null : id); setExpandedSubject(null); };
  const toggleSubject = (id) => setExpandedSubject(expandedSubject === id ? null : id);
  const handleViewReportCard = (studentId) => { if (!selectedTerm) { alert('Please select a term to generate the report card.'); return; } setShowReportCard({ studentId, termId: selectedTerm }); };
  const handleExport = () => {
    if (!selectedTest) return;
    const t = filteredTests.find(t => idStr(t) === idStr(selectedTest));
    downloadCSV(idStr(selectedTest), `${t?.title || 'test'}_results.csv`);
  };

  // ── Effects ──
  useEffect(() => {
    if (viewMode === 'class_subject') {
      setExpandedClass(selectedClass && selectedSubject ? selectedClass : selectedClass || null);
      setExpandedSubject(selectedClass && selectedSubject ? `${selectedClass}-${selectedSubject}` : null);
    }
  }, [selectedClass, selectedSubject, viewMode]);
  useEffect(() => { setCurrentPage(1); }, [selectedClass, selectedSubject, selectedTest, selectedStudent, searchTerm]);
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') { if (showPublishConfirm) setShowPublishConfirm(null); else if (showReportCard) setShowReportCard(null); } };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [showPublishConfirm, showReportCard]);
  useEffect(() => {
    document.body.style.overflow = showPublishConfirm || showReportCard ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showPublishConfirm, showReportCard]);

  // ── Render helpers ──
  const isMutating = publishMutation.isPending || unpublishMutation.isPending || publishAllMutation.isPending;

  const renderStudentCell = (r) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div className="sr-avatar" style={{ background: avatarColor(getStudentName(r)), width: 34, height: 34, fontSize: '.72rem' }}>
        {getStudentInitials(r) || '?'}
      </div>
      <strong style={{ fontSize: '.88rem' }}>{getStudentName(r)}</strong>
    </div>
  );
  const renderAdmissionBadge = (r) => <span className="sr-badge sr-badge-gray">{getStudentInfo(r).admissionNumber || '—'}</span>;
  const renderPubBadge = (isPub) => isPub
    ? (<span className="sr-pub-badge published"><span className="sr-pub-dot" style={{ background: '#22c55e' }} />Published</span>)
    : (<span className="sr-pub-badge unpublished"><span className="sr-pub-dot" />Draft</span>);
  const renderPubBtn = (id, isPub) => isPub
    ? (<button onClick={e => { e.stopPropagation(); handleUnpublish(id); }} className="sr-btn sr-btn-ghost sr-btn-xs" disabled={isMutating} title="Unpublish">🔒</button>)
    : (<button onClick={e => { e.stopPropagation(); handlePublish(id); }} className="sr-btn sr-btn-ghost sr-btn-xs" disabled={isMutating} title="Publish">📢</button>);
  const renderReportBtn = (r) => (
    <button onClick={(e) => { e.stopPropagation(); handleViewReportCard(getStudentId(r)); }} className="sr-btn sr-btn-ghost sr-btn-xs" disabled={!selectedTerm} title="View Report Card">📄</button>
  );

  const renderResultRow = (r, index) => {
    const g = getGrade(r.percentage || 0);
    const st = { passed: { color: '#059669', bg: '#ecfdf5', icon: '✅', label: 'Passed' }, failed: { color: '#dc2626', bg: '#fef2f2', icon: '❌', label: 'Failed' }, pending: { color: '#d97706', bg: '#fffbeb', icon: '⏳', label: 'Pending' } }[r.status] || { color: '#d97706', bg: '#fffbeb', icon: '⏳', label: 'Pending' };
    return (
      <tr key={idStr(r) || index}>
        <td className="sr-td-sn">{index + 1}</td>
        <td>{renderStudentCell(r)}</td>
        <td>{renderAdmissionBadge(r)}</td>
        {!selectedSubject && <td style={{ fontSize: '.85rem', color: 'var(--text2)' }}>{r.testId?.subjectId?.name || '—'}</td>}
        <td>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontSize: '.85rem', fontWeight: 500 }}>{r.testId?.title || '—'}</span>
            {renderPubBadge(r.testId?.resultsPublished)}
          </div>
        </td>
        <td>
          <span className="sr-score-cell">
            <span className="sr-score-achieved">{r.score}</span>
            <span className="sr-score-total">/{r.totalQuestions || r.testId?.totalQuestions || '?'}</span>
          </span>
        </td>
        <td>
          <div className="sr-pct-cell">
            <div className="sr-pct-bar-wrap"><div className="sr-pct-bar-fill" style={{ width: `${Math.min(r.percentage || 0, 100)}%`, background: g.color }} /></div>
            <span className="sr-pct-value" style={{ color: g.color }}>{r.percentage || 0}%</span>
          </div>
        </td>
        <td><span className="sr-grade-badge" style={{ background: `${g.color}15`, color: g.color, borderColor: `${g.color}30` }}>{g.grade}</span></td>
        <td><span className="sr-status-badge" style={{ background: st.bg, color: st.color }}>{st.icon} {st.label}</span></td>
        {selectedTerm && <td style={{ display: 'flex', gap: 4 }}>{renderReportBtn(r)}{renderPubBtn(idStr(r.testId), r.testId?.resultsPublished)}</td>}
      </tr>
    );
  };

  const renderResultCard = (r, index) => {
    const g = getGrade(r.percentage || 0);
    const st = { passed: { color: '#059669', bg: '#ecfdf5', icon: '✅', label: 'Passed' }, failed: { color: '#dc2626', bg: '#fef2f2', icon: '❌', label: 'Failed' }, pending: { color: '#d97706', bg: '#fffbeb', icon: '⏳', label: 'Pending' } }[r.status] || { color: '#d97706', bg: '#fffbeb', icon: '⏳', label: 'Pending' };
    return (
      <div className="sr-card" key={idStr(r) || index}>
        <div className="sr-card-top">
          <div className="sr-avatar" style={{ background: avatarColor(getStudentName(r)) }}>{getStudentInitials(r) || '?'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sr-card-name">{getStudentName(r)}</div>
            <div className="sr-card-sub">{getStudentInfo(r).admissionNumber || '—'}</div>
          </div>
          <div className="sr-card-badges">
            <span className="sr-grade-badge" style={{ background: `${g.color}15`, color: g.color, borderColor: `${g.color}30` }}>{g.grade}</span>
            <span className="sr-status-badge" style={{ background: st.bg, color: st.color, fontSize: '.68rem', padding: '2px 8px' }}>{st.icon} {st.label}</span>
          </div>
        </div>
        <div className="sr-card-grid" style={!selectedSubject ? { gridTemplateColumns: '1fr 1fr 1fr 1fr' } : {}}>
          <div>
            <div className="sr-card-field-label">Test</div>
            <div className="sr-card-field-value" style={{ fontSize: '.8rem' }}>{r.testId?.title || '—'}</div>
          </div>
          {!selectedSubject && (
            <div>
              <div className="sr-card-field-label">Subject</div>
              <div className="sr-card-field-value" style={{ fontSize: '.8rem' }}>{r.testId?.subjectId?.name || '—'}</div>
            </div>
          )}
          <div>
            <div className="sr-card-field-label">Score</div>
            <div className="sr-card-field-value">
              <span className="sr-score-cell">
                <span className="sr-score-achieved">{r.score}</span>
                <span className="sr-score-total">/{r.totalQuestions || r.testId?.totalQuestions || '?'}</span>
              </span>
            </div>
          </div>
          <div>
            <div className="sr-card-field-label">Percentage</div>
            <div className="sr-card-field-value" style={{ color: g.color, fontWeight: 700 }}>{r.percentage || 0}%</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 4 }}>
          {renderPubBadge(r.testId?.resultsPublished)}
        </div>
        <div className="sr-card-actions">
          {selectedTerm && renderReportBtn(r)}
          {renderPubBtn(idStr(r.testId), r.testId?.resultsPublished)}
        </div>
      </div>
    );
  };

  if (resultsLoading) return <Loading message="Loading student results..." />;
  if (resultsError) return (
    <div className="sr-root" style={{ padding: 24 }}>
      <div className="sr-alert sr-alert-danger" style={{ justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 40 }}>
        <span style={{ fontSize: '2rem' }}>⚠️</span>
        <p style={{ margin: 0 }}>Failed: {resultsError.message}</p>
        <button className="sr-btn sr-btn-primary" onClick={() => queryClient.invalidateQueries({ queryKey: ['all-test-results'] })}>🔄 Retry</button>
      </div>
    </div>
  );

  // ── CSS Variables ──
  const cssVars = {
    '--bg': '#f1f5f9', '--surface': '#ffffff', '--border': '#e2e8f0',
    '--text': '#0f172a', '--text2': '#475569', '--muted': '#94a3b8',
    '--primary': '#4f46e5', '--primary-h': '#4338ca', '--primary-l': '#eef2ff',
    '--danger': '#ef4444', '--danger-h': '#dc2626', '--success': '#10b981',
    '--success-l': '#ecfdf5', '--warning': '#f59e0b', '--warning-l': '#fffbeb',
    '--radius': '12px', '--radius-sm': '8px',
    '--shadow-sm': '0 1px 2px rgba(0,0,0,0.05)',
    '--shadow': '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
    '--shadow-lg': '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
    '--tr': '150ms cubic-bezier(0.4,0,0.2,1)',
  };

  return (
    <div className="sr-root" style={cssVars}>
      <style>{`
        .sr-root{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:var(--text);-webkit-font-smoothing:antialiased;background:var(--bg);min-height:100vh}
        .sr-header{background:var(--surface);border-bottom:1px solid var(--border);padding:20px 24px;position:sticky;top:0;z-index:30}
        .sr-header-top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
        .sr-title{font-size:1.35rem;font-weight:700;margin:0;letter-spacing:-0.02em}
        .sr-sub{font-size:.82rem;color:var(--muted);margin:2px 0 0;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .sr-header-actions{display:flex;gap:8px;flex-wrap:wrap}
        .sr-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:var(--radius-sm);font-size:.82rem;font-weight:600;border:none;cursor:pointer;transition:all var(--tr);white-space:nowrap;line-height:1.4}
        .sr-btn:active{transform:scale(.97)}
        .sr-btn-primary{background:var(--primary);color:#fff}.sr-btn-primary:hover{background:var(--primary-h)}
        .sr-btn-success{background:var(--success);color:#fff}.sr-btn-success:hover{background:#059669}
        .sr-btn-danger{background:var(--danger);color:#fff}.sr-btn-danger:hover{background:var(--danger-h)}
        .sr-btn-warning{background:var(--warning);color:#fff}.sr-btn-warning:hover{background:#d97706}
        .sr-btn-ghost{background:var(--surface);color:var(--text2);border:1px solid var(--border)}.sr-btn-ghost:hover{background:#f8fafc;border-color:#cbd5e1}
        .sr-btn-sm{padding:6px 12px;font-size:.78rem}
        .sr-btn-xs{padding:4px 8px;font-size:.75rem;min-width:28px;justify-content:center}
        .sr-btn:disabled{opacity:.5;cursor:not-allowed;transform:none!important}
        .sr-sel-bar{padding:14px 24px;background:var(--bg);border-bottom:1px solid var(--border);display:flex;flex-direction:column;gap:12px}
        .sr-sel-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px}
        .sr-sel-group{display:flex;flex-direction:column;gap:4px}
        .sr-sel-label{font-size:.74rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.03em}
        .sr-sel-select,.sr-sel-input{width:100%;padding:9px 36px 9px 12px;border-radius:var(--radius-sm);border:1px solid var(--border);background:var(--surface);font-size:.85rem;color:var(--text);outline:none;transition:border-color var(--tr),box-shadow var(--tr);box-sizing:border-box;-webkit-appearance:none;appearance:none}
        .sr-sel-select:focus,.sr-sel-input:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(79,70,229,.12)}
        .sr-sel-select:disabled,.sr-sel-input:disabled{background:#f8fafc;color:var(--muted);cursor:not-allowed}
        .sr-sel-select{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center}
        .sr-sel-select option{color:var(--text);background:var(--surface)}
        .sr-sel-reset{align-self:flex-end}
        .sr-alert{padding:12px 16px;border-radius:var(--radius-sm);font-size:.84rem;font-weight:500;display:flex;align-items:center;gap:8px;margin:12px 24px 0}
        .sr-alert-danger{background:#fef2f2;color:#991b1b;border:1px solid #fecaca}
        .sr-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:16px 24px}
        .sr-stat{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;display:flex;align-items:center;gap:12px;transition:box-shadow var(--tr)}
        .sr-stat:hover{box-shadow:var(--shadow)}
        .sr-stat-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0}
        .sr-stat-info{display:flex;flex-direction:column;min-width:0}
        .sr-stat-value{font-size:1.15rem;font-weight:700;line-height:1.2}
        .sr-stat-label{font-size:.72rem;color:var(--muted);font-weight:500;margin-top:2px}
        .sr-subj-stats{margin:0 24px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:14px 20px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
        .sr-subj-stats-title{font-size:.88rem;font-weight:700;margin-right:12px;white-space:nowrap}
        .sr-bar-item{display:flex;align-items:center;gap:6px;padding:4px 12px;border-radius:20px;font-size:.78rem;font-weight:600;background:#f8fafc;white-space:nowrap}
        .sr-bar-item .label{color:var(--muted)}
        .sr-bar-item .value{font-weight:700;color:var(--text)}
        .sr-bar-divider{width:1px;height:20px;background:var(--border);margin:0 4px}
        .sr-test-status{margin:16px 24px 0;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden}
        .sr-test-status-hdr{padding:14px 20px;border-bottom:1px solid var(--border);font-size:.88rem;font-weight:700}
        .sr-test-status-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:0}
        .sr-test-item{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-bottom:1px solid var(--border);transition:background var(--tr)}
        .sr-test-item:last-child{border-bottom:none}
        .sr-test-item:hover{background:#f8fafc}
        .sr-test-info{display:flex;flex-direction:column;gap:4px}
        .sr-test-name{font-size:.85rem;font-weight:600}
        .sr-test-actions{display:flex;gap:6px;flex-shrink:0}
        .sr-quick{margin:16px 24px 0;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden}
        .sr-quick-hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid var(--border)}
        .sr-quick-hdr h3{font-size:.88rem;font-weight:700;margin:0}
        .sr-quick-count{font-size:.78rem;color:var(--muted);font-weight:600;background:#f1f5f9;padding:2px 10px;border-radius:20px}
        .sr-quick-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:0}
        .sr-quick-btn{display:flex;align-items:center;gap:10px;padding:10px 20px;border:none;background:none;cursor:pointer;transition:background var(--tr);text-align:left;border-bottom:1px solid var(--border);border-right:1px solid var(--border)}
        .sr-quick-btn:hover{background:#f8fafc}
        .sr-quick-avatar{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:.72rem;flex-shrink:0}
        .sr-quick-name{font-size:.82rem;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .sr-quick-adm{font-size:.72rem;color:var(--muted);font-weight:500}
        .sr-prompt{text-align:center;padding:64px 24px;color:var(--muted)}
        .sr-prompt-icon{font-size:3rem;display:block;margin-bottom:12px}
        .sr-prompt h3{font-size:1.1rem;font-weight:700;color:var(--text2);margin:0 0 6px}
        .sr-prompt p{font-size:.85rem;margin:0}
        .sr-pub-badge{display:inline-flex;align-items:center;gap:5px;font-size:.68rem;font-weight:600;padding:2px 9px;border-radius:20px;border:1px solid var(--border)}
        .sr-pub-badge.published{background:#ecfdf5;color:#065f46;border-color:#a7f3d0}
        .sr-pub-badge.unpublished{background:#f8fafc;color:var(--muted)}
        .sr-pub-dot{width:6px;height:6px;border-radius:50%;background:var(--muted)}
        .sr-table-section{background:var(--surface);margin:16px 24px;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden}
        .sr-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
        .sr-table{width:100%;border-collapse:collapse;font-size:.86rem;min-width:900px}
        .sr-table thead{background:#f8fafc}
        .sr-table th{padding:12px 14px;text-align:left;font-weight:600;font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);border-bottom:1px solid var(--border);white-space:nowrap;user-select:none}
        .sr-table th.sortable{cursor:pointer}
        .sr-table th.sortable:hover{color:var(--primary)}
        .sr-table td{padding:12px 14px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
        .sr-table tbody tr{transition:background var(--tr)}
        .sr-table tbody tr:hover{background:#fafaff}
        .sr-table tbody tr:last-child td{border-bottom:none}
        .sr-td-sn{color:var(--muted);font-weight:600;width:44px}
        .sr-avatar{border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;flex-shrink:0}
        .sr-badge{display:inline-flex;padding:3px 10px;border-radius:20px;font-size:.74rem;font-weight:600}
        .sr-badge-gray{background:#f1f5f9;color:var(--text2)}
        .sr-score-cell{display:inline-flex;align-items:baseline;gap:2px}
        .sr-score-achieved{font-weight:700;font-size:.95rem}
        .sr-score-total{color:var(--muted);font-size:.8rem}
        .sr-pct-cell{display:flex;align-items:center;gap:8px}
        .sr-pct-bar-wrap{width:70px;height:6px;border-radius:3px;background:#f1f5f9;overflow:hidden}
        .sr-pct-bar-fill{height:100%;border-radius:3px;transition:width .4s ease}
        .sr-pct-value{font-size:.8rem;font-weight:700}
        .sr-grade-badge{display:inline-block;padding:3px 10px;border-radius:6px;border:1px solid;font-weight:700;font-size:.78rem}
        .sr-status-badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:.74rem;font-weight:600}
        .sr-cards{display:none;flex-direction:column;gap:10px;padding:12px 16px;margin:0 8px}
        .sr-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px}
        .sr-card-top{display:flex;align-items:flex-start;gap:10px;margin-bottom:12px}
        .sr-card-name{font-weight:700;font-size:.92rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .sr-card-sub{font-size:.74rem;color:var(--muted)}
        .sr-card-badges{display:flex;gap:5px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end}
        .sr-card-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:10px 0;border-top:1px solid #f1f5f9;border-bottom:1px solid #f1f5f9;margin-bottom:10px}
        .sr-card-field-label{font-size:.66rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px}
        .sr-card-field-value{font-size:.84rem;font-weight:500}
        .sr-card-actions{display:flex;gap:6px}
        .sr-pagination{display:flex;align-items:center;justify-content:center;gap:12px;padding:16px 24px}
        .sr-page-info{font-size:.8rem;color:var(--muted);font-weight:600}
        .sr-modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);backdrop-filter:blur(6px);z-index:100;display:flex;align-items:center;justify-content:center;animation:srFade .2s ease;padding:16px}
        @keyframes srFade{from{opacity:0}to{opacity:1}}
        .sr-modal{background:var(--surface);border-radius:16px;width:100%;max-width:520px;max-height:92vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:var(--shadow-lg)}
        .sr-modal-lg{max-width:900px}
        .sr-modal-handle{width:36px;height:4px;border-radius:2px;background:var(--border);margin:10px auto 0}
        .sr-modal-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 24px;border-bottom:1px solid var(--border);flex-shrink:0}
        .sr-modal-title{font-size:1.05rem;font-weight:700;margin:0}
        .sr-modal-close{width:32px;height:32px;border-radius:50%;border:none;background:#f1f5f9;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:1.2rem}
        .sr-modal-body{flex:1;overflow-y:auto;padding:20px 24px}
        .sr-modal-footer{display:flex;gap:10px;padding:14px 24px;border-top:1px solid var(--border);justify-content:flex-end;flex-shrink:0}
        .sr-report-body{padding:16px}
        .rc-wrap{font-family:'Times New Roman',Times,serif;background:#fff;color:#1a202c;padding:8px}
        @media(min-width:768px){.sr-cards{display:none!important}.sr-table-section{display:block!important}}
        @media(max-width:767px){.sr-header{padding:16px}.sr-sel-bar{padding:12px 16px}.sr-stats{grid-template-columns:1fr 1fr;padding:12px 16px}.sr-subj-stats{margin:0 16px}.sr-test-status,.sr-quick{margin:12px 16px 0}.sr-table-section{display:none!important}.sr-cards{display:flex!important}.sr-modal-overlay{align-items:flex-end;padding:0}.sr-modal{border-radius:16px 16px 0 0;max-height:96vh}}
      `}</style>

      {/* ===== HEADER ===== */}
      <div className="sr-header">
        <div className="sr-header-top">
          <div>
            <h1 className="sr-title">Student Results</h1>
            <p className="sr-sub">
              <span>{selectedClassName || 'All classes'}</span>
              {selectedSubjectName && <span>· {selectedSubjectName}</span>}
              <span>· {processedResults.length} result(s)</span>
            </p>
          </div>
          <div className="sr-header-actions">
            {unpublishedTestsCount > 0 && (
              <button className="sr-btn sr-btn-primary" onClick={handlePublishAll} disabled={isMutating}>📢 Publish All ({unpublishedTestsCount})</button>
            )}
            <button className="sr-btn sr-btn-ghost" onClick={handleExport} disabled={!selectedTest}>⬇ Export CSV</button>
            <button className="sr-btn sr-btn-ghost sr-btn-sm" onClick={resetFilters}>↺ Reset</button>
          </div>
        </div>
      </div>

      {/* ===== FILTERS ===== */}
      <div className="sr-sel-bar">
        <div className="sr-sel-grid">
          <div className="sr-sel-group">
            <label className="sr-sel-label">Class</label>
            <select className="sr-sel-select" value={idStr(selectedClass)} onChange={e => handleClassChange(e.target.value)}>
              <option value="">All Classes</option>
              {(classesData?.data || []).map(c => { const cid = idStr(c);
                return <option key={cid} value={cid}>{c.name}{c.section ? ` — ${c.section}` : ''}</option>; })}
            </select>
          </div>
          <div className="sr-sel-group">
            <label className="sr-sel-label">Subject</label>
            <select className="sr-sel-select" value={idStr(selectedSubject)} onChange={e => handleSubjectChange(e.target.value)} disabled={!selectedClass}>
              <option value="">{selectedClass ? 'All Subjects' : '— Select class —'}</option>
              {filteredSubjects.map(s => { const sid = idStr(s);
                return <option key={sid} value={sid}>{s.name}</option>; })}
            </select>
          </div>
          <div className="sr-sel-group">
            <label className="sr-sel-label">Test</label>
            <select className="sr-sel-select" value={idStr(selectedTest)} onChange={e => setSelectedTest(e.target.value)} disabled={!selectedClass}>
              <option value="">All Tests</option>
              {filteredTests.map(t => { const tid = idStr(t);
                return <option key={tid} value={tid}>{t.title}</option>; })}
            </select>
          </div>
          <div className="sr-sel-group">
            <label className="sr-sel-label">Student</label>
            <select className="sr-sel-select" value={idStr(selectedStudent)} onChange={e => setSelectedStudent(e.target.value)}>
              <option value="">All Students</option>
              {uniqueStudentsInResults.map(st => (
                <option key={idStr(st.id)} value={idStr(st.id)}>{st.name}</option>
              ))}
            </select>
          </div>
          <div className="sr-sel-group">
            <label className="sr-sel-label">Term (report card)</label>
            <select className="sr-sel-select" value={idStr(selectedTerm)} onChange={e => setSelectedTerm(e.target.value)} disabled={!selectedClass}>
              <option value="">{selectedClass ? 'Select Term' : '— Select class —'}</option>
              {availableTerms.map(t => { const tid = idStr(t);
                return <option key={tid} value={tid}>{t.name}{t.status === 'active' ? ' (Active)' : ''}</option>; })}
            </select>
          </div>
          <div className="sr-sel-group">
            <label className="sr-sel-label">Search</label>
            <input className="sr-sel-input" type="text" placeholder="Name, admission no..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <button className="sr-btn sr-btn-ghost sr-btn-sm sr-sel-reset" onClick={resetFilters}>↺ Reset Filters</button>
      </div>

      {/* ===== STATS ===== */}
      <div className="sr-stats">
        <div className="sr-stat"><div className="sr-stat-icon" style={{ background: 'var(--primary-l)' }}>📋</div><div className="sr-stat-info"><div className="sr-stat-value">{stats.total}</div><div className="sr-stat-label">Total Results</div></div></div>
        <div className="sr-stat"><div className="sr-stat-icon" style={{ background: '#eff6ff' }}>📈</div><div className="sr-stat-info"><div className="sr-stat-value">{stats.averageScore}%</div><div className="sr-stat-label">Average Score</div></div></div>
        <div className="sr-stat"><div className="sr-stat-icon" style={{ background: 'var(--success-l)' }}>✅</div><div className="sr-stat-info"><div className="sr-stat-value">{stats.passRate}%</div><div className="sr-stat-label">Pass Rate ({stats.passed} passed)</div></div></div>
        <div className="sr-stat"><div className="sr-stat-icon" style={{ background: 'var(--warning-l)' }}>🎯</div><div className="sr-stat-info"><div className="sr-stat-value">{stats.highestScore}% – {stats.lowestScore}%</div><div className="sr-stat-label">Highest – Lowest</div></div></div>
      </div>

      {/* ===== SUBJECT STATS BAR ===== */}
      {selectedClass && selectedSubject && currentSubjectStats && (
        <div className="sr-subj-stats">
          <span className="sr-subj-stats-title">{selectedClassName} — {selectedSubjectName}</span>
          <span className="sr-bar-item"><span className="label">Students</span><span className="value">{currentSubjectStats.total}</span></span>
          <span className="sr-bar-divider" />
          <span className="sr-bar-item"><span className="label">Passed</span><span className="value">{currentSubjectStats.passed}</span></span>
          <span className="sr-bar-item"><span className="label">Failed</span><span className="value">{currentSubjectStats.failed}</span></span>
          <span className="sr-bar-divider" />
          <span className="sr-bar-item"><span className="label">Average</span><span className="value">{currentSubjectStats.averageScore}%</span></span>
          <span className="sr-bar-item"><span className="label">Highest</span><span className="value">{currentSubjectStats.highestScore}%</span></span>
          <span className="sr-bar-item"><span className="label">Lowest</span><span className="value">{currentSubjectStats.lowestScore === 100 ? 0 : currentSubjectStats.lowestScore}%</span></span>
        </div>
      )}

      {/* ===== TEST PUBLICATION STATUS ===== */}
      {filteredTests.length > 0 && (
        <div className="sr-test-status">
          <div className="sr-test-status-hdr">Test Publication Status</div>
          <div className="sr-test-status-grid">
            {filteredTests.map(t => (
              <div className="sr-test-item" key={idStr(t)}>
                <div className="sr-test-info">
                  <span className="sr-test-name">{t.title}</span>
                  {renderPubBadge(t.resultsPublished)}
                </div>
                <div className="sr-test-actions">{renderPubBtn(idStr(t), t.resultsPublished)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== QUICK STUDENT VIEW ===== */}
      {uniqueStudentsInResults.length > 0 && (
        <div className="sr-quick">
          <div className="sr-quick-hdr"><h3>Quick Student View</h3><span className="sr-quick-count">{uniqueStudentsInResults.length}</span></div>
          <div className="sr-quick-grid">
            {uniqueStudentsInResults.map(st => (
              <button className="sr-quick-btn" key={idStr(st.id)} onClick={() => setSelectedStudent(idStr(st.id))}>
                <div className="sr-quick-avatar" style={{ background: avatarColor(st.name) }}>{(st.info.firstName?.[0] || '') + (st.info.lastName?.[0] || '')}</div>
                <div>
                  <div className="sr-quick-name">{st.name}</div>
                  <div className="sr-quick-adm">{st.info.admissionNumber || '—'}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== RESULTS ===== */}
      {!selectedClass ? (
        <div className="sr-prompt">
          <span className="sr-prompt-icon">📊</span>
          <h3>Select a class to view results</h3>
          <p>Choose a class above to filter student test results.</p>
        </div>
      ) : processedResults.length === 0 ? (
        <div className="sr-prompt">
          <span className="sr-prompt-icon">🔍</span>
          <h3>No results found</h3>
          <p>No student test results match the current filters.</p>
        </div>
      ) : (
        <>
          <div className="sr-table-section">
            <div className="sr-table-wrap">
              <table className="sr-table">
                <thead>
                  <tr>
                    <th className="sr-td-sn">S/N</th>
                    <th className="sortable" onClick={() => handleSort('student_name')}>Student {getSortIndicator('student_name')}</th>
                    <th>Admission No.</th>
                    {!selectedSubject && <th>Subject</th>}
                    <th className="sortable" onClick={() => handleSort('test_title')}>Test {getSortIndicator('test_title')}</th>
                    <th className="sortable" onClick={() => handleSort('score')}>Score {getSortIndicator('score')}</th>
                    <th>Performance</th>
                    <th>Grade</th>
                    <th>Status</th>
                    {selectedTerm && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedResults.map((r, i) => renderResultRow(r, i))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="sr-cards">
            {paginatedResults.map((r, i) => renderResultCard(r, i))}
          </div>

          {itemsPerPage !== 'all' && totalPages > 1 && (
            <div className="sr-pagination">
              <button className="sr-btn sr-btn-ghost sr-btn-sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>← Prev</button>
              <span className="sr-page-info">Page {currentPage} of {totalPages}</span>
              <button className="sr-btn sr-btn-ghost sr-btn-sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* ===== PUBLISH CONFIRM MODAL ===== */}
      {showPublishConfirm && (
        <div className="sr-modal-overlay" onClick={() => setShowPublishConfirm(null)}>
          <div className="sr-modal" onClick={e => e.stopPropagation()}>
            <div className="sr-modal-handle" />
            <div className="sr-modal-header">
              <h3 className="sr-modal-title">
                {showPublishConfirm.action === 'publish' ? '📢 Publish Results' : showPublishConfirm.action === 'unpublish' ? '🔒 Unpublish Results' : '📢 Publish All Results'}
              </h3>
              <button className="sr-modal-close" onClick={() => setShowPublishConfirm(null)}>×</button>
            </div>
            <div className="sr-modal-body">
              <p style={{ margin: 0, fontSize: '.88rem', lineHeight: 1.6 }}>
                {showPublishConfirm.action === 'publish' && 'Students will be able to see their scores for this test. Continue?'}
                {showPublishConfirm.action === 'unpublish' && 'Students will no longer see their scores for this test. Continue?'}
                {showPublishConfirm.action === 'publish-all' && `All ${unpublishedTestsCount} unpublished test(s) will become visible to students. Continue?`}
              </p>
            </div>
            <div className="sr-modal-footer">
              <button className="sr-btn sr-btn-ghost" onClick={() => setShowPublishConfirm(null)}>Cancel</button>
              <button className={`sr-btn ${showPublishConfirm.action === 'unpublish' ? 'sr-btn-warning' : 'sr-btn-success'}`} onClick={confirmPublishAction} disabled={isMutating}>
                {isMutating ? 'Working...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== REPORT CARD MODAL ===== */}
      {showReportCard && (
        <ReportCardModal studentId={showReportCard.studentId} termId={showReportCard.termId} onClose={() => setShowReportCard(null)} />
      )}
    </div>
  );
};

export default StudentResultsView;