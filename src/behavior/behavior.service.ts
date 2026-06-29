import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class BehaviorService {
    constructor(private prisma: PrismaService) {}

    async createBehavior(data:any) {
        return this.prisma.studentBehavior.create({
            data,
        });
    }

    async createTrait(data:any) {
        return this.prisma.characterTrait.create({
            data,
        });
    }

    async getStudentBehavior(studentId: string) {
        
         const logs = this.prisma.studentBehavior.findMany({
            where: {studentId},
            orderBy: {
                createdAt: 'desc'
            }
        })
        const traits =
        await this.prisma.characterTrait.findFirst({
            where:{
                studentId,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return {
            logs,
            traits,
        };
    }

    /* async getTraits(studentId: string) {
        return this.prisma.characterTrait.findMany({
            where: { studentId},
        })
    } */

}
