// ============================================
// ADMIN BROADSHEET PAGE
// Nigerian Secondary School System
// Bootstrap + Custom Creative Design
// Mobile-Optimized Version
// ============================================
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminBroadsheetAPI, termsAPI, sessionsAPI, siteInfoAPI } from '../../api';
import './Broadsheet.css'

// ============================================
// SVG ICON COMPONENTS
// ============================================
const Icons = {
    ArrowLeft: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
    ),
    Printer: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
    ),
    Loader: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${p.className || ''} ${p.spin ? 'spinner-border spinner-border-sm' : ''}`}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
    ),
    AlertCircle: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
    ),
    Users: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    ),
    BookOpen: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
    ),
    BarChart: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>
    ),
    TrendingUp: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
    ),
    Award: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
    ),
    ChevronDown: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="m6 9 6 6 6-6"/></svg>
    ),
    ChevronRight: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="m9 18 6-6-6-6"/></svg>
    ),
    ChevronLeft: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="m15 18-6-6 6-6"/></svg>
    ),
    Filter: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
    ),
    FileText: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
    ),
    ClipboardCheck: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>
    ),
    MessageSquare: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    ),
    Search: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
    ),
    X: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    ),
    Maximize2: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/></svg>
    ),
    Minimize2: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" x2="21" y1="10" y2="3"/><line x1="3" x2="10" y1="21" y2="14"/></svg>
    ),
    ArrowUp: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
    ),
    ArrowDown: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="m5 12 7 7 7-7"/><path d="M12 5v14"/></svg>
    ),
    Eye: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
    ),
    AlertTriangle: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
    ),
    Star: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
    ),
    Zap: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>
    ),
    Target: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
    ),
    Layers: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22.54 12.43-1.14.51"/><path d="m22.54 12.43-8.58 3.91a2 2 0 0 1-1.66 0l-8.58-3.9"/><path d="m22.54 16.43-1.14.51"/><path d="m22.54 16.43-8.58 3.91a2 2 0 0 1-1.66 0l-8.58-3.9"/></svg>
    ),
    GraduationCap: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>
    ),
    DoubleArrow: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="m18 8 4 4-4 4"/><path d="m18 4 4 4-4 4"/><path d="m6 8-4 4 4 4"/><path d="m6 4-4 4 4 4"/></svg>
    ),
    User: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    ),
    Shield: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
    ),
    School: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
    ),
    Grid: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
    ),
    Crown: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
    ),
    Medal: (p) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={p.className}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 6 9 6 9Z"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 18 9 18 9Z"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
    ),
};

// ============================================
// CONSTANTS & CONFIGURATION
// ============================================

// ---- SCHOOL INFO: hardcoded fallback, hydrated LIVE from site settings API ----
// Same object name so ALL existing references keep working unchanged.
const SCHOOL_INFO = {
    name: 'DATFORTE INTERBATIONAL SCHOOL LIMITED',
    address: 'Ahmadiyyah Lagos state',
    motto: 'Discipline & Excellence',
    logo: null,
};

function hydrateSchoolInfo(info) {
    if (!info) return;
    const name = info.schoolName || info.name;
    const address = info.address || info.schoolAddress;
    const motto = info.motto || info.schoolMotto;
    if (name) SCHOOL_INFO.name = name;
    if (address) SCHOOL_INFO.address = address;
    if (motto) SCHOOL_INFO.motto = motto;
    SCHOOL_INFO.logo = info.logoUrl || info.logo || SCHOOL_INFO.logo;
}

let _siteInfoCache = null;

// Fetch site settings once per session; forces re-render when data arrives
function useSiteInfo() {
    const [, force] = useState(0);
    useEffect(() => {
        let active = true;
        if (_siteInfoCache) {
            hydrateSchoolInfo(_siteInfoCache);
            force(n => n + 1);
            return;
        }
        (async () => {
            try {
                const r = await siteInfoAPI.getSiteInfo();
                const info = r?.data || r || null;
                _siteInfoCache = info;
                hydrateSchoolInfo(info);
                if (active) force(n => n + 1);
            } catch { /* silent — hardcoded fallbacks remain */ }
        })();
        return () => { active = false; };
    }, []);
    return SCHOOL_INFO;
}

const GRADING_KEY = [
    { grade: 'A', range: '70 – 100', color: '#059669' },
    { grade: 'B', range: '60 – 69', color: '#2563eb' },
    { grade: 'C', range: '50 – 59', color: '#d97706' },
    { grade: 'D', range: '45 – 49', color: '#ea580c' },
    { grade: 'E', range: '40 – 44', color: '#dc2626' },
    { grade: 'F', range: '0 – 39', color: '#991b1b' },
];

const VIEW_MODES = { DETAILED: 'detailed', COMPACT: 'compact', GRADE_ONLY: 'grade_only', CARDS: 'cards' };

const STICKY_COLS = {
    sn: { width: 42, left: 0 },
    admNo: { width: 80, left: 42 },
    name: { width: 170, left: 122 },
    gender: { width: 40, left: 292 },
};
const STICKY_TOTAL_W = 332;

const STICKY_COLS_MOBILE = {
    sn: { width: 32, left: 0 },
    admNo: { width: 56, left: 32 },
    name: { width: 120, left: 88 },
    gender: { width: 0, left: 208 },
};
const STICKY_TOTAL_W_MOBILE = 208;

const SUB_COLS_DETAILED = [
    { key: 'testScore', label: 'T', width: 36 },
    { key: 'noteTakingScore', label: 'NT', width: 36 },
    { key: 'assignmentScore', label: 'AS', width: 36 },
    { key: 'totalCA', label: 'CA', width: 38 },
    { key: 'examScore', label: 'EX', width: 38 },
    { key: 'totalScore', label: 'Tot', width: 40 },
    { key: 'grade', label: 'G', width: 34 },
    { key: 'remark', label: 'R', width: 42 },
];
const SUB_COLS_COMPACT = [
    { key: 'totalScore', label: 'Total', width: 48 },
    { key: 'grade', label: 'G', width: 34 },
];
const SUB_COLS_GRADE_ONLY = [{ key: 'grade', label: 'G', width: 34 }];

const PAL = {
    green: '#008751',
    greenLight: '#34d399',
    greenDark: '#065f46',
    greenGhost: 'rgba(0,135,81,0.08)',
    greenGhostMed: 'rgba(0,135,81,0.15)',
    hdrPrimary: '#1e1b4b',
    hdrSecondary: '#312e81',
    hdrDeep: '#0f0d2e',
    hdrAccent: '#6366f1',
    hdrGlow: 'rgba(99,102,241,0.35)',
    hdrGold: '#fbbf24',
    hdrGoldGlow: 'rgba(251,191,36,0.25)',
    hdrText: '#e0e7ff',
    hdrMuted: '#a5b4fc',
    dark: '#0c0f1a',
    darkCard: '#141829',
    darkSurface: '#1a1f35',
    darkMuted: '#6b7294',
    darkText: '#c8cde0',
    accentGlow: 'rgba(99,102,241,0.3)',
};

// ============================================
// TOP 3 RANK STYLES
// ============================================
const TOP_RANK_STYLES = [
    { // 1st
        bg: 'linear-gradient(135deg, #fef3c7, #fde68a)',
        border: '#f59e0b',
        textColor: '#92400e',
        badgeBg: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
        badgeText: '#78350f',
        icon: '🥇',
        label: '1st',
    },
    { // 2nd
        bg: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
        border: '#9ca3af',
        textColor: '#374151',
        badgeBg: 'linear-gradient(135deg, #d1d5db, #9ca3af)',
        badgeText: '#1f2937',
        icon: '🥈',
        label: '2nd',
    },
    { // 3rd
        bg: 'linear-gradient(135deg, #ffedd5, #fed7aa)',
        border: '#ea580c',
        textColor: '#7c2d12',
        badgeBg: 'linear-gradient(135deg, #fdba74, #fb923c)',
        badgeText: '#7c2d12',
        icon: '🥉',
        label: '3rd',
    },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================
function getGradeColor(grade) {
    const g = (grade || '').toUpperCase();
    const map = {
        'A': { text: 'text-success', bg: 'bg-success-subtle', dot: '#059669' },
        'B': { text: 'text-primary', bg: 'bg-primary-subtle', dot: '#2563eb' },
        'C': { text: 'text-warning', bg: 'bg-warning-subtle', dot: '#d97706' },
        'D': { text: 'text-orange', bg: 'bg-orange-subtle', dot: '#ea580c' },
        'E': { text: 'text-danger', bg: 'bg-danger-subtle', dot: '#dc2626' },
        'F': { text: 'text-dark', bg: 'bg-dark-subtle', dot: '#991b1b' }
    };
    return map[g] || { text: 'text-secondary', bg: 'bg-body-tertiary', dot: '#6c757d' };
}
function getScoreColor(key, value) {
    if (key === 'grade') return null;
    if (key === 'remark') return 'text-secondary';
    const num = Number(value);
    if (isNaN(num) || num === 0) return 'text-body-tertiary';
    if (key === 'totalScore' || key === 'totalCA' || key === 'examScore') {
        if (num >= 70) return 'text-success fw-semibold';
        if (num >= 50) return 'text-dark';
        if (num >= 40) return 'text-orange';
        return 'text-danger fw-semibold';
    }
    const maxExpected = key === 'testScore' ? 20 : key === 'examScore' ? 60 : 10;
    const pct = (num / maxExpected) * 100;
    if (pct >= 70) return 'text-success';
    if (pct >= 50) return 'text-dark';
    return 'text-orange';
}
function getPositionStyle(position) {
    if (position === 1) return { bg: 'linear-gradient(135deg, #fbbf24, #f59e0b)', text: '#78350f', border: '#d97706' };
    if (position === 2) return { bg: 'linear-gradient(135deg, #e5e7eb, #d1d5db)', text: '#374151', border: '#9ca3af' };
    if (position === 3) return { bg: 'linear-gradient(135deg, #fdba74, #fb923c)', text: '#7c2d12', border: '#ea580c' };
    if (position <= 10) return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' };
    return { bg: '#f8f9fa', text: '#6b7280', border: '#dee2e6' };
}
function getPositionSuffix(pos) {
    if (!pos) return '';
    const s = ['th', 'st', 'nd', 'rd'];
    const v = pos % 100;
    return pos + (s[(v - 20) % 10] || s[v] || s[0]);
}
function fmt(n, d = 0) { return (n === null || n === undefined || isNaN(n)) ? '—' : Number(n).toFixed(d); }
function fmtPct(n) { return (n === null || n === undefined || isNaN(n)) ? '—' : `${Math.round(n)}%`; }
function getStudentRowBg(student, subjects) {
    if (student.subjectsWithoutScores > 0 && student.subjectsWithoutScores === subjects.length) return '#fde2e2';
    if (student.subjectsWithoutScores > subjects.length / 2) return '#fff3cd';
    return null;
}

// ============================================
// POSITION COMPUTED BY AVERAGE (not total scores)
// ============================================
function computePositionsByAverage(students) {
    if (!students || students.length === 0) return {};
    const sorted = [...students]
        .filter(s => s.averageScore > 0)
        .sort((a, b) => b.averageScore - a.averageScore);
    const positionMap = {};
    sorted.forEach((student, index) => {
        if (index === 0) {
            positionMap[student.studentId] = 1;
        } else {
            const prevStudent = sorted[index - 1];
            if (student.averageScore === prevStudent.averageScore) {
                positionMap[student.studentId] = positionMap[prevStudent.studentId];
            } else {
                positionMap[student.studentId] = index + 1;
            }
        }
    });
    return positionMap;
}

// ============================================
// COMPUTE TOP 3 STUDENTS PER SUBJECT
// ============================================
function computeTopStudentsBySubject(students, subjects) {
    if (!students || !subjects) return {};
    const map = {};
    subjects.forEach(subject => {
        const ranked = students
            .filter(s => {
                const score = s.scores?.[subject.subjectId]?.totalScore;
                return score !== null && score !== undefined && score > 0;
            })
            .sort((a, b) => {
                const scoreA = a.scores[subject.subjectId].totalScore;
                const scoreB = b.scores[subject.subjectId].totalScore;
                if (scoreB !== scoreA) return scoreB - scoreA;
                // Tie-break by student name alphabetically for consistency
                return (a.studentName || '').localeCompare(b.studentName || '');
            })
            .slice(0, 3)
            .map((s, idx) => ({
                name: s.studentName,
                score: s.scores[subject.subjectId].totalScore,
                grade: s.scores[subject.subjectId].grade,
                rank: idx + 1,
            }));
        map[subject.subjectId] = ranked;
    });
    return map;
}

// ============================================
// CUSTOM HOOKS (ORIGINAL — untouched)
// ============================================
function useAdminClassList(filters) {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [meta, setMeta] = useState(null);
    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const r = await adminBroadsheetAPI.getClasses({ termId: filters.termId, sessionId: filters.sessionId });
            if (r.success) { setClasses(r.data || []); setMeta(r.meta || null); } else setError(r.message || 'Failed');
        } catch (e) { setError(e.response?.data?.message || e.message || 'Network error'); }
        finally { setLoading(false); }
    }, [filters.termId, filters.sessionId]);
    useEffect(() => { load(); }, [load]);
    return { classes, loading, error, meta, refetch: load };
}

function useAdminBroadsheet(classId, filters) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const load = useCallback(async () => {
        if (!classId) return;
        setLoading(true); setError(null);
        try {
            const r = await adminBroadsheetAPI.getDetailedBroadsheet(classId, { termId: filters.termId, sessionId: filters.sessionId });
            if (r.success) setData(r.data); else setError(r.message || 'Failed');
        } catch (e) { setError(e.response?.data?.message || e.message || 'Network error'); }
        finally { setLoading(false); }
    }, [classId, filters.termId, filters.sessionId]);
    useEffect(() => { load(); }, [load]);
    return { data, loading, error, refetch: load };
}

function useIsMobile(breakpoint = 640) {
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
    );
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
        const handler = (e) => setIsMobile(e.matches);
        mql.addEventListener('change', handler);
        setIsMobile(mql.matches);
        return () => mql.removeEventListener('change', handler);
    }, [breakpoint]);
    return isMobile;
}

// ============================================
// TERMS / SESSIONS LOADER
// Probes multiple common method names so it works
// regardless of the exact API shape in your project.
// ============================================
const unpackList = (r) => {
    if (Array.isArray(r)) return r;
    if (Array.isArray(r?.data?.data)) return r.data.data;
    if (Array.isArray(r?.data)) return r.data;
    if (Array.isArray(r?.terms)) return r.terms;
    if (Array.isArray(r?.sessions)) return r.sessions;
    return [];
};

async function probeApiMethod(apiObj, methodNames) {
    if (!apiObj) return [];
    for (const name of methodNames) {
        if (typeof apiObj[name] === 'function') {
            try {
                const r = await apiObj[name]();
                const list = unpackList(r);
                if (Array.isArray(list)) return list;
            } catch { /* try next method name */ }
        }
    }
    return [];
}

function useTermsAndSessions() {
    const [terms, setTerms] = useState([]);
    const [sessions, setSessions] = useState([]);
    useEffect(() => {
        let active = true;
        (async () => {
            const [t, s] = await Promise.all([
                probeApiMethod(termsAPI, ['getAll', 'getTerms', 'fetchTerms', 'list', 'get']),
                probeApiMethod(sessionsAPI, ['getAll', 'getSessions', 'fetchSessions', 'list', 'get']),
            ]);
            if (active) { setTerms(t); setSessions(s); }
        })();
        return () => { active = false; };
    }, []);
    return { terms, sessions };
}

// ============================================
// MOBILE STUDENT CARD
// ============================================
function MobileStudentCard({ student, subjects, index, showAttendance, showComments, positionByAverage }) {
    const [expanded, setExpanded] = useState(false);
    const missingBg = getStudentRowBg(student, subjects);
    const borderColor = student.subjectsWithoutScores === subjects.length
        ? '#ef4444'
        : student.subjectsWithoutScores > subjects.length / 2
            ? '#f59e0b'
            : PAL.hdrAccent + '30';

    const computedPosition = positionByAverage?.[student.studentId] || null;
    const posStyle = computedPosition ? getPositionStyle(computedPosition) : null;

    return (
        <div
            className="bs-mobile-student-card"
            style={{
                borderLeft: `4px solid ${borderColor}`,
                background: missingBg ? `${missingBg}30` : 'white',
            }}
        >
            <button
                className="bs-mobile-card-header"
                onClick={() => setExpanded(!expanded)}
                type="button"
            >
                <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ minWidth: 0 }}>
                    <span className="bs-mobile-card-sn">{index + 1}</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <p className="bs-mobile-card-name mb-0" title={student.studentName}>
                            {student.studentName}
                        </p>
                        <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.6rem', color: '#868e96' }}>
                            <span className="font-monospace">{student.admissionNumber}</span>
                            <span style={{
                                color: student.gender === 'Male' ? '#2563eb' : '#db2777',
                                fontWeight: 700,
                                fontSize: '0.55rem',
                            }}>{student.gender === 'Male' ? 'M' : 'F'}</span>
                        </div>
                    </div>
                </div>
                <div className="d-flex align-items-center gap-2 flex-shrink-0">
                    {student.totalScore > 0 && (
                        <div className="text-end">
                            <p className="bs-mobile-card-total mb-0">{student.totalScore}</p>
                            <p className="mb-0" style={{ fontSize: '0.55rem', color: '#868e96' }}>
                                Avg: {fmt(student.averageScore, 1)}
                            </p>
                        </div>
                    )}
                    {posStyle && (
                        <span className="bs-pos-badge" style={{
                            background: posStyle.bg,
                            color: posStyle.text,
                            border: `1px solid ${posStyle.border}`,
                            fontSize: '0.5rem',
                            minWidth: 28,
                            padding: '2px 4px',
                        }}>
                            {getPositionSuffix(computedPosition)}
                        </span>
                    )}
                    <div className="bs-mobile-card-chevron" style={{
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}>
                        <Icons.ChevronDown size={14} />
                    </div>
                </div>
            </button>

            {expanded && (
                <div className="bs-mobile-card-body">
                    <div className="bs-mobile-subjects-grid">
                        {subjects.map((subject) => {
                            const score = student.scores?.[subject.subjectId];
                            if (!score) {
                                return (
                                    <div key={subject.subjectId} className="bs-mobile-subject-item bs-mobile-subject-item--empty">
                                        <p className="bs-mobile-subject-name mb-0">{subject.subjectName}</p>
                                        <span className="bs-mobile-subject-dash">—</span>
                                    </div>
                                );
                            }
                            const gc = getGradeColor(score.grade);
                            const totalColor = score.totalScore >= 70 ? '#059669' : score.totalScore >= 50 ? '#212529' : score.totalScore >= 40 ? '#ea580c' : '#dc2626';
                            return (
                                <div key={subject.subjectId} className="bs-mobile-subject-item">
                                    <p className="bs-mobile-subject-name mb-0">{subject.subjectName}</p>
                                    <div className="d-flex align-items-center gap-1.5">
                                        <span className="bs-mobile-subject-total" style={{ color: totalColor }}>
                                            {fmt(score.totalScore)}
                                        </span>
                                        <span className="bs-grade-badge" style={{
                                            background: `${gc.dot}15`,
                                            color: gc.dot,
                                            width: 20, height: 20,
                                            fontSize: '0.5rem',
                                        }}>
                                            {score.grade}
                                        </span>
                                    </div>
                                    {(score.totalCA !== null && score.totalCA !== undefined) && (
                                        <p className="mb-0" style={{ fontSize: '0.5rem', color: '#868e96' }}>
                                            CA: {fmt(score.totalCA)} | EX: {fmt(score.examScore)}
                                        </p>
                                    )}
                                    {score.remark && (
                                        <p className="mb-0 fst-italic" style={{ fontSize: '0.5rem', color: '#6c757d' }}>
                                            {score.remark}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {showAttendance && student.attendance && (
                        <div className="bs-mobile-att-row">
                            <span className="text-body-tertiary" style={{ fontSize: '0.6rem' }}>Attendance:</span>
                            <span className={`fw-semibold ${student.attendance.percentage >= 75 ? 'text-success' : student.attendance.percentage >= 50 ? 'text-warning' : 'text-danger'}`} style={{ fontSize: '0.65rem' }}>
                                {fmtPct(student.attendance.percentage)}
                            </span>
                        </div>
                    )}
                    {showComments && student.classTeacherComment && (
                        <div className="bs-mobile-comment-row">
                            <span className="text-body-tertiary" style={{ fontSize: '0.6rem' }}>Comment:</span>
                            <span style={{ fontSize: '0.6rem', color: '#6c757d' }}>{student.classTeacherComment}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================
// VERTICAL SCROLL CONTROL BAR
// ============================================
function VerticalScrollBar({ scrollRef }) {
    const [scrollTop, setScrollTop] = useState(0);
    const [maxScroll, setMaxScroll] = useState(0);
    const raf = useRef(null);
    const holdRef = useRef(null);

    useEffect(() => {
        const c = scrollRef?.current; if (!c) return;
        const u = () => {
            if (raf.current) cancelAnimationFrame(raf.current);
            raf.current = requestAnimationFrame(() => {
                setScrollTop(c.scrollTop);
                setMaxScroll(c.scrollHeight - c.clientHeight);
            });
        };
        c.addEventListener('scroll', u, { passive: true });
        u();
        const ro = new ResizeObserver(u);
        ro.observe(c);
        return () => {
            c.removeEventListener('scroll', u);
            if (raf.current) cancelAnimationFrame(raf.current);
            ro.disconnect();
            if (holdRef.current) cancelAnimationFrame(holdRef.current);
        };
    }, [scrollRef]);

    const startHold = useCallback((dir) => {
        const step = () => {
            const c = scrollRef?.current;
            if (c) c.scrollBy({ top: dir * 8, behavior: 'auto' });
            holdRef.current = requestAnimationFrame(step);
        };
        holdRef.current = requestAnimationFrame(step);
    }, [scrollRef]);
    const stopHold = useCallback(() => {
        if (holdRef.current) { cancelAnimationFrame(holdRef.current); holdRef.current = null; }
    }, []);
    const jump = useCallback((pos) => {
        const c = scrollRef?.current;
        if (c) c.scrollTo({ top: pos === 'start' ? 0 : maxScroll, behavior: 'smooth' });
    }, [scrollRef, maxScroll]);
    const pct = maxScroll > 0 ? Math.round((scrollTop / maxScroll) * 100) : 0;

    if (maxScroll <= 20) return null;

    const btnStyle = (isEnd) => ({
        fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.04em',
        background: `linear-gradient(135deg, ${isEnd ? PAL.greenDark : PAL.green}, ${PAL.greenLight})`,
        color: 'white', border: `1px solid ${PAL.green}40`,
        boxShadow: `0 2px 10px ${PAL.accentGlow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
        padding: '4px 10px',
    });
    const arrowStyle = {
        width: 40, height: 40,
        background: `linear-gradient(135deg, ${PAL.green}, ${PAL.greenLight})`,
        color: 'white', border: `1px solid ${PAL.green}50`,
        boxShadow: `0 3px 14px ${PAL.accentGlow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
    };

    return (
        <div className="no-print mt-1 mb-1 px-1 px-md-0">
            <div className="d-flex align-items-center gap-2 mb-1.5 d-none d-md-flex">
                <div className="flex-grow-1" style={{ height: 1, background: `linear-gradient(90deg, transparent, ${PAL.green}20, transparent)` }} />
                <span className="d-flex align-items-center gap-1" style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: PAL.greenDark }}>
                    <Icons.ArrowUp size={10} /><Icons.ArrowDown size={10} /> Scroll Up / Down
                </span>
                <div className="flex-grow-1" style={{ height: 1, background: `linear-gradient(90deg, transparent, ${PAL.green}20, transparent)` }} />
            </div>
            <div className="d-flex align-items-center gap-1 gap-md-2">
                <button onClick={() => jump('start')} className="btn btn-sm d-none d-md-flex align-items-center gap-1 rounded-pill" style={btnStyle(true)}>
                    <Icons.ArrowUp size={11} /> Top
                </button>
                <button onMouseDown={() => startHold(-1)} onMouseUp={stopHold} onMouseLeave={stopHold} onTouchStart={() => startHold(-1)} onTouchEnd={stopHold}
                    className="btn d-flex align-items-center justify-content-center rounded-pill" style={arrowStyle}>
                    <Icons.ArrowUp size={18} />
                </button>
                <div className="flex-grow-1 position-relative rounded-pill" style={{ height: 8, background: 'rgba(0,135,81,0.06)', overflow: 'hidden' }}>
                    <div className="position-absolute top-0 start-0 h-100 rounded-pill" style={{ width: `${Math.max(3, pct)}%`, background: `linear-gradient(90deg, ${PAL.green}, ${PAL.greenLight})`, boxShadow: `0 0 10px ${PAL.accentGlow}`, transition: 'width 0.15s' }} />
                    <div className="position-absolute top-50 rounded-circle" style={{ left: `${pct}%`, width: 14, height: 14, transform: 'translate(-50%,-50%)', background: `linear-gradient(135deg, ${PAL.greenLight}, ${PAL.green})`, boxShadow: `0 0 8px ${PAL.accentGlow}, 0 2px 6px rgba(0,0,0,0.15)`, border: '2px solid white', transition: 'left 0.15s' }} />
                </div>
                <span className="font-monospace fw-bold d-none d-md-block" style={{ fontSize: '0.65rem', color: PAL.greenDark, minWidth: 34, textAlign: 'center' }}>{pct}%</span>
                <button onMouseDown={() => startHold(1)} onMouseUp={stopHold} onMouseLeave={stopHold} onTouchStart={() => startHold(1)} onTouchEnd={stopHold}
                    className="btn d-flex align-items-center justify-content-center rounded-pill" style={arrowStyle}>
                    <Icons.ArrowDown size={18} />
                </button>
                <button onClick={() => jump('end')} className="btn btn-sm d-none d-md-flex align-items-center gap-1 rounded-pill" style={btnStyle(false)}>
                    Bottom <Icons.ArrowDown size={11} />
                </button>
            </div>
        </div>
    );
}

// ============================================
// HORIZONTAL SCROLL CONTROL BAR
// ============================================
function HorizontalScrollBar({ scrollRef }) {
    const [sLeft, setSLeft] = useState(0);
    const [maxS, setMaxS] = useState(0);
    const raf = useRef(null);
    const holdRef = useRef(null);

    useEffect(() => {
        const c = scrollRef?.current; if (!c) return;
        const u = () => {
            if (raf.current) cancelAnimationFrame(raf.current);
            raf.current = requestAnimationFrame(() => {
                setSLeft(c.scrollLeft);
                setMaxS(c.scrollWidth - c.clientWidth);
            });
        };
        c.addEventListener('scroll', u, { passive: true }); u();
        const ro = new ResizeObserver(u); ro.observe(c);
        return () => {
            c.removeEventListener('scroll', u);
            if (raf.current) cancelAnimationFrame(raf.current);
            ro.disconnect();
            if (holdRef.current) cancelAnimationFrame(holdRef.current);
        };
    }, [scrollRef]);

    const startHold = useCallback((dir) => {
        const step = () => {
            const c = scrollRef?.current;
            if (c) c.scrollBy({ left: dir * 8, behavior: 'auto' });
            holdRef.current = requestAnimationFrame(step);
        };
        holdRef.current = requestAnimationFrame(step);
    }, [scrollRef]);
    const stopHold = useCallback(() => {
        if (holdRef.current) { cancelAnimationFrame(holdRef.current); holdRef.current = null; }
    }, []);
    const jump = useCallback((pos) => {
        const c = scrollRef?.current;
        if (c) c.scrollTo({ left: pos === 'start' ? 0 : maxS, behavior: 'smooth' });
    }, [scrollRef, maxS]);
    const pct = maxS > 0 ? Math.round((sLeft / maxS) * 100) : 0;

    if (maxS <= 20) return null;

    const btnStyle = (isEnd) => ({
        fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.04em',
        background: `linear-gradient(135deg, ${isEnd ? PAL.hdrDeep : PAL.hdrPrimary}, ${PAL.hdrSecondary})`,
        color: PAL.hdrGold, border: `1px solid ${PAL.hdrAccent}40`,
        boxShadow: `0 2px 10px ${PAL.hdrGlow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
        padding: '4px 10px',
    });
    const arrowStyle = {
        width: 40, height: 40,
        background: `linear-gradient(135deg, ${PAL.hdrPrimary}, ${PAL.hdrSecondary})`,
        color: 'white', border: `1px solid ${PAL.hdrAccent}50`,
        boxShadow: `0 3px 14px ${PAL.hdrGlow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
    };

    return (
        <div className="no-print mt-1 mb-1 px-1 px-md-0">
            <div className="d-flex align-items-center gap-2 mb-1.5 d-none d-md-flex">
                <div className="flex-grow-1" style={{ height: 1, background: `linear-gradient(90deg, transparent, ${PAL.hdrAccent}25, transparent)` }} />
                <span className="d-flex align-items-center gap-1" style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: PAL.hdrSecondary }}>
                    <Icons.DoubleArrow size={11} style={{ color: PAL.hdrAccent }} /> Scroll Left / Right
                </span>
                <div className="flex-grow-1" style={{ height: 1, background: `linear-gradient(90deg, transparent, ${PAL.hdrAccent}25, transparent)` }} />
            </div>
            <div className="d-flex align-items-center gap-1 gap-md-2">
                <button onClick={() => jump('start')} className="btn btn-sm d-none d-md-flex align-items-center gap-1 rounded-pill" style={btnStyle(true)}>
                    <Icons.ChevronLeft size={11} /> Start
                </button>
                <button onMouseDown={() => startHold(-1)} onMouseUp={stopHold} onMouseLeave={stopHold} onTouchStart={() => startHold(-1)} onTouchEnd={stopHold}
                    className="btn d-flex align-items-center justify-content-center rounded-pill" style={arrowStyle}>
                    <Icons.ChevronLeft size={18} />
                </button>
                <div className="flex-grow-1 position-relative rounded-pill" style={{ height: 8, background: 'rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <div className="position-absolute top-0 start-0 h-100 rounded-pill" style={{ width: `${Math.max(3, pct)}%`, background: `linear-gradient(90deg, ${PAL.hdrAccent}, ${PAL.hdrGold})`, boxShadow: `0 0 10px ${PAL.hdrGlow}`, transition: 'width 0.15s' }} />
                    <div className="position-absolute top-50 rounded-circle" style={{ left: `${pct}%`, width: 12, height: 12, transform: 'translate(-50%,-50%)', background: `linear-gradient(135deg, ${PAL.hdrGold}, ${PAL.hdrAccent})`, boxShadow: `0 0 8px ${PAL.hdrGoldGlow}, 0 2px 6px rgba(0,0,0,0.15)`, border: '2px solid white', transition: 'left 0.15s' }} />
                </div>
                <span className="font-monospace fw-bold d-none d-md-block" style={{ fontSize: '0.65rem', color: PAL.hdrSecondary, minWidth: 34, textAlign: 'center' }}>{pct}%</span>
                <button onMouseDown={() => startHold(1)} onMouseUp={stopHold} onMouseLeave={stopHold} onTouchStart={() => startHold(1)} onTouchEnd={stopHold}
                    className="btn d-flex align-items-center justify-content-center rounded-pill" style={arrowStyle}>
                    <Icons.ChevronRight size={18} />
                </button>
                <button onClick={() => jump('end')} className="btn btn-sm d-none d-md-flex align-items-center gap-1 rounded-pill" style={btnStyle(false)}>
                    End <Icons.ChevronRight size={11} />
                </button>
            </div>
        </div>
    );
}

// ============================================
// HERO SCHOOL HEADER (Admin variant — LIVE site settings)
// ============================================
function HeroSchoolHeader({ data }) {
    return (
        <div className="position-relative overflow-hidden rounded-3 rounded-md-4 mb-2 mb-md-3" style={{
            background: `linear-gradient(135deg, ${PAL.hdrDeep} 0%, ${PAL.hdrPrimary} 35%, ${PAL.hdrSecondary} 70%, ${PAL.hdrDeep} 100%)`,
            boxShadow: `0 8px 40px ${PAL.hdrGlow}, 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)`,
        }}>
            <div className="position-absolute top-0 start-0 end-0 bottom-0 overflow-hidden pointer-events-none">
                <div className="w-100 h-100" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)`, backgroundSize: '36px 36px' }} />
                <div className="position-absolute rounded-circle" style={{ top: -60, right: -40, width: 220, height: 220, background: `radial-gradient(circle, ${PAL.hdrGlow} 0%, transparent 70%)`, filter: 'blur(50px)' }} />
                <div className="position-absolute rounded-circle" style={{ bottom: -50, left: -30, width: 160, height: 160, background: `radial-gradient(circle, ${PAL.hdrGoldGlow} 0%, transparent 70%)`, filter: 'blur(40px)' }} />
                <div className="position-absolute top-0 start-0 end-0" style={{ height: 4, background: `linear-gradient(90deg, #008751 0%, #008751 33%, white 33%, white 66%, #008751 66%, #008751 100%)` }} />
                <div className="position-absolute bottom-0 start-0 end-0" style={{ height: 3, background: `linear-gradient(90deg, transparent 5%, ${PAL.hdrGold} 30%, ${PAL.hdrGold} 70%, transparent 95%)`, opacity: 0.6 }} />
            </div>
            <div className="position-relative z-1 text-center px-2 px-sm-3 px-md-4 py-2 py-sm-3 py-md-4">
                <div className="d-flex justify-content-center mb-1.5 mb-md-3">
                    <div className="position-relative">
                        {SCHOOL_INFO.logo ? (
                            <img
                                src={SCHOOL_INFO.logo}
                                alt="School logo"
                                className="rounded-3"
                                style={{
                                    width: 46, height: 46, objectFit: 'cover',
                                    border: `1.5px solid ${PAL.hdrGold}50`,
                                    boxShadow: `0 0 40px ${PAL.hdrGoldGlow}`,
                                    background: 'white',
                                }}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                        ) : (
                            <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 40, height: 40, background: `linear-gradient(145deg, rgba(251,191,36,0.15), rgba(99,102,241,0.1))`, border: `1.5px solid ${PAL.hdrGold}50`, boxShadow: `0 0 40px ${PAL.hdrGoldGlow}` }}>
                                <Icons.GraduationCap size={18} style={{ color: PAL.hdrGold }} />
                            </div>
                        )}
                        <div className="position-absolute d-flex align-items-center justify-content-center rounded-2" style={{ top: -4, right: -6, width: 18, height: 18, background: `linear-gradient(135deg, ${PAL.hdrAccent}, #818cf8)`, boxShadow: `0 2px 8px ${PAL.hdrGlow}`, border: '1.5px solid white' }}>
                            <Icons.Shield size={9} style={{ color: 'white' }} />
                        </div>
                    </div>
                </div>
                <h1 className="fw-black text-uppercase mb-0.5 mb-md-1" style={{ fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '0.15em', color: PAL.hdrGold, textShadow: `0 2px 24px ${PAL.hdrGoldGlow}`, fontSize: 'clamp(0.72rem, 3.2vw, 1.3rem)', lineHeight: 1.2 }}>{SCHOOL_INFO.name}</h1>
                <p className="text-uppercase mb-1 d-none d-md-block" style={{ fontSize: '0.68rem', letterSpacing: '0.16em', color: PAL.hdrMuted }}>{SCHOOL_INFO.address}</p>
                <div className="d-inline-flex align-items-center gap-2 px-2.5 py-0.5 rounded-pill mb-1.5 mb-md-3" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.18)' }}>
                    <span className="rounded-circle d-block" style={{ width: 4, height: 4, background: PAL.hdrGold, boxShadow: `0 0 8px ${PAL.hdrGoldGlow}` }} />
                    <p className="fst-italic fw-medium mb-0" style={{ fontSize: 'clamp(0.5rem, 1.5vw, 0.6rem)', color: PAL.hdrGold }}>"{SCHOOL_INFO.motto}"</p>
                    <span className="rounded-circle d-block" style={{ width: 4, height: 4, background: PAL.hdrGold, boxShadow: `0 0 8px ${PAL.hdrGoldGlow}` }} />
                </div>
                <div className="d-inline-block px-3 px-md-4 py-1 py-md-1.5 rounded-3 text-uppercase mb-1.5 mb-md-3" style={{ fontSize: 'clamp(0.55rem, 1.6vw, 0.65rem)', fontWeight: 900, letterSpacing: '0.3em', background: `linear-gradient(135deg, ${PAL.hdrGold}, #f59e0b)`, color: PAL.hdrDeep, boxShadow: `0 6px 24px ${PAL.hdrGoldGlow}` }}>Admin Broadsheet</div>
                {data && (
                    <div className="d-flex flex-wrap justify-content-center gap-1.5 gap-md-3 mt-1 mt-md-2">
                        {[['Class', data.classInfo?.classFullName], ['Teacher', data.classInfo?.classTeacher?.name], ['Term', data.termInfo?.name], ['Session', data.sessionInfo?.name]].map(([label, value]) => (
                            <div key={label} className="d-flex align-items-center gap-1">
                                <span className="rounded-circle d-block" style={{ width: 3, height: 3, background: PAL.hdrGold }} />
                                <span style={{ fontSize: 'clamp(0.52rem, 1.5vw, 0.62rem)', color: PAL.hdrMuted, fontWeight: 600 }}>{label}:</span>
                                <span className="fw-bold" style={{ fontSize: 'clamp(0.6rem, 2.2vw, 0.78rem)', color: '#ffffff', maxWidth: label === 'Class' ? 'none' : '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: label === 'Class' ? 'normal' : 'nowrap' }}>{value || '—'}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================
// STAT CARD
// ============================================
function StatCard({ icon, label, value, sub, color, accent }) {
    return (
        <div className="rounded-3 p-2 p-md-3 d-flex align-items-center gap-2 gap-md-3" style={{
            background: 'white',
            border: `1px solid ${accent}25`,
            borderLeft: `4px solid ${color}`,
            boxShadow: `0 2px 12px ${accent}15`,
        }}>
            <div className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0" style={{
                width: 38, height: 38, background: `${color}14`, color,
            }}>
                {icon}
            </div>
            <div style={{ minWidth: 0 }}>
                <p className="mb-0 text-uppercase" style={{ fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.1em', color: '#868e96' }}>{label}</p>
                <p className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.95rem, 3vw, 1.25rem)', color: '#212529', lineHeight: 1.2 }}>{value}</p>
                {sub && <p className="mb-0" style={{ fontSize: '0.58rem', color: '#868e96' }}>{sub}</p>}
            </div>
        </div>
    );
}

// ============================================
// TOP PERFORMERS PANEL (per subject)
// ============================================
function TopPerformersPanel({ topBySubject, subjects }) {
    const entries = subjects
        .map(s => ({ subject: s, top: topBySubject?.[s.subjectId] || [] }))
        .filter(e => e.top.length > 0);
    if (!entries.length) return null;

    return (
        <div className="rounded-3 p-2 p-md-3 mb-2 mb-md-3" style={{ background: 'white', border: '1px solid #e9ecef', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div className="d-flex align-items-center gap-2 mb-2">
                <span className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 26, height: 26, background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#78350f' }}>
                    <Icons.Crown size={13} />
                </span>
                <span className="fw-bold text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.14em', color: PAL.hdrSecondary }}>
                    Subject Champions — Top 3
                </span>
                <div className="flex-grow-1" style={{ height: 1, background: 'linear-gradient(90deg, #e9ecef, transparent)' }} />
            </div>
            <div className="d-flex flex-wrap gap-2">
                {entries.map(({ subject, top }) => (
                    <div key={subject.subjectId} className="rounded-3 px-2 py-1.5" style={{ background: '#f8f9fa', border: '1px solid #eef0f2', minWidth: 150 }}>
                        <p className="mb-1 fw-bold" style={{ fontSize: '0.62rem', color: '#495057' }}>{subject.subjectName}</p>
                        <div className="d-flex flex-column gap-1">
                            {top.map((t) => {
                                const st = TOP_RANK_STYLES[t.rank - 1];
                                return (
                                    <div key={t.rank} className="d-flex align-items-center gap-1.5 rounded-pill px-1.5 py-0.5" style={{ background: st.bg, border: `1px solid ${st.border}` }}>
                                        <span style={{ fontSize: '0.6rem' }}>{st.icon}</span>
                                        <span className="fw-semibold" style={{ fontSize: '0.56rem', color: st.textColor, maxWidth: 96, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                                        <span className="ms-auto fw-bold font-monospace" style={{ fontSize: '0.56rem', color: st.badgeText }}>{fmt(t.score)}{t.grade ? ` · ${t.grade}` : ''}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================
// GRADING KEY LEGEND
// ============================================
function GradingKeyLegend() {
    return (
        <div className="d-flex flex-wrap align-items-center gap-1.5 gap-md-2 mb-2 mb-md-3 no-print">
            <span className="d-flex align-items-center gap-1 fw-bold" style={{ fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#868e96' }}>
                <Icons.Target size={11} /> Grading Key:
            </span>
            {GRADING_KEY.map(g => (
                <span key={g.grade} className="d-inline-flex align-items-center gap-1 rounded-pill px-2 py-0.5" style={{ background: `${g.color}12`, border: `1px solid ${g.color}35` }}>
                    <b style={{ fontSize: '0.58rem', color: g.color }}>{g.grade}</b>
                    <span style={{ fontSize: '0.55rem', color: '#6c757d' }}>{g.range}</span>
                </span>
            ))}
        </div>
    );
}

// ============================================
// DESKTOP TABLE CELL HELPERS
// ============================================
const stickyCellStyle = (col, z = 12) => ({
    position: 'sticky', left: col.left,
    width: col.width, minWidth: col.width, maxWidth: col.width,
    zIndex: z,
});

function ScoreCell({ score, colKey }) {
    if (!score) return <td className="text-center text-body-tertiary" style={{ fontSize: '0.62rem' }}>—</td>;
    const val = score[colKey];
    if (colKey === 'grade') {
        const gc = getGradeColor(score.grade);
        return (
            <td className="text-center">
                <span className="d-inline-flex align-items-center justify-content-center rounded fw-bold" style={{
                    width: 22, height: 22, fontSize: '0.58rem',
                    background: `${gc.dot}15`, color: gc.dot,
                }}>{score.grade || '—'}</span>
            </td>
        );
    }
    if (colKey === 'remark') {
        return (
            <td className="text-center fst-italic" style={{ fontSize: '0.52rem', color: '#6c757d', maxWidth: 42, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={score.remark || ''}>
                {score.remark || '—'}
            </td>
        );
    }
    return (
        <td className={`text-center font-monospace ${getScoreColor(colKey, val)}`} style={{ fontSize: '0.62rem' }}>
            {fmt(val)}
        </td>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================
const AdminBroadsheet = () => {
    const params = useParams();
    const navigate = useNavigate();
    const urlClassId = params.classId || params.id || '';
    const isMobile = useIsMobile(768);
    useSiteInfo();                                    // ← LIVE site settings hydrate SCHOOL_INFO

    // Filters — classId seeded from URL param (matches your route structure)
    const [filters, setFilters] = useState({ classId: urlClassId, termId: '', sessionId: '' });
    const classList = useAdminClassList(filters);     // ← YOUR original hook, exact signature
    const broadsheet = useAdminBroadsheet(filters.classId, filters);  // ← YOUR original hook
    const { terms, sessions } = useTermsAndSessions();

    // Sync URL param → filters (e.g. navigating between classes)
    useEffect(() => {
        if (urlClassId && urlClassId !== filters.classId) {
            setFilters(f => ({ ...f, classId: urlClassId }));
        }
    }, [urlClassId]); // eslint-disable-line

    // UI state
    const [viewMode, setViewMode] = useState(VIEW_MODES.DETAILED);
    const [search, setSearch] = useState('');
    const [showAttendance, setShowAttendance] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const scrollRef = useRef(null);

    const students = broadsheet.data?.students || [];
    const subjects = broadsheet.data?.subjects || [];

    // Derived
    const positionByAverage = useMemo(() => computePositionsByAverage(students), [students]);
    const topBySubject = useMemo(() => computeTopStudentsBySubject(students, subjects), [students, subjects]);

    const filteredStudents = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return students;
        return students.filter(s =>
            s.studentName?.toLowerCase().includes(q) ||
            s.admissionNumber?.toLowerCase().includes(q)
        );
    }, [students, search]);

    const stats = useMemo(() => {
        const withAvg = students.filter(s => s.averageScore > 0);
        const classAvg = withAvg.length ? withAvg.reduce((a, s) => a + s.averageScore, 0) / withAvg.length : null;
        const topId = Object.entries(positionByAverage).find(([, p]) => p === 1)?.[0];
        const topStudent = students.find(s => s.studentId === topId) || null;
        return { total: students.length, subjects: subjects.length, classAvg, topStudent };
    }, [students, subjects, positionByAverage]);

    // Subject footer averages (per totalScore)
    const subjectAverages = useMemo(() => {
        const map = {};
        subjects.forEach(sub => {
            const vals = students
                .map(s => s.scores?.[sub.subjectId]?.totalScore)
                .filter(v => v !== null && v !== undefined && v > 0);
            map[sub.subjectId] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
        });
        return map;
    }, [students, subjects]);

    // Auto-apply meta defaults (from YOUR classList hook — active term/session)
    useEffect(() => {
        if (classList.meta?.termId && !filters.termId) setFilters(f => ({ ...f, termId: classList.meta.termId }));
        if (classList.meta?.sessionId && !filters.sessionId) setFilters(f => ({ ...f, sessionId: classList.meta.sessionId }));
    }, [classList.meta]); // eslint-disable-line

    // Active column config
    const subCols = viewMode === VIEW_MODES.DETAILED ? SUB_COLS_DETAILED
        : viewMode === VIEW_MODES.COMPACT ? SUB_COLS_COMPACT
        : SUB_COLS_GRADE_ONLY;
    const stickyCols = isMobile ? STICKY_COLS_MOBILE : STICKY_COLS;
    const stickyTotalW = isMobile ? STICKY_TOTAL_W_MOBILE : STICKY_TOTAL_W;
    const summaryCols = [
        { key: '_total', label: 'Total', width: 48 },
        { key: '_avg', label: 'Avg', width: 48 },
        { key: '_pos', label: 'Pos', width: 56 },
    ];
    const tableMinW = stickyTotalW + subjects.reduce((a, s) => a + subCols.reduce((x, c) => x + c.width, 0), 0) + summaryCols.reduce((a, c) => a + c.width, 0);

    // Tolerant label helpers (handle many API shapes)
    const classLabel = (c) => c?.classFullName || c?.fullName || c?.name || c?.className || `${c?.level || ''}${c?.section ? ` ${c.section}` : ''}`;
    const termLabel = (t) => t?.name || t?.term || t?.termName || `Term ${t?.number ?? t?.termNumber ?? '?'}`;
    const sessionLabel = (s) => s?.name || s?.session || s?.sessionName || `${s?.fromYear || s?.from || ''}${(s?.toYear || s?.to) ? `/${s?.toYear || s?.to}` : ''}`;

    // ============ RENDER ============
    return (
        <div className="container-fluid px-1 px-md-3 py-2 py-md-3" style={{ maxWidth: 1600, margin: '0 auto' }}>

            {/* ============ HEADER (LIVE SITE SETTINGS) ============ */}
            <HeroSchoolHeader data={broadsheet.data} />

            {/* ============ TOOLBAR ============ */}
            <div className="no-print rounded-3 p-2 mb-2 mb-md-3" style={{ background: 'white', border: '1px solid #e9ecef', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                <div className="d-flex flex-wrap align-items-center gap-1.5 gap-md-2">

                    <button onClick={() => navigate(-1)} className="btn btn-sm d-flex align-items-center gap-1 rounded-pill" style={{ background: '#f1f3f5', border: '1px solid #dee2e6', color: '#495057', fontSize: '0.65rem', fontWeight: 700 }}>
                        <Icons.ArrowLeft size={12} /> Back
                    </button>

                    {/* Class select — driven by filters.classId (URL-seeded) */}
                    <div className="d-flex align-items-center gap-1">
                        <Icons.School size={13} style={{ color: PAL.green }} />
                        <select
                            className="form-select form-select-sm"
                            style={{ fontSize: '0.65rem', fontWeight: 700, minWidth: 130, borderColor: '#dee2e6' }}
                            value={filters.classId}
                            onChange={(e) => setFilters(f => ({ ...f, classId: e.target.value }))}
                        >
                            <option value="">{classList.loading ? 'Loading classes…' : 'Select Class'}</option>
                            {classList.classes.map(c => (
                                <option key={c._id || c.id || c.classId} value={c._id || c.id || c.classId}>{classLabel(c)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Term select */}
                    <select
                        className="form-select form-select-sm"
                        style={{ fontSize: '0.65rem', fontWeight: 700, minWidth: 100, maxWidth: 130, borderColor: '#dee2e6' }}
                        value={filters.termId}
                        onChange={(e) => setFilters(f => ({ ...f, termId: e.target.value }))}
                    >
                        <option value="">All Terms</option>
                        {terms.map(t => <option key={t._id || t.id} value={t._id || t.id}>{termLabel(t)}</option>)}
                    </select>

                    {/* Session select */}
                    <select
                        className="form-select form-select-sm"
                        style={{ fontSize: '0.65rem', fontWeight: 700, minWidth: 100, maxWidth: 130, borderColor: '#dee2e6' }}
                        value={filters.sessionId}
                        onChange={(e) => setFilters(f => ({ ...f, sessionId: e.target.value }))}
                    >
                        <option value="">All Sessions</option>
                        {sessions.map(s => <option key={s._id || s.id} value={s._id || s.id}>{sessionLabel(s)}</option>)}
                    </select>

                    <div style={{ width: 1, height: 22, background: '#e9ecef' }} className="d-none d-md-block" />

                    {/* View modes */}
                    <div className="btn-group btn-group-sm" role="group">
                        {[
                            [VIEW_MODES.DETAILED, 'Detailed', Icons.Layers],
                            [VIEW_MODES.COMPACT, 'Compact', Icons.FileText],
                            [VIEW_MODES.GRADE_ONLY, 'Grades', Icons.Zap],
                            [VIEW_MODES.CARDS, 'Cards', Icons.Grid],
                        ].map(([mode, label, Ic]) => (
                            <button key={mode} type="button"
                                onClick={() => setViewMode(mode)}
                                className="btn d-flex align-items-center gap-1"
                                style={{
                                    fontSize: '0.6rem', fontWeight: 800,
                                    background: viewMode === mode ? `linear-gradient(135deg, ${PAL.hdrPrimary}, ${PAL.hdrSecondary})` : 'white',
                                    color: viewMode === mode ? PAL.hdrGold : '#6c757d',
                                    border: '1px solid #dee2e6',
                                }}>
                                <Ic size={11} /> <span className="d-none d-md-inline">{label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="position-relative ms-auto" style={{ minWidth: 140 }}>
                        <span className="position-absolute top-50 start-0 translate-middle-y ms-2 text-body-tertiary"><Icons.Search size={12} /></span>
                        <input
                            type="text"
                            className="form-control form-control-sm ps-4"
                            placeholder="Search student…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ fontSize: '0.65rem', borderColor: '#dee2e6' }}
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="btn btn-sm position-absolute top-50 end-0 translate-middle-y p-0 pe-2 border-0 bg-transparent text-body-tertiary">
                                <Icons.X size={11} />
                            </button>
                        )}
                    </div>

                    {/* Toggles */}
                    <button onClick={() => setShowAttendance(v => !v)} title="Toggle attendance column"
                        className="btn btn-sm d-flex align-items-center gap-1 rounded-pill"
                        style={{ fontSize: '0.6rem', fontWeight: 700, background: showAttendance ? PAL.greenGhostMed : '#f8f9fa', color: showAttendance ? PAL.greenDark : '#6c757d', border: `1px solid ${showAttendance ? PAL.greenLight : '#dee2e6'}` }}>
                        <Icons.ClipboardCheck size={12} /> <span className="d-none d-lg-inline">Attendance</span>
                    </button>
                    <button onClick={() => setShowComments(v => !v)} title="Toggle comments column"
                        className="btn btn-sm d-flex align-items-center gap-1 rounded-pill"
                        style={{ fontSize: '0.6rem', fontWeight: 700, background: showComments ? PAL.greenGhostMed : '#f8f9fa', color: showComments ? PAL.greenDark : '#6c757d', border: `1px solid ${showComments ? PAL.greenLight : '#dee2e6'}` }}>
                        <Icons.MessageSquare size={12} /> <span className="d-none d-lg-inline">Comments</span>
                    </button>

                    {/* Refresh */}
                    <button onClick={() => { classList.refetch(); if (filters.classId) broadsheet.refetch(); }} title="Refresh"
                        className="btn btn-sm d-flex align-items-center gap-1 rounded-pill" style={{ fontSize: '0.6rem', fontWeight: 700, background: '#f8f9fa', color: '#6c757d', border: '1px solid #dee2e6' }}>
                        <Icons.Loader size={12} spin={broadsheet.loading || classList.loading} />
                    </button>

                    {/* Print */}
                    <button onClick={() => window.print()} disabled={!broadsheet.data}
                        className="btn btn-sm d-flex align-items-center gap-1 rounded-pill"
                        style={{ fontSize: '0.62rem', fontWeight: 800, background: `linear-gradient(135deg, ${PAL.hdrPrimary}, ${PAL.hdrSecondary})`, color: PAL.hdrGold, border: `1px solid ${PAL.hdrAccent}40`, opacity: broadsheet.data ? 1 : 0.5 }}>
                        <Icons.Printer size={12} /> Print
                    </button>
                </div>
            </div>

            {/* ============ LOADING ============ */}
            {(classList.loading || broadsheet.loading) && (
                <div className="d-flex flex-column align-items-center justify-content-center py-5 gap-2">
                    <Icons.Loader size={30} spin style={{ color: PAL.hdrAccent }} />
                    <span style={{ fontSize: '0.7rem', color: '#868e96', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
                        Loading broadsheet…
                    </span>
                </div>
            )}

            {/* ============ ERROR ============ */}
            {(classList.error || broadsheet.error) && (
                <div className="d-flex flex-column align-items-center justify-content-center py-5 gap-2">
                    <Icons.AlertCircle size={30} style={{ color: '#dc3545' }} />
                    <span className="fw-semibold" style={{ fontSize: '0.8rem', color: '#495057' }}>
                        {classList.error || broadsheet.error}
                    </span>
                    <button onClick={() => { classList.refetch(); if (filters.classId) broadsheet.refetch(); }}
                        className="btn btn-sm rounded-pill px-3" style={{ fontSize: '0.65rem', fontWeight: 700, background: PAL.greenGhostMed, color: PAL.greenDark, border: `1px solid ${PAL.greenLight}` }}>
                        Retry
                    </button>
                </div>
            )}

            {/* ============ NO CLASS SELECTED ============ */}
            {!classList.loading && !broadsheet.loading && !filters.classId && !classList.error && (
                <div className="d-flex flex-column align-items-center justify-content-center py-5 gap-2 text-center">
                    <div className="d-flex align-items-center justify-content-center rounded-circle" style={{ width: 56, height: 56, background: PAL.greenGhostMed, color: PAL.greenDark }}>
                        <Icons.Filter size={22} />
                    </div>
                    <span className="fw-bold" style={{ fontSize: '0.85rem', color: '#495057' }}>Select a class to view the broadsheet</span>
                    <span style={{ fontSize: '0.68rem', color: '#868e96' }}>Choose class, term and session from the toolbar above.</span>
                </div>
            )}

            {/* ============ EMPTY STUDENTS ============ */}
            {filters.classId && !broadsheet.loading && !broadsheet.error && students.length === 0 && (
                <div className="d-flex flex-column align-items-center justify-content-center py-5 gap-2">
                    <Icons.Users size={30} style={{ color: '#adb5bd' }} />
                    <span style={{ fontSize: '0.75rem', color: '#868e96' }}>No student results found for this selection.</span>
                </div>
            )}

            {/* ============ STATS ============ */}
            {students.length > 0 && !broadsheet.loading && (
                <div className="row g-2 mb-2 mb-md-3">
                    <div className="col-6 col-md-3">
                        <StatCard icon={<Icons.Users size={16} />} label="Students" value={stats.total} color="#2563eb" accent="#2563eb" />
                    </div>
                    <div className="col-6 col-md-3">
                        <StatCard icon={<Icons.BookOpen size={16} />} label="Subjects" value={stats.subjects} color={PAL.green} accent={PAL.green} />
                    </div>
                    <div className="col-6 col-md-3">
                        <StatCard icon={<Icons.TrendingUp size={16} />} label="Class Average" value={fmt(stats.classAvg, 1)} sub="by average score" color="#d97706" accent="#d97706" />
                    </div>
                    <div className="col-6 col-md-3">
                        <StatCard
                            icon={<Icons.Crown size={16} />}
                            label="Top Student"
                            value={stats.topStudent ? (stats.topStudent.studentName || '').split(' ')[0] : '—'}
                            sub={stats.topStudent ? `${fmt(stats.topStudent.averageScore, 1)} avg · ${getPositionSuffix(1)}` : null}
                            color="#f59e0b" accent="#f59e0b"
                        />
                    </div>
                </div>
            )}

            {/* ============ TOP PERFORMERS ============ */}
            {students.length > 0 && viewMode !== VIEW_MODES.CARDS && (
                <TopPerformersPanel topBySubject={topBySubject} subjects={subjects} />
            )}

            {/* ============ GRADING KEY ============ */}
            {students.length > 0 && <GradingKeyLegend />}

            {/* ============ DESKTOP TABLE / MOBILE CARDS ============ */}
            {students.length > 0 && !broadsheet.loading && (
                <>
                    {viewMode === VIEW_MODES.CARDS || isMobile ? (
                        /* ---- CARDS VIEW (mobile always uses cards) ---- */
                        <div className={viewMode === VIEW_MODES.CARDS && !isMobile ? 'row g-2' : 'd-flex flex-column gap-2'}>
                            {filteredStudents.map((student, idx) => (
                                <div key={student.studentId} className={viewMode === VIEW_MODES.CARDS && !isMobile ? 'col-md-6 col-xl-4' : 'w-100'}>
                                    <MobileStudentCard
                                        student={student}
                                        subjects={subjects}
                                        index={idx}
                                        showAttendance={showAttendance}
                                        showComments={showComments}
                                        positionByAverage={positionByAverage}
                                    />
                                </div>
                            ))}
                            {filteredStudents.length === 0 && (
                                <div className="text-center py-4" style={{ fontSize: '0.72rem', color: '#868e96' }}>
                                    No students match "{search}"
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ---- TABLE VIEW ---- */
                        <>
                            <VerticalScrollBar scrollRef={scrollRef} />
                            <div
                                ref={scrollRef}
                                className="rounded-3"
                                style={{
                                    overflow: 'auto',
                                    maxHeight: 'calc(100vh - 300px)',
                                    minHeight: 280,
                                    background: 'white',
                                    border: '1px solid #e9ecef',
                                    boxShadow: '0 2px 14px rgba(0,0,0,0.05)',
                                }}
                            >
                                <table className="mb-0" style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: tableMinW, width: '100%' }}>
                                    <thead>
                                        {/* Row 1: sticky idents + subject groups + summary */}
                                        <tr>
                                            <th rowSpan={2} className="text-center fw-bold text-uppercase" style={{ ...stickyCellStyle(stickyCols.sn, 40), top: 0, background: PAL.hdrPrimary, color: '#fff', fontSize: '0.55rem', letterSpacing: '0.08em', padding: '6px 2px', borderBottom: 'none', verticalAlign: 'middle' }}>S/N</th>
                                            {!isMobile && <th rowSpan={2} className="text-center fw-bold text-uppercase" style={{ ...stickyCellStyle(stickyCols.admNo, 40), top: 0, background: PAL.hdrPrimary, color: '#fff', fontSize: '0.55rem', letterSpacing: '0.08em', padding: '6px 2px', verticalAlign: 'middle' }}>Adm No</th>}
                                            <th rowSpan={2} className="fw-bold text-uppercase" style={{ ...stickyCellStyle(stickyCols.name, 40), top: 0, background: PAL.hdrPrimary, color: '#fff', fontSize: '0.55rem', letterSpacing: '0.08em', padding: '6px 6px', verticalAlign: 'middle' }}>Student Name</th>
                                            {!isMobile && <th rowSpan={2} className="text-center fw-bold text-uppercase" style={{ ...stickyCellStyle(stickyCols.gender, 40), top: 0, background: PAL.hdrPrimary, color: '#fff', fontSize: '0.55rem', letterSpacing: '0.08em', padding: '6px 2px', verticalAlign: 'middle' }}>G</th>}

                                            {subjects.map(subject => (
                                                <th key={subject.subjectId} colSpan={subCols.length} className="text-center fw-bold text-uppercase"
                                                    style={{
                                                        position: 'sticky', top: 0, zIndex: 30,
                                                        background: PAL.hdrSecondary, color: '#fff',
                                                        fontSize: '0.56rem', letterSpacing: '0.05em',
                                                        padding: '6px 4px', borderLeft: '1px solid rgba(255,255,255,0.15)',
                                                        maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                        verticalAlign: 'middle',
                                                    }} title={subject.subjectName}>
                                                    {subject.subjectName}
                                                </th>
                                            ))}

                                            {summaryCols.map(c => (
                                                <th key={c.key} rowSpan={2} className="text-center fw-bold text-uppercase"
                                                    style={{ position: 'sticky', top: 0, zIndex: 30, background: PAL.hdrDeep, color: PAL.hdrGold, fontSize: '0.55rem', padding: '6px 2px', borderLeft: '1px solid rgba(255,255,255,0.15)', verticalAlign: 'middle' }}>
                                                    {c.label}
                                                </th>
                                            ))}
                                        </tr>
                                        {/* Row 2: subject sub-columns */}
                                        <tr>
                                            {subjects.map(subject => (
                                                subCols.map(col => (
                                                    <th key={`${subject.subjectId}-${col.key}`} className="text-center fw-bold"
                                                        style={{
                                                            position: 'sticky', top: 30, zIndex: 30,
                                                            background: PAL.hdrPrimary, color: PAL.hdrMuted,
                                                            fontSize: '0.52rem', padding: '4px 1px',
                                                            width: col.width, minWidth: col.width,
                                                            borderTop: '1px solid rgba(255,255,255,0.12)',
                                                            borderLeft: '1px solid rgba(255,255,255,0.08)',
                                                            verticalAlign: 'middle',
                                                        }} title={col.label}>
                                                        {col.label}
                                                    </th>
                                                ))
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStudents.map((student, idx) => {
                                            const rowBg = getStudentRowBg(student, subjects) || (idx % 2 === 1 ? '#fafbfc' : '#ffffff');
                                            const pos = positionByAverage[student.studentId];
                                            const posStyle = pos ? getPositionStyle(pos) : null;
                                            return (
                                                <tr key={student.studentId}>
                                                    <td className="text-center fw-bold" style={{ ...stickyCellStyle(stickyCols.sn), background: rowBg, fontSize: '0.62rem', color: '#6c757d', borderBottom: '1px solid #eef0f2', padding: '4px 2px' }}>{idx + 1}</td>
                                                    {!isMobile && <td className="text-center font-monospace" style={{ ...stickyCellStyle(stickyCols.admNo), background: rowBg, fontSize: '0.58rem', color: '#495057', borderBottom: '1px solid #eef0f2', padding: '4px 2px' }}>{student.admissionNumber}</td>}
                                                    <td className="fw-semibold" style={{ ...stickyCellStyle(stickyCols.name), background: rowBg, fontSize: '0.62rem', color: '#212529', borderBottom: '1px solid #eef0f2', padding: '4px 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={student.studentName}>
                                                        {student.studentName}
                                                    </td>
                                                    {!isMobile && (
                                                        <td className="text-center fw-bold" style={{ ...stickyCellStyle(stickyCols.gender), background: rowBg, fontSize: '0.58rem', color: student.gender === 'Male' ? '#2563eb' : '#db2777', borderBottom: '1px solid #eef0f2', padding: '4px 2px' }}>
                                                            {student.gender === 'Male' ? 'M' : 'F'}
                                                        </td>
                                                    )}

                                                    {subjects.map(subject => (
                                                        subCols.map(col => (
                                                            <td key={`${student.studentId}-${subject.subjectId}-${col.key}`}
                                                                className="text-center"
                                                                style={{
                                                                    background: rowBg, borderBottom: '1px solid #eef0f2',
                                                                    borderLeft: '1px solid #f1f3f5',
                                                                    padding: '2px 1px', width: col.width, minWidth: col.width,
                                                                }}>
                                                                <ScoreCell score={student.scores?.[subject.subjectId]} colKey={col.key} />
                                                            </td>
                                                        ))
                                                    ))}

                                                    {/* Summary */}
                                                    <td className="text-center fw-bold font-monospace" style={{ background: rowBg, borderBottom: '1px solid #eef0f2', borderLeft: '2px solid #eef0f2', fontSize: '0.62rem', color: '#212529', padding: '2px' }}>{fmt(student.totalScore)}</td>
                                                    <td className="text-center fw-bold font-monospace" style={{ background: rowBg, borderBottom: '1px solid #eef0f2', fontSize: '0.62rem', color: PAL.greenDark, padding: '2px' }}>{fmt(student.averageScore, 1)}</td>
                                                    <td className="text-center" style={{ background: rowBg, borderBottom: '1px solid #eef0f2', padding: '2px' }}>
                                                        {posStyle ? (
                                                            <span className="d-inline-block rounded-pill fw-bold" style={{ background: posStyle.bg, color: posStyle.text, border: `1px solid ${posStyle.border}`, fontSize: '0.52rem', padding: '1px 6px' }}>
                                                                {getPositionSuffix(pos)}
                                                            </span>
                                                        ) : <span className="text-body-tertiary" style={{ fontSize: '0.58rem' }}>—</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        {/* Class average per subject */}
                                        <tr>
                                            <td colSpan={isMobile ? 2 : 4} className="fw-bold text-uppercase text-end" style={{ position: 'sticky', left: 0, background: PAL.greenGhostMed, color: PAL.greenDark, fontSize: '0.55rem', letterSpacing: '0.08em', padding: '6px 8px', borderTop: '2px solid #dee2e6' }}>
                                                Class Avg
                                            </td>
                                            {subjects.map(subject => (
                                                subCols.map(col => (
                                                    <td key={`avg-${subject.subjectId}-${col.key}`} className="text-center fw-bold font-monospace"
                                                        style={{ background: PAL.greenGhostMed, borderTop: '2px solid #dee2e6', borderLeft: '1px solid #e3e7ea', fontSize: '0.56rem', color: PAL.greenDark, padding: '4px 1px' }}>
                                                        {col.key === 'totalScore' ? fmt(subjectAverages[subject.subjectId], 1) : '—'}
                                                    </td>
                                                ))
                                            ))}
                                            <td colSpan={summaryCols.length} style={{ background: PAL.greenGhostMed, borderTop: '2px solid #dee2e6' }} />
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <HorizontalScrollBar scrollRef={scrollRef} />
                        </>
                    )}
                </>
            )}

            {/* ============ FOOTER (LIVE site settings) ============ */}
            {students.length > 0 && (
                <div className="text-center mt-2 mt-md-3 pb-2">
                    <p className="mb-0" style={{ fontSize: '0.6rem', color: '#868e96' }}>
                        © {new Date().getFullYear()} <span className="fw-bold" style={{ color: '#6c757d' }}>{SCHOOL_INFO.name}</span>
                        <span className="d-none d-md-inline"> · {SCHOOL_INFO.address}</span>
                        <span className="fst-italic"> · "{SCHOOL_INFO.motto}"</span>
                    </p>
                    <p className="mb-0" style={{ fontSize: '0.52rem', color: '#adb5bd' }}>
                        Generated {new Date().toLocaleString()} · Admin Broadsheet Portal
                    </p>
                </div>
            )}
        </div>
    );
};

export default AdminBroadsheet;