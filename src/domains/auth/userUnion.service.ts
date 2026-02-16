import { AdminsService } from 'src/domains/admins/admins.service';
import { TenantsService } from '../tenants/tenants.service';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { OwnersService } from 'src/domains/owners/owners.service';

@Injectable()
export class UserUnionService {
  constructor(
    private readonly adminService: AdminsService,
    @Inject(forwardRef(() => OwnersService)) // <--- ADD THIS
    private readonly ownerService: OwnersService,
    @Inject(forwardRef(() => TenantsService)) // <--- ADD THIS
    private readonly tenantService: TenantsService,
  ) {}

  async findUserByUsername(username: string) {
    const admin = await this.adminService.findUserByUsername(username);
    if (admin) return { type: 'admin', user: admin };

    const owner = await this.ownerService.findUserByUsername(username);
    if (owner) return { type: 'owner', user: owner };

    const tenant = await this.tenantService.findByUsername(username);
    if (tenant) return { type: 'tenant', user: tenant };

    return null;
  }

  async findUserByUserId(id: number) {
    const admin = await this.adminService.findUserById(id);
    if (admin) return { type: 'admin', user: admin };

    const owner = await this.ownerService.findUserById(id);
    if (owner) return { type: 'owner', user: owner };

    const tenant = await this.tenantService.findUserById(id);
    if (tenant) return { type: 'tenant', user: tenant };

    return null;
  }
}
