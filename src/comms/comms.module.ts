import { Module } from '@nestjs/common';
import { CommsService } from './comms.service';
import { CommsController } from './comms.controller';

@Module({
  providers: [CommsService],
  controllers: [CommsController],
  exports: [CommsService],
})
export class CommsModule {}
