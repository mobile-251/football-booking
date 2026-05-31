import { Decimal } from '@prisma/client/runtime/library';

export const COIN_VND_RATE = 1000;

export function vndToCoin(vnd: number): number {
  return Math.ceil(vnd / COIN_VND_RATE);
}

export function coinToVnd(coin: number): number {
  return Math.round(coin * COIN_VND_RATE);
}

export function decimalToNumber(d: Decimal | number): number {
  if (typeof d === 'number') return d;
  return Number(d.toString());
}

export function toDecimal(n: number): Decimal {
  return new Decimal(n);
}
