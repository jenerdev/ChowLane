import type { Centavos, ID, ISODateTime, LatLng, PhoneE164 } from "./common";
import type { RiderPayRule } from "./tenant";

export type VehicleType = "BICYCLE" | "MOTORCYCLE" | "CAR";

export type Rider = {
  id: ID;
  tenantId: ID;
  name: string;
  phone: PhoneE164;
  email?: string;
  photoUrl: string;
  vehicleType: VehicleType;
  plateNumber?: string;
  /** Overrides the tenant-wide rider pay rule (BL-8.2). */
  payOverride?: RiderPayRule;
  isOnShift: boolean;
  currentShiftId?: ID;
  activeOrderId?: ID;
  lastLocation?: LatLng;
  status: "ACTIVE" | "INACTIVE";
  createdAt: ISODateTime;
};

export type RemitStatus = "OPEN" | "PENDING" | "RECEIVED" | "SHORT" | "OVER";

/** One time-in → time-out period, incl. end-of-shift cash remittance (BL-6, BL-12). */
export type Shift = {
  id: ID;
  tenantId: ID;
  riderId: ID;
  timeIn: ISODateTime;
  timeOut?: ISODateTime;
  timeInLocation?: LatLng;
  timeOutLocation?: LatLng;
  cashCollected: Centavos;
  storePaid: Centavos;
  expectedRemit: Centavos;
  remittedAmount?: Centavos;
  remitStatus: RemitStatus;
  remitReceivedBy?: ID;
  remitReceivedAt?: ISODateTime;
  remitNote?: string;
};
