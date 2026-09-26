/**
 * Replay: wait for funded balance, then move, verify UI + chain.
 */
import { chromium } from 'playwright';
import { appendFileSync } from 'fs';
import { ethers } from 'ethers';

const URL = 'https://monad-blitz-berlin-web.vercel.app';
const CONTRACT = '0x2EA145184066D56d9f04F1c4A2C6F7FD4B959a5B';
const LOG = '/home/mahendra/monad-blitz-berlin/.cursor/debug-1ad4be.log';
const SESSION = '1ad4be';
const RPC = 'https://testnet-rpc.monad.xyz';

function log(message, data = {}, hypothesisId = 'H1') {
  const entry = { sessionId: SESSION, timestamp: Date.now(), location: 'play-game-v2.mjs', message, data, hypothesisId, runId: 'replay' };
  console.log(JSON.stringify(entry));
  appendFileSync(LOG, JSON.stringify(entry) + '\n');
}

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();

  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  // Intercept move errors by patching console
  const txLogs = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || /fail|revert|insufficient/i.test(msg.text())) {
      txLogs.push({ type: msg.type(), text: msg.text() });
    }
  });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('button[aria-label^="Cell"]');
  await page.waitForTimeout(1500);

  const key = await page.evaluate(() => localStorage.getItem('trailblazers_burner_key'));
  const wallet = new ethers.Wallet(key);
  const provider = new ethers.JsonRpcProvider(RPC);
  log('wallet', { address: wallet.address });

  // Fund via faucet API directly, wait for confirmation
  const faucetResp = await fetch('https://agents.devnads.com/v1/faucet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chainId: 10143, address: wallet.address }),
  });
  const faucetJson = await faucetResp.json();
  log('faucet_api', { status: faucetResp.status, txHash: faucetJson.txHash, amount: faucetJson.amount }, 'H1');

  if (faucetJson.txHash) {
    const rc = await provider.waitForTransaction(faucetJson.txHash, 1, 90000);
    log('faucet_confirmed', { status: rc?.status, block: rc?.blockNumber }, 'H1');
  }

  let bal = await provider.getBalance(wallet.address);
  log('balance_after_faucet', { mon: ethers.formatEther(bal) }, 'H1');

  // Refresh UI balance
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('button[aria-label^="Cell"]');
  await page.waitForTimeout(2000);

  const balText = await page.locator('text=/MON/').first().textContent();
  log('ui_balance', { text: balText }, 'H1');

  // Instrument move by evaluating in page — wrap contract move
  await page.evaluate(() => {
    window.__moveDebug = [];
  });

  const cellId = 73;
  const before = {
    visited: await (async () => {
      const c = new ethers.Contract(CONTRACT, ['function visited(uint256) view returns (bool)', 'function visitCount(uint256) view returns (uint32)', 'function pioneer(uint256) view returns (address)'], provider);
      await new Promise((r) => setTimeout(r, 250));
      return {
        visited: await c.visited(cellId),
        visitCount: Number(await c.visitCount(cellId)),
        pioneer: await c.pioneer(cellId),
      };
    })(),
  };
  log('before', before, 'H2');

  // Click cell and capture network/tx by also sending move via page.evaluate with ethers from CDN? 
  // Better: click UI and poll chain + listen for pending spinner
  const cells = page.locator('button[aria-label^="Cell"]');
  
  // Hook into pending state
  await cells.nth(cellId).click();
  log('clicked', { cellId }, 'H2');

  // Check if pending spinner appears
  let sawPending = false;
  for (let i = 0; i < 5; i++) {
    await page.waitForTimeout(200);
    const disabled = await cells.nth(cellId).isDisabled().catch(() => false);
    if (disabled) { sawPending = true; break; }
  }
  log('pending_state', { sawPending }, 'H3');

  // Wait up to 45s for chain update
  let after = null;
  for (let i = 0; i < 45; i++) {
    await page.waitForTimeout(1000);
    const c = new ethers.Contract(CONTRACT, ['function visited(uint256) view returns (bool)', 'function visitCount(uint256) view returns (uint32)', 'function pioneer(uint256) view returns (address)'], provider);
    try {
      const visited = await c.visited(cellId);
      if (visited) {
        await new Promise((r) => setTimeout(r, 200));
        after = {
          visited,
          visitCount: Number(await c.visitCount(cellId)),
          pioneer: await c.pioneer(cellId),
        };
        break;
      }
    } catch {
      // rate limit
      await page.waitForTimeout(500);
    }
  }
  log('after_chain', after, 'H2');

  const body = await page.locator('body').innerText();
  const uiHasMove = body.includes(`Cell ${cellId}`) && /Pioneer|Follower/.test(body);
  log('after_ui', { uiHasMove, scoreArea: body.match(/Score[\s\S]{0,60}/)?.[0]?.replace(/\n/g, ' ') }, 'H4');

  // If UI click didn't work, try move directly with same burner key to prove contract path
  if (!after?.visited && bal > 0n) {
    log('ui_move_failed_trying_direct', {}, 'H2');
    const signer = wallet.connect(provider);
    const c = new ethers.Contract(CONTRACT, ['function move(uint256)'], signer);
    try {
      const tx = await c.move(cellId, { gasLimit: 300000 });
      const rc = await tx.wait();
      log('direct_move_ok', { hash: tx.hash, status: rc?.status }, 'H2');
    } catch (e) {
      log('direct_move_fail', { err: e.shortMessage || e.message }, 'H2');
    }
  }

  // Simulation toggle (presenter)
  await page.getByRole('button', { name: /^Presenter$/i }).click();
  await page.waitForTimeout(800);
  const simToggle = page.locator('button').filter({ has: page.locator('.rounded-full') }).first();
  // Click the simulate toggle specifically
  const toggles = page.locator('button.relative.h-6.w-11');
  if (await toggles.count()) {
    await toggles.first().click();
    await page.waitForTimeout(3000);
    const simBody = await page.locator('body').innerText();
    const simOk = /Waiting for moves/.test(simBody) === false && /Cell \d+/.test(simBody);
    log('simulation', { simOk, hasEvents: /Cell \d+/.test(simBody) }, 'H5');
  }

  log('page_errors', { pageErrors: pageErrors.slice(0, 8), txLogs: txLogs.slice(0, 8) }, 'H3');

  await page.screenshot({ path: '/home/mahendra/monad-blitz-berlin/.cursor/game-play-v2.png', fullPage: true });
  await browser.close();
}

main().catch((e) => {
  log('fatal', { error: String(e) });
  console.error(e);
  process.exit(1);
});
