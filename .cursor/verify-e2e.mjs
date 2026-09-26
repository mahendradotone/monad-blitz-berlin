import { chromium } from 'playwright';
import { ethers } from 'ethers';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('apps/web/.env', 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await (await browser.newContext()).newPage();

await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForSelector('button[aria-label^="Cell"]');

const key = await page.evaluate(() => localStorage.getItem('trailblazers_burner_key'));
const wallet = new ethers.Wallet(key);
const provider = new ethers.JsonRpcProvider(env.VITE_RPC_URL);
console.log('wallet', wallet.address);

let funded = false;
for (let a = 0; a < 3 && !funded; a++) {
  try {
    const fr = await fetch('https://agents.devnads.com/v1/faucet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chainId: 10143, address: wallet.address }),
    });
    const fj = await fr.json();
    if (fj.txHash) {
      await provider.waitForTransaction(fj.txHash, 1, 90000);
      funded = true;
    }
  } catch (e) {
    console.log('faucet_retry', a, e.message);
    await new Promise((r) => setTimeout(r, 2000));
  }
}
console.log('balance', ethers.formatEther(await provider.getBalance(wallet.address)));

await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('button[aria-label^="Cell"]');
// Wait for batched initial load (~1.5s + margin)
await page.waitForTimeout(10000);

const cellId = 54;
const c = new ethers.Contract(
  env.VITE_CONTRACT_ADDRESS,
  ['function visited(uint256) view returns (bool)', 'function visitCount(uint256) view returns (uint32)'],
  provider,
);

await page.locator('button[aria-label^="Cell"]').nth(cellId).click();
console.log('clicked', cellId);

let after = null;
let uiOk = false;
for (let i = 0; i < 45; i++) {
  await page.waitForTimeout(1000);
  const body = await page.locator('body').innerText();
  if (/Cell 54/.test(body) && (/Score[\s\S]*?25/.test(body) || /\bPioneer\b/.test(body))) {
    uiOk = true;
  }
  try {
    if (await c.visited(cellId)) {
      after = { visited: true, visitCount: Number(await c.visitCount(cellId)) };
      if (uiOk) break;
    }
  } catch {
    // rate limit
  }
}

const body = await page.locator('body').innerText();
const result = {
  after,
  uiOk,
  scoreSnippet: body.match(/Score[\s\S]{0,50}/)?.[0]?.replace(/\n/g, ' '),
  recent: body.match(/My Recent Moves[\s\S]{0,180}/)?.[0]?.replace(/\n/g, ' | ')?.slice(0, 180),
  onChainOk: !!after?.visited,
};
console.log(JSON.stringify(result, null, 2));
await browser.close();

if (!result.onChainOk || !result.uiOk) {
  process.exit(1);
}
console.log('E2E_OK');
