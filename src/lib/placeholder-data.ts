import type { EvolutionRecord, Report } from '@/lib/types';

export const colors = [
    '#34D399', // emerald-400
    '#60A5FA', // blue-400
    '#F472B6', // pink-400
    '#FBBF24', // amber-400
    '#A78BFA', // violet-400
    '#F97316', // orange-500
];


export const evolutionRecords: EvolutionRecord[] = [
    { id: 'E001', date: '2024-07-20', title: 'Initial Assessment', details: 'Patient presents with lower back pain. ROM limited. Plan to start with light exercises.', author: 'Marco Silva'},
    { id: 'E002', date: '2024-07-10', title: 'Follow-up Session', details: 'Patient reports improvement in mobility. Pain level decreased from 8/10 to 6/10.', author: 'Marco Silva'},
    { id: 'E003', date: '2024-07-01', title: 'Progress Check', details: 'Significant improvement. Patient can now perform daily activities with minimal pain.', author: 'Marco Silva'},
];

export const reports: Report[] = [
    { id: 'R001', title: 'Full Physiotherapy Evaluation', date: '2024-07-20', url: '#' },
    { id: 'R002', title: 'Imaging Results Analysis', date: '2024-07-15', url: '#' },
    { id: 'R003', title: 'Discharge Summary', date: '2024-06-30', url: '#' },
];
