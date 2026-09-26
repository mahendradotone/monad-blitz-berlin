import fs from 'node:fs';
import path from 'node:path';
import { ethers } from 'ethers';

const rpcUrl = process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';
const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
const solcVersion = '0.8.24';

if (!privateKey) {
  throw new Error('DEPLOYER_PRIVATE_KEY is required');
}

const sourcePath = path.resolve('contracts/Trailblazers.sol');
const source = fs.readFileSync(sourcePath, 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'Trailblazers.sol': {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode.object'],
      },
    },
  },
};

const solcModule = await import('solc');
const solc = solcModule.default ?? solcModule;
const output = JSON.parse(solc.compile(JSON.stringify(input), { import: () => ({ language: 'Solidity', contents: '' }) }));

const contractOutput = output.contracts['Trailblazers.sol'].Trailblazers;
if (!contractOutput) {
  throw new Error('Could not compile Trailblazers contract');
}

const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);
const factory = new ethers.ContractFactory(contractOutput.abi, contractOutput.evm.bytecode.object, wallet);
const contract = await factory.deploy();
await contract.waitForDeployment();

const address = await contract.getAddress();
console.log(`Deployed Trailblazers at: ${address}`);
console.log(`Network: ${rpcUrl}`);
console.log(`Set VITE_CONTRACT_ADDRESS=${address} in apps/web/.env`);
