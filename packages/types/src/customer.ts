import type { ID, ISODateTime, LatLng, PhoneE164 } from "./common";
import type { CustomerLoyalty } from "./loyalty";

/** Accepted Philippine IDs (BL-3.3a). */
export const ID_TYPES = [
  "PHILSYS",
  "DRIVERS_LICENSE",
  "PASSPORT",
  "UMID",
  "SSS",
  "GSIS",
  "PRC",
  "POSTAL",
  "VOTERS",
  "PHILHEALTH",
  "TIN",
  "SENIOR_CITIZEN",
  "PWD",
  "SCHOOL",
  "OTHER_GOV",
] as const;

export type IdType = (typeof ID_TYPES)[number];

export const ID_TYPE_LABELS: Record<IdType, string> = {
  PHILSYS: "PhilSys National ID (PhilID / ePhilID)",
  DRIVERS_LICENSE: "Driver's License",
  PASSPORT: "Passport",
  UMID: "UMID",
  SSS: "SSS ID",
  GSIS: "GSIS ID",
  PRC: "PRC ID",
  POSTAL: "Postal ID",
  VOTERS: "Voter's ID",
  PHILHEALTH: "PhilHealth ID",
  TIN: "TIN ID",
  SENIOR_CITIZEN: "Senior Citizen ID",
  PWD: "PWD ID",
  SCHOOL: "School ID",
  OTHER_GOV: "Other government-issued ID",
};

export type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

/** One ID submission (first order or re-submission after rejection — D-024, D-025). */
export type Verification = {
  id: ID;
  idType: IdType;
  idFrontUrl: string;
  idBackUrl?: string;
  selfieWithIdUrl: string;
  submittedAt: ISODateTime;
  /** Order the ID was submitted with, if any. */
  orderId?: ID;
  result?: "APPROVED" | "REJECTED";
  reviewedBy?: ID;
  reviewedAt?: ISODateTime;
  rejectReason?: string;
};

export type Address = {
  id: ID;
  label: string;
  line1: string;
  barangay: string;
  cityMunicipality: string;
  province: string;
  barangayFeeId?: ID;
  location: LatLng;
  notes?: string;
};

export type Customer = {
  id: ID;
  tenantId: ID;
  facebookId: string;
  name: string;
  email?: string;
  phone?: PhoneE164;
  avatarUrl: string;
  verificationStatus: VerificationStatus;
  /** Latest submission. */
  verification?: Verification;
  /** All submissions incl. rejected ones. */
  verificationHistory: Verification[];
  locationPermission: "GRANTED" | "DENIED" | "UNKNOWN";
  addresses: Address[];
  loyalty: CustomerLoyalty;
  createdAt: ISODateTime;
};
