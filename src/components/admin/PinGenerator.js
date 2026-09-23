import React, { useState, useEffect } from 'react';
import api from '../../services/api'; // Adjust import path

export default function PinGenerator() {
    const [classes, setClasses] = useState([]);
    const [terms, setTerms] = useState([]);
    const [sessions, setSessions] = useState([]);
    
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedTerm, setSelectedTerm] = useState('');
    const [selectedSession, setSelectedSession] = useState('');
    
    const [pins, setPins] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Fetch initial dropdown data
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

    const handleGenerate = async () => {
        if (!selectedClass || !selectedTerm || !selectedSession) {
            setMessage('Please select Class, Term, and Session');
            return;
        }

        setLoading(true);
        setMessage('');
        try {
            const res = await api.post('/admin/result-pins', {
                classId: selectedClass,
                termId: selectedTerm,
                sessionId: selectedSession
            });
            setMessage(res.data.message);
            // Fetch the newly generated pins to display
            const pinsRes = await api.get('/admin/result-pins/list', {
                params: { termId: selectedTerm, sessionId: selectedSession, classId: selectedClass }
            });
            setPins(pinsRes.data?.data || []);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to generate PINs');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '20px' }}>Result PIN Generator</h2>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' }}>
                <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}>
                    <option value="">Select Session</option>
                    {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>

                <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}>
                    <option value="">Select Term</option>
                    {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>

                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}>
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <button 
                    onClick={handleGenerate} 
                    disabled={loading}
                    style={{ background: '#4f46e5', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                >
                    {loading ? 'Generating...' : 'Generate PINs'}
                </button>
            </div>

            {message && <div style={{ color: 'green', marginBottom: '15px' }}>{message}</div>}

            {pins.length > 0 && (
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
                                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#4f46e5' }}>{pin.pin}</td>
                                    <td style={{ padding: '12px' }}>
                                        {pin.isUsed ? <span style={{ color: 'red' }}>Used</span> : <span style={{ color: 'green' }}>Active</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}