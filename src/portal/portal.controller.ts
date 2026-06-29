import { Controller, Param, Get } from '@nestjs/common';
import { PortalService } from './portal.service'

@Controller('portal')
export class PortalController {

    constructor(private readonly portalService: PortalService,) {}

    @Get('students/:id/portal-data')
    getPortalData(
        @Param('id') studentId: string,
    ) {
        return this.portalService.getPortalData(
            studentId,
        )
    }
}
