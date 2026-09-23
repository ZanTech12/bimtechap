import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function PinGenerator() {
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]); // ✅ NEW: Students list
    const [terms, setTerms] = useState([]);
    const [sessions, setSessions] = useState([]);
    
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(''); // ✅ NEW
    const [selectedTerm, setSelectedTerm] = useState('');
    const [selectedSession, setSelectedSession] = useState('');
    
    const [pins, setPins] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
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

    // ✅ 2. Fetch Students when Class changes
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
            setStudents(studentData);
        } catch (err) {
            console.error('Error fetching students:', err);
            setStudents([]);
        }
    };

    // ✅ 3. Auto-fetch existing PINs when selections change
    const fetchExistingPins = async () => {
        setLoading(true);
        setMessage('');
        try {
            const params = { 
                termId: selectedTerm, 
                sessionId: selectedSession 
            };
            // If student is selected, filter by student. Otherwise, filter by class.
            if (selectedStudent) {
                params.studentId = selectedStudent;
            } else if (selectedClass) {
                params.classId = selectedClass;
            }

            const pinsRes = await api.get('/admin/result-pins/list', { params });
            setPins(pinsRes.data?.data || []);
        } catch (err) {
            console.error('Error fetching existing PINs:', err);
            setPins([]);
        } finally {
            setLoading(false);
        }
    };

    // Watch for dropdown changes
    useEffect(() => {
        if (selectedSession && selectedTerm) {
            if (selectedStudent || selectedClass) {
                fetchExistingPins();
            } else {
                setPins([]);
            }
        } else {
            setPins([]);
        }
    }, [selectedSession, selectedTerm, selectedClass, selectedStudent]);

    // ✅ 4. Handle manual generation
    const handleGenerate = async () => {
        if ((!selectedClass && !selectedStudent) || !selectedTerm || !selectedSession) {
            setMessage('Please select Term, Session, and either a Class or a Student.');
            return;
        }

        setGenerating(true);
        setMessage('');
        try {
            const payload = {
                termId: selectedTerm,
                sessionId: selectedSession
            };
            // If student is selected, send studentId. Otherwise, send classId.
            if (selectedStudent) {
                payload.studentId = selectedStudent;
            } else {
                payload.classId = selectedClass;
            }

            const res = await api.post('/admin/result-pins/generate', payload);
            setMessage(res.data.message);
            await fetchExistingPins();
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to generate PINs');
        } finally {
            setGenerating(false);
        }
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
                            setSelectedStudent(''); // Reset student when class changes
                            fetchStudents(e.target.value); // Fetch students for this class
                        }} 
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc', minWidth: '150px' }}
                    >
                        <option value="">All Classes / None</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                {/* ✅ NEW: Student Dropdown */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '14px', marginBottom: '5px' }}>Specific Student (Optional)</label>
                    <select 
                        value={selectedStudent} 
                        onChange={(e) => setSelectedStudent(e.target.value)} 
                        disabled={!selectedClass || students.length === 0}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc', minWidth: '200px' }}
                    >
                        <option value="">All Students in Class</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.lastName} {s.firstName} ({s.admissionNumber})</option>)}
                    </select>
                </div>

                <button 
                    onClick={handleGenerate} 
                    disabled={generating || (!selectedClass && !selectedStudent) || !selectedTerm || !selectedSession}
                    style={{ 
                        background: (generating || (!selectedClass && !selectedStudent) || !selectedTerm || !selectedSession) ? '#a5b4fc' : '#4f46e5', 
                        color: 'white', 
                        padding: '10px 20px', 
                        borderRadius: '8px', 
                        border: 'none', 
                        cursor: 'pointer',
                        height: 'fit-content'
                    }}
                >
                    {generating ? 'Generating...' : 'Generate PINs'}
                </button>
            </div>

            {message && <div style={{ color: 'green', marginBottom: '15px', fontWeight: '500' }}>{message}</div>}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                </div>
            ) : (
                pins.length > 0 ? (
                    <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                                    <th style={{ padding: '12px' }}>Student Name</th>
                                    <th style={{ padding: '12px' }}>Admission No.</th>
                                    <th style={{ padding: '12px' }}>PIN</th>
                                    <th style={{ padding: '12px' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pins.map(pin => (
                                    <tr key={pin.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px' }}>{pin.student?.firstName} {pin.student?.lastName}</td>
                                        <td style={{ padding: '12px' }}>{pin.student?.admissionNumber}</td>
                                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#4f46e5', letterSpacing: '1px' }}>{pin.pin}</td>
                                        <td style={{ padding: '12px' }}>
                                            {pin.isUsed ? (
                                                <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}>Used</span>
                                            ) : (
                                                <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}>Active</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    (selectedSession && selectedTerm && (selectedClass || selectedStudent)) && (
                        <div style={{ background: '#f9fafb', border: '2px dashed #e5e7eb', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '1.1rem', color: '#374151', marginBottom: '5px' }}>No PINs Generated Yet</h3>
                            <p style={{ color: '#888', fontSize: '0.85rem' }}>Click "Generate PINs" to create result access codes.</p>
                        </div>
                    )
                )
            )}
        </div>
    );
}