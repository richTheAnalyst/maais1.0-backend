import { PrismaClient, Role, Gender } from '@prisma/client';
import * as argon2 from 'argon2';

export async function seedStaff(prisma: PrismaClient, departments: any[], classes: any[]) {
  const teachersData = [
    { firstName: 'Kofi', lastName: 'Annan', email: 'k.annan@mandoshts.edu.gh', gender: Gender.MALE, deptCode: 'GEN' },
    { firstName: 'Ama', lastName: 'Konadu', email: 'a.konadu@mandoshts.edu.gh', gender: Gender.FEMALE, deptCode: 'SCI' },
    { firstName: 'Kwame', lastName: 'Nkrumah', email: 'k.nkrumah@mandoshts.edu.gh', gender: Gender.MALE, deptCode: 'BUS' },
    { firstName: 'Efua', lastName: 'Sutherland', email: 'e.sutherland@mandoshts.edu.gh', gender: Gender.FEMALE, deptCode: 'ART' },
    { firstName: 'John', lastName: 'Agyekum', email: 'j.agyekum@mandoshts.edu.gh', gender: Gender.MALE, deptCode: 'VTG' },
    { firstName: 'Theodosia', lastName: 'Okoh', email: 't.okoh@mandoshts.edu.gh', gender: Gender.FEMALE, deptCode: 'GEN' },
    { firstName: 'Jerry', lastName: 'Rawlings', email: 'j.rawlings@mandoshts.edu.gh', gender: Gender.MALE, deptCode: 'SCI' },
    { firstName: 'Yaa', lastName: 'Asantewaa', email: 'y.asantewaa@mandoshts.edu.gh', gender: Gender.FEMALE, deptCode: 'BUS' },
  ];

  const passwordHash = await argon2.hash('Teacher@2024');
  const teachers = [];

  for (let i = 0; i < teachersData.length; i++) {
    const data = teachersData[i];
    const dept = departments.find(d => d.code === data.deptCode);
    
    const teacher = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        email: data.email,
        passwordHash,
        role: Role.TEACHER,
        staffProfile: {
          create: {
            staffId: `TCH-2024-00${i + 1}`,
            firstName: data.firstName,
            lastName: data.lastName,
            gender: data.gender,
            departmentId: dept?.id,
          },
        },
      },
      include: { staffProfile: true },
    });
    teachers.push(teacher.staffProfile);
  }

  // Assign some as class teachers
  for (let i = 0; i < classes.length; i++) {
    if (teachers[i]) {
      await prisma.classSection.update({
        where: { id: classes[i].id },
        data: { classTeacherId: teachers[i].id },
      });
    }
  }

  console.log(`✅ ${teachers.length} Teachers seeded and assigned to classes`);
  return teachers;
}
