import { PrismaClient, Role, Gender } from '@prisma/client';
import * as argon2 from 'argon2';

export async function seedStudents(prisma: PrismaClient, classes: any[], departments: any[]) {
  const passwordHash = await argon2.hash('Student@2024');
  const students = [];

  const firstNames = ['Kwesi', 'Abena', 'Kojo', 'Ekua', 'Kwabena', 'Adwoa', 'Kwaku', 'Akua', 'Yaw', 'Yaaba', 'Kofi', 'Afia', 'Kwame', 'Ama', 'Samuel', 'Esther', 'Daniel', 'Mary', 'Isaac', 'Rebecca', 'Joseph', 'Ruth', 'Peter', 'Martha', 'Paul', 'Sarah', 'James', 'Elizabeth', 'John', 'Hannah'];
  const lastNames = ['Mensah', 'Annan', 'Osei', 'Appiah', 'Owusu', 'Tetteh', 'Asare', 'Dapaah', 'Boakye', 'Adu', 'Boateng', 'Oppong', 'Agyemang', 'Kyeremeh', 'Donkor', 'Arthur', 'Addai', 'Fordjour', 'Gyamfi', 'Bonsu', 'Ofori', 'Sarpong', 'Baah', 'Amponsah', 'Acheampong', 'Duah', 'Darko', 'Frimpong', 'Sarfo', 'Twum'];

  for (let i = 0; i < 30; i++) {
    const firstName = firstNames[i];
    const lastName = lastNames[i];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@student.mandoshts.edu.gh`;
    const cls = classes[i % classes.length];
    const dept = departments[i % departments.length];

    const student = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash,
        role: Role.STUDENT,
        studentProfile: {
          create: {
            indexNumber: `MSHTS/2024/${(i + 1).toString().padStart(3, '0')}`,
            firstName,
            lastName,
            gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
            currentClassId: cls.id,
            departmentId: dept.id,
          },
        },
      },
      include: { studentProfile: true },
    });
    students.push(student.studentProfile);
  }

  console.log(`✅ ${students.length} Students seeded`);
  return students;
}
