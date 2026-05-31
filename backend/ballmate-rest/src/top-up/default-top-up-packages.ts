/** Gói nạp mặc định: 1 coin = 1.000 VND, bonus % trên baseCoin. */
export const DEFAULT_TOP_UP_PACKAGES = [
  {
    name: '200K',
    priceVnd: 200_000,
    baseCoin: 200,
    bonusCoin: 0,
    sortOrder: 1,
  },
  {
    name: '500K (+10%)',
    priceVnd: 500_000,
    baseCoin: 500,
    bonusCoin: 50,
    sortOrder: 2,
  },
  {
    name: '1M (+15%)',
    priceVnd: 1_000_000,
    baseCoin: 1000,
    bonusCoin: 150,
    sortOrder: 3,
  },
  {
    name: '2M (+20%)',
    priceVnd: 2_000_000,
    baseCoin: 2000,
    bonusCoin: 400,
    sortOrder: 4,
  },
] as const;
