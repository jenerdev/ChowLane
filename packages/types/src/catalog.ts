import type { Centavos, ID, ISODateTime, LatLng, PhoneE164 } from "./common";

/** A food business set up by the Owner/Admin. Merchants never log in (D-006). */
export type Merchant = {
  id: ID;
  tenantId: ID;
  name: string;
  /** Cuisine / type, e.g. "Filipino", "Burgers", "Café". */
  category: string;
  phone: PhoneE164;
  address: string;
  location: LatLng;
  photoUrl: string;
  isOpen: boolean;
  status: "ACTIVE" | "INACTIVE";
  createdAt: ISODateTime;
};

export type Product = {
  id: ID;
  tenantId: ID;
  merchantId: ID;
  name: string;
  /** Menu category, e.g. "Rice Meals", "Drinks". */
  category: string;
  description: string;
  /** What the customer pays. */
  price: Centavos;
  /** Expected cost at the store (optional, to track markup). */
  storePrice?: Centavos;
  imageUrl: string;
  isAvailable: boolean;
  sortOrder: number;
};
