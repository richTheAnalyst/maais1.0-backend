import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ReportsService } from './reports.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { GenerateReportCardDto, BatchGenerateDto, BuildTranscriptDto } from './dto/reports.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post('report-cards/generate')
  @Roles(Role.HEADMASTER, Role.SUPER_ADMIN, Role.HOD, Role.STUDENT)
  @ApiOperation({ summary: 'Generate report card for a single student' })
  generateOne(@Body() dto: GenerateReportCardDto) {
    return this.reportsService.generateReportCard(dto.studentId, dto.termId);
  }

  @Post('report-cards/batch')
  @Roles(Role.HEADMASTER, Role.SUPER_ADMIN, Role.STUDENT)
  @ApiOperation({ summary: 'Batch generate report cards for entire class' })
  batchGenerate(@Body() dto: BatchGenerateDto) {
    return this.reportsService.batchGenerateReportCards(dto.classSectionId, dto.termId);
  }

  @Post('transcripts/generate')
  @Roles(Role.HEADMASTER, Role.SUPER_ADMIN, Role.STUDENT)
  @ApiOperation({ summary: 'Build 3-year transcript' })
  buildTranscript(@Body() dto: BuildTranscriptDto) {
    return this.reportsService.buildTranscript(dto.studentIdOrIndex);
  }

  @Public()
  @Get('verify/:hash')
  @ApiOperation({ summary: 'Verify document by QR hash (public)' })
  verify(@Param('hash') hash: string) {
    return this.reportsService.verifyDocument(hash);
  }
}