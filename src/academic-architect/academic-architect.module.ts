import { Module } from '@nestjs/common';
import { AcademicArchitectService } from './academic-architect.service';
import { AcademicArchitectController } from './academic-architect.controller';

@Module({
  providers: [AcademicArchitectService],
  controllers: [AcademicArchitectController],
  exports: [AcademicArchitectService],
})
export class AcademicArchitectModule {}
