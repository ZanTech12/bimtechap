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
    const [generatingStudentId, setGeneratingStudentId] = useState(null); // Track which student is generating
    const [message, setMessage] = useState('');

    // 1. Fetch initial dropdown data on mount
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

    // 2. Fetch Students when Class changes
    const fetchStudents = async (classId) => {
        if (!classId) {
            setStudents([]);
            return;
        }
        try {
            const studentsRes = await api.get('/students', { params: { classId } });
            let studentData = [];
            if (Array.isArray(studentsRes.data)) studentData = studentsRes.data;
            else if (studentsRes.data?.data && Array.isArray(studentsRes.data.data)) studentData = studentsRes.data.data;
            
            // Sort students alphabetically
            studentData.sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));
            setStudents(studentData);
        } catch (err) {
            console.error('Error fetching students:', err);
            setStudents([]);
        }
    };

    // 3. Fetch existing PINs
    const fetchExistingPins = async () => {
        if (!selectedTerm || !selectedSession || !selectedClass) {
            setPins([]);
            return;
        }

        setLoadingTable(true);
        setMessage('');
        try {
            const params = { 
                termId: selectedTerm, 
                sessionId: selectedSession,
                classId: selectedClass
            };

            const pinsRes = await api.get('/admin/result-pins/list', { params });
            setPins(pinsRes.data?.data || []);
        } catch (err) {
            console.error('Error fetching existing PINs:', err);
            setPins([]);
        } finally {
            setLoadingTable(false);
        }
    };

    // Watch for dropdown changes to fetch PINs
    useEffect(() => {
        if (selectedSession && selectedTerm && selectedClass) {
            fetchExistingPins();
        } else {
            setPins([]);
        }
    }, [selectedSession, selectedTerm, selectedClass]);

    // 4. Handle manual generation for the ENTIRE CLASS
    const handleGenerateAll = async () => {
        if (!selectedClass || !selectedTerm || !selectedSession) {
            setMessage('Please select Term, Session, and Class.');
            return;
        }

        setGeneratingAll(true);
        setMessage('');
        try {
            const payload = {
                termId: selectedTerm,
                sessionId: selectedSession,
                classId: selectedClass
            };

            const res = await api.post('/admin/result-pins/generate', payload);
            setMessage(res.data.message);
            await fetchExistingPins(); // Refresh table
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to generate PINs');
        } finally {
            setGeneratingAll(false);
        }
    };

    // ✅ 5. Handle generation for a SINGLE STUDENT
    const handleGenerateSingle = async (studentId) => {
        if (!studentId || !selectedTerm || !selectedSession) return;

        setGeneratingStudentId(studentId);
        setMessage('');
        try {
            const payload = {
                termId: selectedTerm,
                sessionId: selectedSession,
                studentId: studentId
            };

            const res = await api.post('/admin/result-pins/generate', payload);
            setMessage(res.data.message);
            await fetchExistingPins(); // Refresh table to show new PIN
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to generate PIN for student');
        } finally {
            setGeneratingStudentId(null);
        }
    };

    // ✅ Helper: Get the latest PIN for a specific student
    const getStudentPin = (studentId) => {
        const studentPins = pins.filter(p => p.studentId === studentId);
        if (studentPins.length === 0) return null;
        // Sort by createdAt descending to get the latest
        return studentPins.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '20px' }}>Result PIN Manager</h2>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '14px', marginBottom: '5px' }}>Session</label>
                    <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc', minWidth: '150px' }}>
                        <option value="">Select Session</option>
                        {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '14px', marginBottom: '5px' }}>Term</label>
                    <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc', minWidth: '150px' }}>
                        <option value="">Select Term</option>
                        {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '14px', marginBottom: '5px' }}>Class</label>
                    <select 
                        value={selectedClass} 
                        onChange={(e) => {
                            setSelectedClass(e.target.value);
                            fetchStudents(e.target.value); // Fetch students for table
                        }} 
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc', minWidth: '150px' }}
                    >
                        <option value="">Select Class</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <button 
                    onClick={handleGenerateAll} 
                    disabled={generatingAll || !selectedClass || !selectedTerm || !selectedSession || students.length === 0}
                    style={{ 
                        background: (generatingAll || !selectedClass || !selectedTerm || !selectedSession || students.length === 0) ? '#a5b4fc' : '#4f46e5', 
                        color: 'white', 
                        padding: '10px 20px', 
                        borderRadius: '8px', 
                        border: 'none', 
                        cursor: 'pointer',
                        height: 'fit-content'
                    }}
                >
                    {generatingAll ? 'Generating All...' : 'Generate For Whole Class'}
                </button>
            </div>

            {message && <div style={{ color: '#4f46e5', marginBottom: '15px', fontWeight: '500', background: '#eef2ff', padding: '10px', borderRadius: '6px' }}>{message}</div>}

            {/* ✅ TABLE DISPLAYING ALL STUDENTS IN THE CLASS */}
            {loadingTable ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                </div>
            ) : (
                selectedClass && students.length > 0 ? (
                    <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                                    <th style={{ padding: '12px' }}>Student Name</th>
                                    <th style={{ padding: '12px' }}>Admission No.</th>
                                    <th style={{ padding: '12px' }}>Current PIN</th>
                                    <th style={{ padding: '12px' }}>Status</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(student => {
                                    const latestPin = getStudentPin(student.id);
                                    const isGeneratingThis = generatingStudentId === student.id;

                                    return (
                                        <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '12px' }}>{student.lastName} {student.firstName}</td>
                                            <td style={{ padding: '12px' }}>{student.admissionNumber}</td>
                                            <td style={{ padding: '12px', fontWeight: 'bold', color: '#4f46e5', letterSpacing: '1px' }}>
                                                {latestPin ? latestPin.pin : '—'}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {!latestPin ? (
                                                    <span style={{ background: '#f3f4f6', color: '#6b7280', padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}>No PIN</span>
                                                ) : latestPin.isUsed ? (
                                                    <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}>Expired/Used</span>
                                                ) : (
                                                    <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}>Active</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>
                                                <button 
                                                    onClick={() => handleGenerateSingle(student.id)}
                                                    disabled={isGeneratingThis || !selectedTerm || !selectedSession}
                                                    style={{
                                                        background: isGeneratingThis ? '#e5e7eb' : (latestPin ? '#f3f4f6' : '#4f46e5'),
                                                        color: isGeneratingThis ? '#6b7280' : (latestPin ? '#374151' : 'white'),
                                                        border: '1px solid #d1d5db',
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        cursor: isGeneratingThis ? 'not-allowed' : 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: '500'
                                                    }}
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
                ) : (
                    selectedClass && (
                        <div style={{ background: '#f9fafb', border: '2px dashed #e5e7eb', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '1.1rem', color: '#374151', marginBottom: '5px' }}>No Students Found</h3>
                            <p style={{ color: '#888', fontSize: '0.85rem' }}>There are no students enrolled in this class.</p>
                        </div>
                    )
                )
            )}
        </div>
    );
}