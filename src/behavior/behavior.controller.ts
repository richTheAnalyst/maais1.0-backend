import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BehaviorService } from './behavior.service'


@Controller('students')
export class BehaviorController {
    constructor(private readonly behaviorService: BehaviorService) {}

@Post(':id/behavior')
createBahavior(
    @Param('id')studentId: string,
    @Body() body: any,
){
    return this.behaviorService.createBehavior({
        ...body,
        studentId,
    })
}

@Get(':id/behavior')
getBehavior(
    @Param('id')studentId: string,
) {
    return this.behaviorService.getStudentBehavior(
        studentId,
    )
}

  /* @Get(':id/traits')
  getTraits(
    @Param('id') studentId: string,
  ) {
    return this.behaviorService.getTraits(
      studentId,
    );
  } */
}
