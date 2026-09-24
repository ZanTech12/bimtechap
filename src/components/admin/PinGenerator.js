import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function PinGenerator() {
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [terms, setTerms] = useState([]);
    const [sessions, setSessions] = useState([]);
    
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedTerm, setSelectedTerm] = useState('');
    const [selectedSession, setSelectedSession] = useState('');
    
    const [pins, setPins] = useState([]);
    const [loadingTable, setLoadingTable] = useState(false);
    const [generatingAll, setGeneratingAll] = useState(false);
    const [generatingStudentId, setGeneratingStudentId] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [classesRes, termsRes, sessionsRes] = await Promise.all([
                    api.get('/classes', { params: { limit: 1000 } }),
                    api.get('/terms'),
                    api.get('/sessions')
                ]);
                setClasses(classesRes.data?.data || []);
                setTerms(termsRes.data?.data || []);
                setSessions(sessionsRes.data?.data || []);
            } catch (err) {
                console.error('Error fetching data:', err);
            }
        };
        fetchData();
    }, []);

    const fetchStudents = async (classId) => {
        if (!classId) { setStudents([]); return; }
        try {
            const studentsRes = await api.get('/students', { params: { classId } });
            let studentData = [];
            if (Array.isArray(studentsRes.data)) studentData = studentsRes.data;
            else if (studentsRes.data?.data && Array.isArray(studentsRes.data.data)) studentData = studentsRes.data.data;
            
            studentData.sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));
            setStudents(studentData);
        } catch (err) {
            console.error('Error fetching students:', err);
            setStudents([]);
        }
    };

    const fetchExistingPins = async () => {
        if (!selectedTerm || !selectedSession || !selectedClass) { setPins([]); return; }
        setLoadingTable(true); setMessage('');
        try {
            const params = { termId: selectedTerm, sessionId: selectedSession, classId: selectedClass };
            const pinsRes = await api.get('/admin/result-pins/list', { params });
            setPins(pinsRes.data?.data || []);
        } catch (err) {
            console.error('Error fetching existing PINs:', err);
            setPins([]);
        } finally {
            setLoadingTable(false);
        }
    };

    useEffect(() => {
        if (selectedSession && selectedTerm && selectedClass) fetchExistingPins();
        else setPins([]);
    }, [selectedSession, selectedTerm, selectedClass]);

    const handleGenerateAll = async () => {
        if (!selectedClass || !selectedTerm || !selectedSession) return;
        setGeneratingAll(true); setMessage('');
        try {
            const res = await api.post('/admin/result-pins/generate', { termId: selectedTerm, sessionId: selectedSession, classId: selectedClass });
            setMessage(res.data.message);
            await fetchExistingPins(); 
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to generate PINs');
        } finally {
            setGeneratingAll(false);
        }
    };

    const handleGenerateSingle = async (studentId) => {
        if (!studentId || !selectedTerm || !selectedSession) return;
        setGeneratingStudentId(studentId); setMessage('');
        try {
            const res = await api.post('/admin/result-pins/generate', { termId: selectedTerm, sessionId: selectedSession, studentId: studentId });
            setMessage(res.data.message);
            await fetchExistingPins(); 
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to generate PIN for student');
        } finally {
            setGeneratingStudentId(null);
        }
    };

    const getStudentPin = (studentId) => {
        const studentPins = pins.filter(p => p.studentId === studentId);
        if (studentPins.length === 0) return null;
        return studentPins.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    };

    return (
        <div className="pg-container">
            <style>{`
                .pg-container { min-height: 100vh; background: #f8fafc; padding: 32px 16px; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #0f172a; }
                .pg-content { max-width: 900px; margin: 0 auto; }
                .pg-header { margin-bottom: 32px; }
                .pg-title { font-size: 24px; font-weight: 800; margin: 0; }
                .pg-subtitle { font-size: 14px; color: #64748b; margin-top: 6px; }
                
                .pg-card { background: #fff; padding: 24px; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; margin-bottom: 24px; }
                .pg-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
                
                .pg-label { display: block; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
                .pg-input { width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 14px; color: #334155; outline: none; transition: all 0.2s; box-sizing: border-box; }
                .pg-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }
                
                .pg-btn-primary { background: #4f46e5; color: #fff; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: background 0.2s; width: 100%; height: 42px; font-size: 14px; }
                .pg-btn-primary:hover:not(:disabled) { background: #4338ca; }
                .pg-btn-primary:disabled { background: #c7d2fe; cursor: not-allowed; }
                
                .pg-message { margin-top: 16px; background: #eef2ff; border: 1px solid #c7d2fe; color: #4338ca; padding: 12px 16px; border-radius: 10px; font-size: 14px; font-weight: 500; }
                
                .pg-empty { background: #fff; border: 2px dashed #e2e8f0; border-radius: 16px; padding: 40px; text-align: center; }
                .pg-empty h3 { margin: 0 0 4px 0; font-size: 16px; color: #334155; }
                .pg-empty p { margin: 0; font-size: 14px; color: #94a3b8; }
                
                .pg-table-wrap { background: #fff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; overflow: hidden; }
                .pg-table { width: 100%; border-collapse: collapse; }
                .pg-table th { background: #f8fafc; padding: 14px 20px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; }
                .pg-table td { padding: 14px 20px; border-bottom: 1px solid #f1f5f9; font-size: 14px; vertical-align: middle; }
                .pg-table tr:last-child td { border-bottom: none; }
                .pg-table tr:hover { background: #f8fafc; }
                
                .pg-pin-badge { font-weight: 700; color: #4f46e5; background: #eef2ff; padding: 4px 10px; border-radius: 6px; letter-spacing: 1px; font-size: 13px; font-family: monospace; }
                .pg-status { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: capitalize; display: inline-block; }
                .pg-status-none { background: #f1f5f9; color: #64748b; }
                .pg-status-used { background: #fee2e2; color: #b91c1c; }
                .pg-status-active { background: #dcfce7; color: #15803d; }
                
                .pg-btn-action { font-size: 12px; font-weight: 600; padding: 8px 14px; border-radius: 8px; cursor: pointer; border: none; transition: all 0.2s; }
                .pg-btn-generate { background: #eef2ff; color: #4f46e5; }
                .pg-btn-generate:hover { background: #e0e7ff; }
                .pg-btn-new { background: #f1f5f9; color: #334155; }
                .pg-btn-new:hover { background: #e2e8f0; }
                .pg-btn-loading { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }

                .pg-mobile-card { background: #fff; padding: 16px; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; margin-bottom: 16px; }
                .pg-mobile-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
                .pg-mobile-name { font-size: 15px; font-weight: 700; margin: 0; }
                .pg-mobile-adm { font-size: 12px; color: #64748b; margin: 4px 0 0 0; }
                .pg-mobile-bottom { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 16px; }

                @media (min-width: 640px) {
                    .pg-grid { grid-template-columns: 1fr 1fr; }
                }
                @media (min-width: 1024px) {
                    .pg-grid { grid-template-columns: 1fr 1fr 1fr 1fr; align-items: end; }
                    .pg-container { padding: 40px; }
                }
                
                .pg-desktop-view { display: none; }
                .pg-mobile-view { display: block; }
                @media (min-width: 768px) {
                    .pg-desktop-view { display: block; }
                    .pg-mobile-view { display: none; }
                }
            `}</style>

            <div className="pg-content">
                <div className="pg-header">
                    <h2 className="pg-title">Result PIN Manager</h2>
                    <p className="pg-subtitle">Generate and manage result access codes for classes or individual students.</p>
                </div>

                <div className="pg-card">
                    <div className="pg-grid">
                        <div>
                            <label className="pg-label">Session</label>
                            <select className="pg-input" value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)}>
                                <option value="">Select Session</option>
                                {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="pg-label">Term</label>
                            <select className="pg-input" value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}>
                                <option value="">Select Term</option>
                                {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="pg-label">Class</label>
                            <select className="pg-input" value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); fetchStudents(e.target.value); }}>
                                <option value="">Select Class</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <button className="pg-btn-primary" onClick={handleGenerateAll} disabled={generatingAll || !selectedClass || !selectedTerm || !selectedSession || students.length === 0}>
                            {generatingAll ? 'Generating...' : 'Generate For Class'}
                        </button>
                    </div>

                    {message && <div className="pg-message">{message}</div>}
                </div>

                {loadingTable ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#4f46e5', fontWeight: '500' }}>Loading students...</div>
                ) : (
                    selectedClass ? (
                        students.length > 0 ? (
                            <>
                                {/* Desktop View */}
                                <div className="pg-desktop-view">
                                    <div className="pg-table-wrap">
                                        <table className="pg-table">
                                            <thead>
                                                <tr>
                                                    <th>Student Name</th>
                                                    <th>Admission No.</th>
                                                    <th>Current PIN</th>
                                                    <th>Status</th>
                                                    <th style={{ textAlign: 'right' }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {students.map(student => {
                                                    const latestPin = getStudentPin(student.id);
                                                    const isGeneratingThis = generatingStudentId === student.id;
                                                    return (
                                                        <tr key={student.id}>
                                                            <td style={{ fontWeight: 600, color: '#0f172a' }}>{student.lastName} {student.firstName}</td>
                                                            <td style={{ color: '#64748b' }}>{student.admissionNumber}</td>
                                                            <td>{latestPin ? <span className="pg-pin-badge">{latestPin.pin}</span> : <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                                                            <td>
                                                                {!latestPin ? <span className="pg-status pg-status-none">No PIN</span> :
                                                                 latestPin.isUsed ? <span className="pg-status pg-status-used">Used</span> :
                                                                 <span className="pg-status pg-status-active">Active</span>}
                                                            </td>
                                                            <td style={{ textAlign: 'right' }}>
                                                                <button 
                                                                    className={`pg-btn-action ${isGeneratingThis ? 'pg-btn-loading' : latestPin ? 'pg-btn-new' : 'pg-btn-generate'}`}
                                                                    onClick={() => handleGenerateSingle(student.id)} 
                                                                    disabled={isGeneratingThis || !selectedTerm || !selectedSession}
                                                                >
                                                                    {isGeneratingThis ? 'Generating...' : (latestPin ? 'Generate New' : 'Generate PIN')}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Mobile View */}
                                <div className="pg-mobile-view">
                                    {students.map(student => {
                                        const latestPin = getStudentPin(student.id);
                                        const isGeneratingThis = generatingStudentId === student.id;
                                        return (
                                            <div key={student.id} className="pg-mobile-card">
                                                <div className="pg-mobile-top">
                                                    <div>
                                                        <h3 className="pg-mobile-name">{student.lastName} {student.firstName}</h3>
                                                        <p className="pg-mobile-adm">{student.admissionNumber}</p>
                                                    </div>
                                                    {!latestPin ? <span className="pg-status pg-status-none">No PIN</span> :
                                                     latestPin.isUsed ? <span className="pg-status pg-status-used">Used</span> :
                                                     <span className="pg-status pg-status-active">Active</span>}
                                                </div>
                                                
                                                <div className="pg-mobile-bottom">
                                                    <div>
                                                        <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>CURRENT PIN</span>
                                                        {latestPin ? <span className="pg-pin-badge">{latestPin.pin}</span> : <span style={{ color: '#cbd5e1' }}>—</span>}
                                                    </div>
                                                    <button 
                                                        className={`pg-btn-action ${isGeneratingThis ? 'pg-btn-loading' : latestPin ? 'pg-btn-new' : 'pg-btn-generate'}`}
                                                        onClick={() => handleGenerateSingle(student.id)} 
                                                        disabled={isGeneratingThis || !selectedTerm || !selectedSession}
                                                    >
                                                        {isGeneratingThis ? 'Generating...' : (latestPin ? 'New PIN' : 'Generate')}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <div className="pg-empty">
                                <h3>No Students Found</h3>
                                <p>There are no students enrolled in this class.</p>
                            </div>
                        )
                    ) : (
                        <div className="pg-empty">
                            <h3>No class selected</h3>
                            <p>Select a class above to view students and generate PINs.</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}