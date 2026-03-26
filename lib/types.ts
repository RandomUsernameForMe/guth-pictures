export type PricingPackage = {
  id?: string; // React key, optional for backward compat with existing KV data
  name: string;
  price: string;
  duration: string;
  includes: string[];
};
