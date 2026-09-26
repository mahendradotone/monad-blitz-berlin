/**
 * Play Trailblazers on production and report whether it works.
 */
import { chromium } from 'playwright';
import { appendFileSync } from 'fs';
import { ethers } from 'ethers';

const URL = process.env.GAME_URL || 'https://monad-blitz-berlin-web.vercel.app';
const PROD_CONTRACT = '0x2EA145184066D56d9f04F1c4A2C6F7FD4B959a5B';
const LOG = '/home/mahendra/monad-blitz-berlin/.cursor/debug-1ad4be.log';
const SESSION = '1ad4be';

function log(message, data = {}, hypothesisId = 'play') {
  const entry = {
    sessionId: SESSION,
    timestamp: Date.now(),
    location: 'play-game.mjs',
    message,
    data,
    hypothesisId,
  };
  console.log(JSON.stringify(entry));
  appendFileSync(LOG, JSON.stringify(entry) + '\n');
}

async function readOnChain(cellId) {
  const abi = [
    'function visited(uint256) view returns (bool)',
    'function visitCount(uint256) view returns (uint32)',
    'function pioneer(uint256) view returns (address)',
    'function totalPioneerGasSpent() view returns (uint256)',
    'function playerScore(address) view returns (uint256)',
  ];
  const p = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
  const c = new ethers.Contract(PROD_CONTRACT, abi, p);
  await new Promise((r) => setTimeout(r, 300));
  const visited = await c.visited(cellId);
  await new Promise((r) => setTimeout(r, 200));
  const visitCount = Number(await c.visitCount(cellId));
  await new Promise((r) => setTimeout(r, 200));
  const pioneer = await c.pioneer(cellId);
  await new Promise((r) => setTimeout(r, 200));
  const pioneerGas = (await c.totalPioneerGasSpent()).toString();
  return { visited, visitCount, pioneer, pioneerGas };
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const consoleMsgs = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on('console', (msg) => consoleMsgs.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', (err) => pageErrors.push(String(err)));
  page.on('requestfailed', (req) =>
    failedRequests.push({ url: req.url(), error: req.failure()?.errorText }),
  );

  const results = { url: URL };

  try {
    log('navigating', { url: URL }, 'A');
    const resp = await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
    results.loadOk = resp?.ok() ?? false;
    results.title = await page.title();
    log('page_loaded', { status: resp?.status(), title: results.title }, 'A');

    await page.waitForSelector('button[aria-label^="Cell"]', { timeout: 15000 });
    await page.waitForTimeout(2000);

    const statusText = await page.locator('body').innerText();
    results.connectionLive = /Live \(WS\)|HTTP/i.test(statusText);
    results.connectionStatus = statusText.match(/Live \(WS\)|HTTP|Offline|Connecting/i)?.[0] ?? null;
    log('connection_status', { status: results.connectionStatus }, 'B');

    // Grab full wallet address via copy or localStorage
    const burnerKey = await page.evaluate(() => localStorage.getItem('trailblazers_burner_key'));
    const wallet = burnerKey ? new ethers.Wallet(burnerKey) : null;
    results.walletAddress = wallet?.address ?? null;

    const balanceEl = page.locator('text=/\\d+(\\.\\d+)?\\s*MON/').first();
    results.balanceBefore = (await balanceEl.textContent().catch(() => null))?.trim() ?? null;
    log('wallet', { address: results.walletAddress, balance: results.balanceBefore }, 'C');

    const cells = page.locator('button[aria-label^="Cell"]');
    results.cellCount = await cells.count();
    results.boardVisible = results.cellCount === 100;
    log('board', { cellCount: results.cellCount }, 'A');

    // Faucet if needed
    const faucetBtn = page.getByRole('button', { name: /Request Testnet Funds/i });
    await faucetBtn.click();
    await page.waitForTimeout(5000);
    const bodyAfterFaucet = await page.locator('body').innerText();
    results.faucetOk = /Sent .* MON/i.test(bodyAfterFaucet);
    results.faucetError = /Faucet returned|Faucet request failed/i.test(bodyAfterFaucet);
    results.faucetSnippet = bodyAfterFaucet.match(/Sent .*|Faucet .*/)?.[0] ?? null;
    log('faucet', { ok: results.faucetOk, snippet: results.faucetSnippet }, 'C');

    // Wait for balance refresh
    await page.waitForTimeout(4000);
    results.balanceAfterFaucet =
      (await balanceEl.textContent().catch(() => null))?.trim() ?? null;

    // Pick an unvisited cell (prefer high id less likely contested)
    const targetCell = 87;
    const beforeChain = await readOnChain(targetCell);
    log('before_move_chain', beforeChain, 'D');

    await cells.nth(targetCell).click();
    log('clicked_cell', { cellId: targetCell }, 'D');

    // Wait for pending then completion (tx can take a bit on testnet)
    let moveUiUpdated = false;
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(1000);
      const t = await page.locator('body').innerText();
      if (/My Recent Moves[\s\S]*Cell 87|Cell 87[\s\S]*Pioneer|Cell 87[\s\S]*Follower/i.test(t)) {
        moveUiUpdated = true;
        break;
      }
      // also check score > 0
      if (/Score\s*\n?\s*(25|10|35)/.test(t) || t.includes('Pioneer')) {
        // weak signal
      }
    }
    results.moveUiUpdated = moveUiUpdated;
    const afterBody = await page.locator('body').innerText();
    results.scoreSnippet = afterBody.match(/Score[\s\S]{0,40}/)?.[0]?.replace(/\n/g, ' ') ?? null;
    results.recentMovesSnippet =
      afterBody.match(/My Recent Moves[\s\S]{0,300}/)?.[0]?.replace(/\n/g, ' | ') ?? null;
    log('after_move_ui', {
      moveUiUpdated,
      scoreSnippet: results.scoreSnippet,
      recent: results.recentMovesSnippet,
    }, 'D');

    await page.waitForTimeout(2000);
    const afterChain = await readOnChain(targetCell);
    results.afterChain = afterChain;
    results.onChainMoveOk =
      afterChain.visited === true &&
      (beforeChain.visitCount < afterChain.visitCount ||
        (!beforeChain.visited && afterChain.visited));
    results.pioneerMatchesWallet =
      wallet && afterChain.pioneer
        ? afterChain.pioneer.toLowerCase() === wallet.address.toLowerCase() ||
          afterChain.visitCount > 1
        : null;
    log('after_move_chain', { ...afterChain, onChainMoveOk: results.onChainMoveOk }, 'D');

    // Presenter + simulation
    await page.getByRole('button', { name: /^Presenter$/i }).click();
    await page.waitForTimeout(1000);
    const presenterText = await page.locator('body').innerText();
    results.presenterOk = /Win condition|Pioneer Gas|Storage Cost Ratio/i.test(presenterText);
    log('presenter', { ok: results.presenterOk }, 'A');

    const simBtn = page.getByRole('button', { name: /Simulate Live Game|Stop Simulation|Simulate/i });
    if (await simBtn.count()) {
      const label = await simBtn.first().textContent();
      if (/Simulate/i.test(label || '')) {
        await simBtn.first().click();
        await page.waitForTimeout(3000);
      }
      const simText = await page.locator('body').innerText();
      results.simulationOk = /Cell \d+/i.test(simText) && /Pioneer|Follower/i.test(simText);
      log('simulation', { ok: results.simulationOk }, 'F');
    }

    // Contract address field shows prod contract
    const inputs = page.locator('input');
    for (let i = 0; i < (await inputs.count()); i++) {
      const v = await inputs.nth(i).inputValue().catch(() => '');
      if (v.toLowerCase().startsWith('0x')) {
        results.uiContractAddress = v;
        break;
      }
    }

    results.pageErrors = pageErrors.slice(0, 10);
    results.consoleErrors = consoleMsgs.filter((m) => m.type === 'error').slice(0, 10);
    results.failedRequests = failedRequests.slice(0, 10);

    await page.screenshot({
      path: '/home/mahendra/monad-blitz-berlin/.cursor/game-play-screenshot.png',
      fullPage: true,
    });

    log('final_results', results, 'play');
    console.log('\n=== SUMMARY ===\n' + JSON.stringify(results, null, 2));
  } catch (err) {
    log('fatal', { error: String(err), stack: err?.stack }, 'play');
    throw err;
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
