-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'HEADMASTER', 'HOD', 'TEACHER', 'STUDENT', 'PARENT');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('CORE', 'ELECTIVE');

-- CreateEnum
CREATE TYPE "GradeRemark" AS ENUM ('EXCELLENT', 'VERY_GOOD', 'GOOD', 'CREDIT', 'PASS', 'WEAK_PASS', 'FAILURE');

-- CreateEnum
CREATE TYPE "TermNumber" AS ENUM ('TERM_1', 'TERM_2', 'TERM_3');

-- CreateEnum
CREATE TYPE "ClassLevel" AS ENUM ('FORM_1', 'FORM_2', 'FORM_3');

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('PROMOTED', 'REPEATED', 'GRADUATED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('REPORT_CARD', 'TRANSCRIPT');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('APP', 'SMS', 'EMAIL');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOCK', 'UNLOCK', 'PROMOTE', 'GRADE_CORRECTION');

-- CreateEnum
CREATE TYPE "InterventionStatus" AS ENUM ('ACTIVE', 'IN_PROGRESS', 'RESOLVED');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "gender" "Gender" NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "phone" TEXT,
    "photoUrl" TEXT,
    "hiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "departmentId" TEXT,

    CONSTRAINT "staff_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "indexNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "gender" "Gender" NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "photoUrl" TEXT,
    "admissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentClassId" TEXT,
    "departmentId" TEXT,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "occupation" TEXT,

    CONSTRAINT "parent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_parent_links" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "student_parent_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "termNumber" "TermNumber" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "SubjectType" NOT NULL,
    "departmentId" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_sections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" "ClassLevel" NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 40,
    "classTeacherId" TEXT,

    CONSTRAINT "class_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teaching_assignments" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classSectionId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,

    CONSTRAINT "teaching_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grading_schemes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "grading_schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_boundaries" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "minScore" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "remark" "GradeRemark" NOT NULL,
    "smartRemarks" TEXT[],

    CONSTRAINT "grade_boundaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_entries" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "classScore" DOUBLE PRECISION,
    "examScore" DOUBLE PRECISION,
    "totalScore" DOUBLE PRECISION,
    "grade" TEXT,
    "remark" TEXT,
    "position" INTEGER,
    "hasObservation" BOOLEAN NOT NULL DEFAULT false,
    "observationText" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockedById" TEXT,
    "lockedAt" TIMESTAMP(3),
    "submittedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grade_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_corrections" (
    "id" TEXT NOT NULL,
    "gradeEntryId" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "fieldChanged" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grade_corrections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "daysPresent" INTEGER NOT NULL DEFAULT 0,
    "daysAbsent" INTEGER NOT NULL DEFAULT 0,
    "totalDays" INTEGER NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_cards" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL DEFAULT 'REPORT_CARD',
    "systemHash" TEXT NOT NULL,
    "qrCodeUrl" TEXT,
    "verificationUrl" TEXT,
    "totalScore" DOUBLE PRECISION,
    "averageScore" DOUBLE PRECISION,
    "classPosition" INTEGER,
    "classSize" INTEGER,
    "conductGrade" TEXT,
    "headmasterRemarks" TEXT,
    "classTeacherRemarks" TEXT,
    "pdfUrl" TEXT,
    "generatedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transcripts" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "indexNumber" TEXT NOT NULL,
    "systemHash" TEXT NOT NULL,
    "qrCodeUrl" TEXT,
    "verificationUrl" TEXT,
    "pdfUrl" TEXT,
    "purpose" TEXT,
    "requestedById" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transcripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "staffId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMsg" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_records" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "fromClass" "ClassLevel" NOT NULL,
    "toClass" "ClassLevel",
    "status" "PromotionStatus" NOT NULL,
    "notes" TEXT,
    "performedById" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentBehavior" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "punctuality" INTEGER,
    "attendance" INTEGER,
    "attitude" INTEGER,
    "conduct" INTEGER,
    "remarks" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentBehavior_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterTrait" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "leadership" INTEGER NOT NULL,
    "discipline" INTEGER NOT NULL,
    "teamwork" INTEGER NOT NULL,
    "ethics" INTEGER NOT NULL,
    "communication" INTEGER NOT NULL,
    "responsibility" INTEGER NOT NULL,
    "termId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CharacterTrait_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterventionAlert" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "previousAverage" DOUBLE PRECISION NOT NULL,
    "currentAverage" DOUBLE PRECISION NOT NULL,
    "dropPercentage" DOUBLE PRECISION NOT NULL,
    "status" "InterventionStatus" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "InterventionAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetable_entries" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timetable_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_settings" (
    "id" TEXT NOT NULL,
    "clashDetectionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "departmentColorsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "school_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "staff_profiles_userId_key" ON "staff_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_profiles_staffId_key" ON "staff_profiles"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_userId_key" ON "student_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_indexNumber_key" ON "student_profiles"("indexNumber");

-- CreateIndex
CREATE UNIQUE INDEX "parent_profiles_userId_key" ON "parent_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "student_parent_links_studentId_parentId_key" ON "student_parent_links"("studentId", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_label_key" ON "academic_years"("label");

-- CreateIndex
CREATE UNIQUE INDEX "terms_academicYearId_termNumber_key" ON "terms"("academicYearId", "termNumber");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");

-- CreateIndex
CREATE UNIQUE INDEX "class_sections_classTeacherId_key" ON "class_sections"("classTeacherId");

-- CreateIndex
CREATE UNIQUE INDEX "class_sections_name_level_key" ON "class_sections"("name", "level");

-- CreateIndex
CREATE UNIQUE INDEX "teaching_assignments_teacherId_subjectId_classSectionId_aca_key" ON "teaching_assignments"("teacherId", "subjectId", "classSectionId", "academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "grading_schemes_name_key" ON "grading_schemes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "grade_entries_studentId_subjectId_termId_key" ON "grade_entries"("studentId", "subjectId", "termId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_studentId_termId_key" ON "attendance_records"("studentId", "termId");

-- CreateIndex
CREATE UNIQUE INDEX "report_cards_systemHash_key" ON "report_cards"("systemHash");

-- CreateIndex
CREATE UNIQUE INDEX "report_cards_studentId_termId_key" ON "report_cards"("studentId", "termId");

-- CreateIndex
CREATE UNIQUE INDEX "transcripts_systemHash_key" ON "transcripts"("systemHash");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "StudentBehavior_studentId_idx" ON "StudentBehavior"("studentId");

-- CreateIndex
CREATE INDEX "CharacterTrait_studentId_idx" ON "CharacterTrait"("studentId");

-- CreateIndex
CREATE INDEX "InterventionAlert_studentId_idx" ON "InterventionAlert"("studentId");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_currentClassId_fkey" FOREIGN KEY ("currentClassId") REFERENCES "class_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_profiles" ADD CONSTRAINT "parent_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_parent_links" ADD CONSTRAINT "student_parent_links_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_parent_links" ADD CONSTRAINT "student_parent_links_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terms" ADD CONSTRAINT "terms_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_sections" ADD CONSTRAINT "class_sections_classTeacherId_fkey" FOREIGN KEY ("classTeacherId") REFERENCES "staff_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_classSectionId_fkey" FOREIGN KEY ("classSectionId") REFERENCES "class_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_boundaries" ADD CONSTRAINT "grade_boundaries_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "grading_schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_entries" ADD CONSTRAINT "grade_entries_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_entries" ADD CONSTRAINT "grade_entries_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_entries" ADD CONSTRAINT "grade_entries_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_corrections" ADD CONSTRAINT "grade_corrections_gradeEntryId_fkey" FOREIGN KEY ("gradeEntryId") REFERENCES "grade_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_records" ADD CONSTRAINT "promotion_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_records" ADD CONSTRAINT "promotion_records_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentBehavior" ADD CONSTRAINT "StudentBehavior_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterTrait" ADD CONSTRAINT "CharacterTrait_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterventionAlert" ADD CONSTRAINT "InterventionAlert_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_classId_fkey" FOREIGN KEY ("classId") REFERENCES "class_sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "staff_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
