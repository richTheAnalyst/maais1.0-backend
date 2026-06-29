import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service'


@Injectable()
export class SettingsService {
    constructor(private prisma: PrismaService) {}

    /**
     * Get school settings,creating the defualt row if it doesnt exist yet.
     */

    async getSettings() {
        let settings = await this.prisma.schoolSettings.findFirst();
        if (!settings) {
            settings = await this.prisma.schoolSettings.create({data: {}})
        }
        return settings;
    }


    async updateSettings(
        updates: { clashDetectionEnabled?: boolean; departmentColorEnabled?: boolean },
        updatedById: string,
    ) {
        const existing = await this.getSettings();
    return this.prisma.schoolSettings.update({
      where: { id: existing.id },
      data: { ...updates, updatedById },
    });
    }
}
