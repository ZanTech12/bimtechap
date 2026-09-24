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
        if (selectedSession && selectedTerm && selectedClass) {
            fetchExistingPins();
        } else {
            setPins([]);
        }
    }, [selectedSession, selectedTerm, selectedClass]);

    // 4. Handle manual generation for the ENTIRE CLASS
    const handleGenerateAll = async () => {
        if (!selectedClass || !selectedTerm || !selectedSession) return;

        setGeneratingAll(true);
        setMessage('');
        try {
            const payload = { termId: selectedTerm, sessionId: selectedSession, classId: selectedClass };
            const res = await api.post('/admin/result-pins/generate', payload);
            setMessage(res.data.message);
            await fetchExistingPins(); 
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to generate PINs');
        } finally {
            setGeneratingAll(false);
        }
    };

    // 5. Handle generation for a SINGLE STUDENT
    const handleGenerateSingle = async (studentId) => {
        if (!studentId || !selectedTerm || !selectedSession) return;

        setGeneratingStudentId(studentId);
        setMessage('');
        try {
            const payload = { termId: selectedTerm, sessionId: selectedSession, studentId: studentId };
            const res = await api.post('/admin/result-pins/generate', payload);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
            <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Result PIN Manager</h2>
                <p className="mt-1 text-sm text-gray-500">Generate and manage result access codes for classes or individual students.</p>
            </div>

            {/* Filters Card */}
            <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
                        <select 
                            value={selectedSession} 
                            onChange={(e) => setSelectedSession(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-700"
                        >
                            <option value="">Select Session</option>
                            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                        <select 
                            value={selectedTerm} 
                            onChange={(e) => setSelectedTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-700"
                        >
                            <option value="">Select Term</option>
                            {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                        <select 
                            value={selectedClass} 
                            onChange={(e) => {
                                setSelectedClass(e.target.value);
                                fetchStudents(e.target.value);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-700"
                        >
                            <option value="">Select Class</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button 
                            onClick={handleGenerateAll} 
                            disabled={generatingAll || !selectedClass || !selectedTerm || !selectedSession || students.length === 0}
                            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {generatingAll ? 'Generating...' : 'Generate For Whole Class'}
                        </button>
                    </div>
                </div>
                
                {message && (
                    <div className="mt-4 bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-3 rounded-lg text-sm font-medium">
                        {message}
                    </div>
                )}
            </div>

            {/* Data Display Area */}
            {loadingTable ? (
                <div className="flex justify-center items-center py-20 text-indigo-600 font-medium">
                    Loading students...
                </div>
            ) : (
                selectedClass ? (
                    students.length > 0 ? (
                        <>
                            {/* Desktop View - Table */}
                            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admission No.</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current PIN</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {students.map(student => {
                                            const latestPin = getStudentPin(student.id);
                                            const isGeneratingThis = generatingStudentId === student.id;

                                            return (
                                                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{student.lastName} {student.firstName}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">{student.admissionNumber}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {latestPin ? (
                                                            <span className="text-sm font-bold text-indigo-600 tracking-wider px-2 py-1 bg-indigo-50 rounded">{latestPin.pin}</span>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {!latestPin ? (
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-500">No PIN</span>
                                                        ) : latestPin.isUsed ? (
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-700">Expired</span>
                                                        ) : (
                                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-700">Active</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <button 
                                                            onClick={() => handleGenerateSingle(student.id)}
                                                            disabled={isGeneratingThis || !selectedTerm || !selectedSession}
                                                            className={`text-xs font-semibold py-2 px-3 rounded-lg transition-colors ${
                                                                isGeneratingThis 
                                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                                                    : latestPin 
                                                                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                                                                        : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                                            }`}
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

                            {/* Mobile View - Cards */}
                            <div className="md:hidden space-y-4">
                                {students.map(student => {
                                    const latestPin = getStudentPin(student.id);
                                    const isGeneratingThis = generatingStudentId === student.id;

                                    return (
                                        <div key={student.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="text-sm font-bold text-gray-900">{student.lastName} {student.firstName}</h3>
                                                    <p className="text-xs text-gray-500">{student.admissionNumber}</p>
                                                </div>
                                                <div className="text-right">
                                                    {!latestPin ? (
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-500">No PIN</span>
                                                    ) : latestPin.isUsed ? (
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-700">Expired</span>
                                                    ) : (
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-700">Active</span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-3">
                                                <div>
                                                    <span className="block text-xs text-gray-400 mb-1">Current PIN</span>
                                                    {latestPin ? (
                                                        <span className="text-base font-bold text-indigo-600 tracking-wider">{latestPin.pin}</span>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">—</span>
                                                    )}
                                                </div>
                                                <button 
                                                    onClick={() => handleGenerateSingle(student.id)}
                                                    disabled={isGeneratingThis || !selectedTerm || !selectedSession}
                                                    className={`text-xs font-semibold py-2 px-4 rounded-lg transition-colors ${
                                                        isGeneratingThis 
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                                            : latestPin 
                                                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                                                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                    }`}
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
                        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No Students Found</h3>
                            <p className="text-sm text-gray-500">There are no students enrolled in this class.</p>
                        </div>
                    )
                ) : (
                    <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                        <h3 className="text-sm font-medium text-gray-900">No class selected</h3>
                        <p className="mt-1 text-sm text-gray-500">Select a class above to view students and generate PINs.</p>
                    </div>
                )
            )}
        </div>
    );
}