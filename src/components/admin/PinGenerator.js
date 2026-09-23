import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Adjust path if your api file is elsewhere

export default function PinGenerator() {
    const [classes, setClasses] = useState([]);
    const [terms, setTerms] = useState([]);
    const [sessions, setSessions] = useState([]);
    
    const [selectedClass, setSelectedClass] = useState('');
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

    // 2. Auto-fetch existing PINs when Class, Term, and Session are all selected
    const fetchExistingPins = async () => {
        setLoading(true);
        setMessage('');
        try {
            const pinsRes = await api.get('/admin/result-pins/list', {
                params: { 
                    termId: selectedTerm, 
                    sessionId: selectedSession, 
                    classId: selectedClass 
                }
            });
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
        if (selectedSession && selectedTerm && selectedClass) {
            fetchExistingPins();
        } else {
            setPins([]); // Clear table if not all 3 are selected
        }
    }, [selectedSession, selectedTerm, selectedClass]);

    // 3. Handle manual generation (only if they want to generate new ones)
    const handleGenerate = async () => {
        if (!selectedClass || !selectedTerm || !selectedSession) {
            setMessage('Please select Class, Term, and Session');
            return;
        }

        setGenerating(true);
        setMessage('');
        try {
            const res = await api.post('/admin/result-pins/generate', {
                classId: selectedClass,
                termId: selectedTerm,
                sessionId: selectedSession
            });
            setMessage(res.data.message);
            // Refresh the table to show the newly generated PINs
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
                    <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc', minWidth: '150px' }}>
                        <option value="">Select Class</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <button 
                    onClick={handleGenerate} 
                    disabled={generating || !selectedClass || !selectedTerm || !selectedSession}
                    style={{ 
                        background: (generating || !selectedClass || !selectedTerm || !selectedSession) ? '#a5b4fc' : '#4f46e5', 
                        color: 'white', 
                        padding: '10px 20px', 
                        borderRadius: '8px', 
                        border: 'none', 
                        cursor: 'pointer',
                        height: 'fit-content'
                    }}
                >
                    {generating ? 'Generating...' : 'Generate New PINs'}
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
                    (selectedSession && selectedTerm && selectedClass) && (
                        <div style={{ background: '#f9fafb', border: '2px dashed #e5e7eb', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '1.1rem', color: '#374151', marginBottom: '5px' }}>No PINs Generated Yet</h3>
                            <p style={{ color: '#888', fontSize: '0.85rem' }}>Click "Generate New PINs" to create result access codes for this class.</p>
                        </div>
                    )
                )
            )}
        </div>
    );
}