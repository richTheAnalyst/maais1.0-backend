import { PrismaClient } from '@prisma/client';

export async function seedBehavior(prisma: PrismaClient, students: any[], termId: string) {
  const behaviors = [];
  const traits = [];

  for (const student of students) {
    // Behavior Record
    const behavior = await prisma.studentBehavior.create({
      data: {
        studentId: student.id,
        punctuality: Math.floor(Math.random() * 5) + 1,
        attendance: Math.floor(Math.random() * 5) + 1,
        attitude: Math.floor(Math.random() * 5) + 1,
        conduct: Math.floor(Math.random() * 5) + 1,
        remarks: 'Very disciplined student.',
      },
    });
    behaviors.push(behavior);

    // Character Trait
    const trait = await prisma.characterTrait.create({
      data: {
        studentId: student.id,
        leadership: Math.floor(Math.random() * 5) + 1,
        discipline: Math.floor(Math.random() * 5) + 1,
        teamwork: Math.floor(Math.random() * 5) + 1,
        ethics: Math.floor(Math.random() * 5) + 1,
        communication: Math.floor(Math.random() * 5) + 1,
        responsibility: Math.floor(Math.random() * 5) + 1,
        termId,
      },
    });
    traits.push(trait);
  }

  console.log(`✅ ${behaviors.length} Behavior Records and ${traits.length} Character Traits seeded`);
  return { behaviors, traits };
}
