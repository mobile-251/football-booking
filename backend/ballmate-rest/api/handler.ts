import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Express } from 'express';
import { createApp } from '../src/main';

let cachedApp: Express | undefined;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (!cachedApp) {
    const app = await createApp();
    await app.init();
    cachedApp = app.getHttpAdapter().getInstance() as Express;
  }
  const nodeReq = req as unknown as import('http').IncomingMessage;
  const nodeRes = res as unknown as import('http').ServerResponse;

  cachedApp(nodeReq, nodeRes);
}
