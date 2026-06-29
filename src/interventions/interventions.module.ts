import { Module } from '@nestjs/common';
import { InterventionController } from './interventions.controller';
import { InterventionsService } from './interventions.service';

@Module({
  controllers: [InterventionController],
  providers: [InterventionsService]
})
export class InterventionsModule {}
