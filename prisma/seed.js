"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const argon2 = require("argon2");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding MAAIS database...\n');
    const adminPassword = await argon2.hash('Admin@2024!');
    const admin = await prisma.user.upsert({
        where: { email: 'admin@mandoshts.edu.gh' },
        update: {},
        create: {
            email: 'admin@mandoshts.edu.gh',
            passwordHash: adminPassword,
            role: client_1.Role.SUPER_ADMIN,
            staffProfile: {
                create: {
                    staffId: 'STA-2024-001',
                    firstName: 'System',
                    lastName: 'Administrator',
                    gender: client_1.Gender.MALE,
                },
            },
        },
    });
    console.log('✅ Super Admin:', admin.email);
    const departments = await Promise.all([
        prisma.department.upsert({ where: { code: 'GEN' }, update: {}, create: { name: 'General Studies', code: 'GEN' } }),
        prisma.department.upsert({ where: { code: 'SCI' }, update: {}, create: { name: 'Science', code: 'SCI' } }),
        prisma.department.upsert({ where: { code: 'BUS' }, update: {}, create: { name: 'Business', code: 'BUS' } }),
        prisma.department.upsert({ where: { code: 'VTG' }, update: {}, create: { name: 'Vocational & Technical', code: 'VTG' } }),
        prisma.department.upsert({ where: { code: 'ART' }, update: {}, create: { name: 'General Arts', code: 'ART' } }),
    ]);
    console.log('✅ Departments:', departments.map((d) => d.code).join(', '));
    const coreSubjects = [
        { name: 'Core Mathematics', code: 'CMATH', type: client_1.SubjectType.CORE, deptCode: 'GEN' },
        { name: 'English Language', code: 'ENGL', type: client_1.SubjectType.CORE, deptCode: 'GEN' },
        { name: 'Integrated Science', code: 'ISCI', type: client_1.SubjectType.CORE, deptCode: 'GEN' },
        { name: 'Social Studies', code: 'SOCI', type: client_1.SubjectType.CORE, deptCode: 'GEN' },
        { name: 'ICT', code: 'ICT', type: client_1.SubjectType.CORE, deptCode: 'VTG' },
    ];
    const electiveSubjects = [
        { name: 'Elective Mathematics', code: 'EMATH', type: client_1.SubjectType.ELECTIVE, deptCode: 'SCI' },
        { name: 'Physics', code: 'PHY', type: client_1.SubjectType.ELECTIVE, deptCode: 'SCI' },
        { name: 'Chemistry', code: 'CHEM', type: client_1.SubjectType.ELECTIVE, deptCode: 'SCI' },
        { name: 'Biology', code: 'BIO', type: client_1.SubjectType.ELECTIVE, deptCode: 'SCI' },
        { name: 'Economics', code: 'ECON', type: client_1.SubjectType.ELECTIVE, deptCode: 'BUS' },
        { name: 'Accounting', code: 'ACCT', type: client_1.SubjectType.ELECTIVE, deptCode: 'BUS' },
        { name: 'Business Management', code: 'BMGMT', type: client_1.SubjectType.ELECTIVE, deptCode: 'BUS' },
        { name: 'Literature in English', code: 'LIT', type: client_1.SubjectType.ELECTIVE, deptCode: 'ART' },
        { name: 'Government', code: 'GOVT', type: client_1.SubjectType.ELECTIVE, deptCode: 'ART' },
    ];
    const deptMap = Object.fromEntries(departments.map((d) => [d.code, d.id]));
    for (const s of [...coreSubjects, ...electiveSubjects]) {
        await prisma.subject.upsert({
            where: { code: s.code },
            update: {},
            create: { name: s.name, code: s.code, type: s.type, departmentId: deptMap[s.deptCode] },
        });
    }
    console.log('✅ Subjects:', coreSubjects.length + electiveSubjects.length, 'created');
    const classSections = [
        { name: '1A', level: client_1.ClassLevel.FORM_1 },
        { name: '1B', level: client_1.ClassLevel.FORM_1 },
        { name: '2A', level: client_1.ClassLevel.FORM_2 },
        { name: '2B', level: client_1.ClassLevel.FORM_2 },
        { name: '3A', level: client_1.ClassLevel.FORM_3 },
        { name: '3B', level: client_1.ClassLevel.FORM_3 },
    ];
    for (const c of classSections) {
        await prisma.classSection.upsert({
            where: { name_level: { name: c.name, level: c.level } },
            update: {},
            create: c,
        });
    }
    console.log('✅ Class Sections:', classSections.map((c) => `${c.level} ${c.name}`).join(', '));
    const year = await prisma.academicYear.upsert({
        where: { label: '2024/2025' },
        update: {},
        create: {
            label: '2024/2025',
            startDate: new Date('2024-09-02'),
            endDate: new Date('2025-07-31'),
            isActive: true,
        },
    });
    const terms = [
        { termNumber: client_1.TermNumber.TERM_1, startDate: new Date('2024-09-02'), endDate: new Date('2024-12-20') },
        { termNumber: client_1.TermNumber.TERM_2, startDate: new Date('2025-01-13'), endDate: new Date('2025-04-11') },
        { termNumber: client_1.TermNumber.TERM_3, startDate: new Date('2025-05-05'), endDate: new Date('2025-07-25') },
    ];
    for (const t of terms) {
        await prisma.term.upsert({
            where: { academicYearId_termNumber: { academicYearId: year.id, termNumber: t.termNumber } },
            update: {},
            create: { academicYearId: year.id, ...t, isActive: t.termNumber === client_1.TermNumber.TERM_1 },
        });
    }
    console.log('✅ Academic Year: 2024/2025 with 3 terms');
    console.log('\n🎉 Seed complete!');
    console.log('   Admin login: admin@mandoshts.edu.gh / Admin@2024!');
}
main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map