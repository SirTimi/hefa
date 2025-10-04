import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';

type UserCtx = { userId: string; role: Role };
type OrderShape = {
  id: string;
  createdByUserId: string | null;
  createdByMerchant?: { userId: string } | null;
};

@Injectable()
export class PoliciesService {
  isAdmin(u: UserCtx) {
    return u.role === 'ADMIN';
  }

  canReadOrder(u: UserCtx, o: OrderShape) {
    if (this.isAdmin(u)) return true;
    if (o.createdByUserId && o.createdByUserId === u.userId) return true;
    if (o.createdByMerchant?.userId && o.createdByMerchant.userId === u.userId)
      return true;
    return false;
  }

  canRelease(u: UserCtx, o: OrderShape) {
    // safest default until PoD/dispatch is wired: ADMIN-only
    return this.isAdmin(u);
  }
}
