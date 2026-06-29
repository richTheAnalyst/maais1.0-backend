import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { createHash } from 'crypto';
import * as QRCode from 'qrcode';
import { DocumentType } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  /**
   * Generate report card for a single student in a term.
   * Creates a unique system hash and QR code for authenticity.
   */
  async generateReportCard(studentId: string, termId: string) {
    const [student, grades, attendance] = await Promise.all([
      this.prisma.studentProfile.findUniqueOrThrow({
        where: { id: studentId },
        include: { currentClass: true, user: true },
      }),
      this.prisma.gradeEntry.findMany({
        where: { studentId, termId },
        include: { subject: true },
        orderBy: { subject: { name: 'asc' } },
      }),
      this.prisma.attendanceRecord.findFirst({
        where: { studentId, termId },
      }),
    ]);

    if (grades.length === 0) {
      throw new NotFoundException('No grades found for this student/term');
    }

    // Compute statistics
    const totalScore = grades.reduce((s, g) => s + (g.totalScore ?? 0), 0);
    const averageScore = totalScore / grades.length;
    const subjectCount = grades.length;

    // Build canonical content string for hashing
    const canonical = JSON.stringify({
      indexNumber: student.indexNumber,
      termId,
      grades: grades.map((g) => ({
        subject: g.subject.code,
        total: g.totalScore,
        grade: g.grade,
      })),
      averageScore,
      generatedAt: new Date().toISOString().split('T')[0],
    });

    const systemHash = createHash('sha256').update(canonical).digest('hex');
    const verificationUrl = `${this.config.get('QR_BASE_URL')}/verify/${systemHash}`;
    const qrCodeUrl = await QRCode.toDataURL(verificationUrl);

    // Upsert report card
    const reportCard = await this.prisma.reportCard.upsert({
      where: { studentId_termId: { studentId, termId } },
      create: {
        studentId,
        termId,
        documentType: DocumentType.REPORT_CARD,
        systemHash,
        qrCodeUrl,
        verificationUrl,
        totalScore,
        averageScore,
        classSize: 0, // Populated in batch
        generatedAt: new Date(),
      },
      update: {
        systemHash,
        qrCodeUrl,
        verificationUrl,
        totalScore,
        averageScore,
        generatedAt: new Date(),
      },
      include: { student: true, term: { include: { academicYear: true } } },
    });

    return {
      reportCard,
      grades,
      attendance,
      student,
      statistics: { totalScore, averageScore, subjectCount },
    };
  }

  /**
   * Batch generate report cards for an entire class in a term.
   * Returns a job summary (students processed, errors).
   */
  async batchGenerateReportCards(classSectionId: string, termId: string) {
    const students = await this.prisma.studentProfile.findMany({
      where: { currentClassId: classSectionId },
      select: { id: true, indexNumber: true, firstName: true, lastName: true },
    });

    const results = await Promise.allSettled(
      students.map((s) => this.generateReportCard(s.id, termId)),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results
      .map((r, i) => ({ result: r, student: students[i] }))
      .filter(({ result }) => result.status === 'rejected')
      .map(({ student, result }) => ({
        studentId: student.id,
        indexNumber: student.indexNumber,
        error: (result as PromiseRejectedResult).reason?.message,
      }));

    // Update class positions
    await this.computeClassPositions(classSectionId, termId);

    return {
      total: students.length,
      succeeded,
      failedCount: failed.length,
      failed,
    };
  }

  /**
   * Compute and update class positions for all students in a class/term
   */
  private async computeClassPositions(classSectionId: string, termId: string) {
    const reportCards = await this.prisma.reportCard.findMany({
      where: {
        termId,
        student: { currentClassId: classSectionId },
      },
      orderBy: { averageScore: 'desc' },
    });

    const classSize = reportCards.length;
    let currentRank = 1;

    for (let i = 0; i < reportCards.length; i++) {
      const rc = reportCards[i];

      // Handle ties: if this student has the same score as the previous one, use same rank
      if (i > 0 && rc.averageScore === reportCards[i - 1].averageScore) {
        // rank remains the same
      } else {
        currentRank = i + 1;
      }

      await this.prisma.reportCard.update({
        where: { id: rc.id },
        data: { classPosition: currentRank, classSize },
      });
    }
  }

  /**
   * Build a full 3-year transcript for a student (alumni or current)
   */
  async buildTranscript(studentIdOrIndex: string) {
    // Allow lookup by index number or ID
    const student = await this.prisma.studentProfile.findFirst({
      where: {
        OR: [{ id: studentIdOrIndex }, { indexNumber: studentIdOrIndex }],
      },
      include: {
        user: true,
        grades: {
          include: {
            subject: true,
            term: { include: { academicYear: true } },
          },
          orderBy: [
            { term: { academicYear: { startDate: 'asc' } } },
            { term: { termNumber: 'asc' } },
          ],
        },
        reportCards: {
          include: { term: { include: { academicYear: true } } },
          orderBy: { term: { academicYear: { startDate: 'asc' } } },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Build canonical transcript content
    const canonical = JSON.stringify({
      indexNumber: student.indexNumber,
      grades: student.grades.map((g) => ({
        subject: g.subject.code,
        term: g.term.termNumber,
        year: g.term.academicYear.label,
        total: g.totalScore,
        grade: g.grade,
      })),
      generatedAt: new Date().toISOString(),
    });

    const systemHash = createHash('sha256').update(canonical).digest('hex');
    const verificationUrl = `${this.config.get('QR_BASE_URL')}/verify/transcript/${systemHash}`;
    const qrCodeUrl = await QRCode.toDataURL(verificationUrl);

    // Save transcript record
    const transcript = await this.prisma.transcript.create({
      data: {
        studentId: student.id,
        indexNumber: student.indexNumber,
        systemHash,
        qrCodeUrl,
        verificationUrl: verificationUrl,
      },
    });

    return {
      transcript,
      student,
      verificationUrl,
    };
  }

  /**
   * Verify a document by its system hash (QR scan endpoint)
   */
  async verifyDocument(hash: string) {
    const [reportCard, transcript] = await Promise.all([
      this.prisma.reportCard.findUnique({
        where: { systemHash: hash },
        include: {
          student: {
            select: { indexNumber: true, firstName: true, lastName: true },
          },
          term: { include: { academicYear: true } },
        },
      }),
      this.prisma.transcript.findUnique({ where: { systemHash: hash } }),
    ]);

    if (reportCard) {
      return {
        valid: true,
        documentType: 'REPORT_CARD',
        student: reportCard.student,
        term: reportCard.term,
        generatedAt: reportCard.generatedAt,
      };
    }

    if (transcript) {
      return {
        valid: true,
        documentType: 'TRANSCRIPT',
        indexNumber: transcript.indexNumber,
        generatedAt: transcript.generatedAt,
      };
    }

    return { valid: false, message: 'Document not found in system' };
  }
}
