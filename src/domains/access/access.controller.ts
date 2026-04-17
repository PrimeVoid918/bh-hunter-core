import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AccessService } from './access.service';

@Controller('access')
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  @Get('tenant/:id')
  getTenantAccess(@Param('id', ParseIntPipe) id: number) {
    return this.accessService.getTenantAccessStatus(id);
  }

  @Get('owner/:id')
  getOwnerAccess(@Param('id', ParseIntPipe) id: number) {
    return this.accessService.getOwnerAccessStatus(id);
  }
}
