import { Controller, Get, Param, Res } from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { Response } from 'express';

@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  // @Get(':type')
  // getPolicy(@Param('type') type: string, @Res() res: Response) {
  //   const html = this.policiesService.getPolicy(type);

  //   res.setHeader('Content-Type', 'text/html');
  //   res.setHeader('Cache-Control', 'no-store');
  //   res.send(html);
  // }

  @Get('refund/:type')
  getRefundPolicy(
    @Param('type') type: 'booking' | 'subscription',
    @Res() res: Response,
  ) {
    const html = this.policiesService.getRefundPolicies(type);

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-store');
    res.send(html);
  }
  @Get('consent/:type')
  getOwnerConsent(
    @Param('type') type: 'tenant' | 'owner',
    @Res() res: Response,
  ) {
    const html = this.policiesService.getUserLegitimacyConsentPolicies(type);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-store');
    res.send(html);
  }

  @Get('terms')
  getTerms(@Res() res: Response) {
    const html = this.policiesService.getTerms();
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-store');
    res.send(html);
  }

  @Get('privacy')
  getPrivacy(@Res() res: Response) {
    const html = this.policiesService.getPrivacy();
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-store');
    res.send(html);
  }
}
