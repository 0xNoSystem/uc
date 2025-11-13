export type Product = {
  id: string;
  name: string;
  price: string;
  newPrice?: string;
  href?: string;
  primaryImage: string;
  secondaryImage: string;
  badge?: string;
  colors?: string[];
};
