import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserUnionService } from './userUnion.service';
import { CryptoService } from './utilities/crypto.service';
import { JwtService } from '@nestjs/jwt'; // ** not a custom Service but built in
import { REQUIRED_DOCUMENTS } from './auth.types';
import { Prisma, UserRole, VerificationLevel } from '@prisma/client';
import { IDatabaseService } from 'src/infrastructure/database/database.interface';
import { AccountsPublisher } from '../accounts/accounts.publisher';

@Injectable()
export class AuthService {
  constructor(
    @Inject('IDatabaseService') private readonly database: IDatabaseService,
    private readonly userUnionService: UserUnionService,
    private readonly cryptoService: CryptoService,
    private readonly jtwService: JwtService,
    private readonly accountsPublisher: AccountsPublisher,
  ) {}

  private get prisma() {
    return this.database.getClient();
  }

  async validateUser(username: string, password: string) {
    const result = await this.userUnionService.findUserByUsername(username);

    if (!result) {
      throw new UnauthorizedException('User not found');
    }

    const { user, type } = result;

    const isPasswordValid = await this.cryptoService.comparePassword(
      password,
      user.password,
    );
    // * use cryptoService for comparing hashed and normal password
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    return {
      type,
      user,
    };
  }

  async login(username: string, password: string) {
    const validated = await this.validateUser(username, password);

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    const { password: pswd, ...filter } = validated.user;
    // * filtering area
    // * more filtering to be done
    /*
     *  "id": 1,
     *  "username": "startlord",
     *  "email": "star@lord.com",
     *  "role": "TENANT",
     *  "isActive": true,
     *  "isVerified": false,
     */
    // * current shape of the response are bellow
    /*
     * "id": 1,
     * "username": "startlord",
     * "firstname": "StarUpdated",
     * "lastname": "LordUpdated",
     * "email": "star@lord.com",
     * "role": "TENANT",
     * "isActive": true,
     * "isVerified": false,
     * "createdAt": "2025-06-09T15:56:46.899Z",
     * "updatedAt": "2025-06-23T12:54:27.694Z",
     * "age": 23,
     * "guardian": "Guardians Of the GALAXY",
     * "address": "Egos home",
     * "phone_number": "092313231231"
     */

    const payload = {
      userId: validated.user.id,
      username: validated.user.username,
      role: validated.user.role,
      type: validated.type,
    };

    return {
      access_token: this.jtwService.sign(payload),
      // access_token: this.jtwService.(payload),
      user: filter,
    };
  }

  async getVerificationStatus(userId: number, role: UserRole) {
    const user =
      role === 'TENANT'
        ? await this.prisma.tenant.findUnique({ where: { id: userId } })
        : await this.prisma.owner.findUnique({ where: { id: userId } });

    if (!user) throw new NotFoundException();

    const documents = await this.prisma.verificationDocument.findMany({
      where: {
        isDeleted: false,
        userId,
        userType: role,
      },
    });

    return {
      registrationStatus: user.registrationStatus,
      verificationLevel: user.verificationLevel,
      verificationDocuments: documents,
    };
  }

  async recomputeVerificationLevel(
    userId: number,
    role: UserRole,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx ?? this.prisma;

    const requiredDocs = REQUIRED_DOCUMENTS[role];

    const documents = await prisma.verificationDocument.findMany({
      where: {
        isDeleted: false,
        userId,
        userType: role,
      },
    });

    const hasAllRequiredDocs = requiredDocs.every((type) =>
      documents.some(
        (doc) =>
          doc.verificationType === type &&
          doc.verificationStatus === 'APPROVED',
      ),
    );

    const user =
      role === UserRole.TENANT
        ? await prisma.tenant.findUnique({ where: { id: userId } })
        : await prisma.owner.findUnique({ where: { id: userId } });

    if (!user) throw new NotFoundException('User not found');

    const oldVerificationLevel = user.verificationLevel;

    const profileComplete = this.isProfileComplete(user);

    let verificationLevel: VerificationLevel;

    if (!profileComplete) {
      verificationLevel = VerificationLevel.UNVERIFIED;
    } else if (!hasAllRequiredDocs) {
      verificationLevel = VerificationLevel.PROFILE_ONLY;
    } else {
      verificationLevel = VerificationLevel.FULLY_VERIFIED;
    }

    const registrationStatus = profileComplete ? 'COMPLETED' : 'PENDING';

    // Update only if something actually changed
    if (
      oldVerificationLevel !== verificationLevel ||
      user.registrationStatus !== registrationStatus
    ) {
      if (role === UserRole.TENANT) {
        await prisma.tenant.update({
          where: { id: userId },
          data: { verificationLevel, registrationStatus },
        });
      } else {
        await prisma.owner.update({
          where: { id: userId },
          data: { verificationLevel, registrationStatus },
        });
      }

      if (oldVerificationLevel !== verificationLevel) {
        if (verificationLevel === VerificationLevel.FULLY_VERIFIED) {
          this.accountsPublisher.fullyVerified({
            id: userId,
            resourceType: 'VERIFICATION',
            userRole: role == UserRole.TENANT ? 'TENANT' : 'OWNER',
          });
        }

        // if (verificationLevel === VerificationLevel.UNVERIFIED) {
        //   this.accountsPublisher.setupRequired({
        //     // id: userId,
        //     // userRole: role,
        //     // data: {
        //     //   previousLevel: oldVerificationLevel,
        //     // },
        //   });
        // }
      }
    }

    return verificationLevel;
  }

  private isProfileComplete(user: any): boolean {
    const requiredFields = [
      'firstname',
      'lastname',
      'address',
      'age',
      'phone_number',
    ];

    return requiredFields.every(
      (field) =>
        user[field] !== null &&
        user[field] !== undefined &&
        user[field] !== '' &&
        user[field] !== 0,
    );
  }
}
