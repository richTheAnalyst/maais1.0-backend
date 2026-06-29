import { Controller, Get, Param } from '@nestjs/common';
import { InterventionsService } from './interventions.service'

@Controller('students')
export class InterventionController {
  constructor(private readonly interventionService: InterventionsService) {}

  @Get(':id/interventions')
  getInterventions(@Param('id') studentId: string) {
    return this.interventionService.getStudentInterventions(studentId);
  }
}
