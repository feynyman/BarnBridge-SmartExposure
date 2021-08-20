import { ethers } from 'hardhat';
import { Contract, ContractFactory } from 'ethers';

import { NETWORK_ENV } from '../network';

async function main(): Promise<void> {
  const {
    AggregatorV3Proxy, UniswapV2Factory, UniswapV2Router02, WETH, DAI
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
  } = NETWORK_ENV[(await ethers.provider.getNetwork()).name];

  const signer = (await ethers.getSigners())[0];

  // Controller
  const Controller: ContractFactory = await ethers.getContractFactory('Controller');
  // const controller: Contract = await Controller.attach('');
  const controller: Contract = await Controller.deploy();
  await controller.deployed();
  console.log(`Controller:`);
  console.log(`  TxHash:           ${controller.deployTransaction.hash}`);
  console.log(`  Gas Used:         ${(await controller.deployTransaction.wait()).gasUsed.toString()} Gwei`);
  console.log(`  Address:          ${controller.address}`);

  // ETokenFactory
  const ETokenFactory: ContractFactory = await ethers.getContractFactory('ETokenFactory');
  const eTokenFactory: Contract = await ETokenFactory.deploy(controller.address);
  await eTokenFactory.deployed();
  console.log(`ETokenFactory:`);
  console.log(`  TxHash:           ${eTokenFactory.deployTransaction.hash}`);
  console.log(`  Gas Used:         ${(await eTokenFactory.deployTransaction.wait()).gasUsed.toString()} Gwei`);
  console.log(`  Address:          ${eTokenFactory.address}`);

  // EPool
  const EPool: ContractFactory = await ethers.getContractFactory('EPool');
  // const ePool: Contract = await EPool.attach('');
  const ePool: Contract = await EPool.deploy(
    controller.address, eTokenFactory.address, WETH, DAI, AggregatorV3Proxy, true
  );
  console.log(`EPool:`);
  console.log(`  TxHash:           ${ePool.deployTransaction.hash}`);
  console.log(`  Gas Used:         ${(await ePool.deployTransaction.wait()).gasUsed.toString()} Gwei`);
  console.log(`  Address:          ${ePool.address}`);

  // EPoolHelper
  const EPoolHelper: ContractFactory = await ethers.getContractFactory('EPoolHelper');
  // const ePoolHelper: Contract = await EPoolHelper.attach('');
  const ePoolHelper: Contract = await EPoolHelper.deploy();
  console.log(`EPoolHelper:`);
  console.log(`  TxHash:           ${ePoolHelper.deployTransaction.hash}`);
  console.log(`  Gas Used:         ${(await ePoolHelper.deployTransaction.wait()).gasUsed.toString()} Gwei`);
  console.log(`  Address:          ${ePoolHelper.address}`);

  // KeeperSubsidyPool
  const KeeperSubsidyPool: ContractFactory = await ethers.getContractFactory('KeeperSubsidyPool');
  // const keeperSubsidyPool: Contract = await KeeperSubsidyPool.attach('');
  const keeperSubsidyPool: Contract = await KeeperSubsidyPool.deploy(controller.address);
  console.log(`KeeperSubsidyPool:`);
  console.log(`  TxHash:           ${keeperSubsidyPool.deployTransaction.hash}`);
  console.log(`  Gas Used:         ${(await keeperSubsidyPool.deployTransaction.wait()).gasUsed.toString()} Gwei`);
  console.log(`  Address:          ${keeperSubsidyPool.address}`);

  // EPoolPeriphery
  const EPoolPeriphery: ContractFactory = await ethers.getContractFactory('EPoolPeriphery');
  // Uniswap Router on Rinkeby
  // const ePoolPeriphery: Contract = await EPoolPeriphery.attach('');
  const ePoolPeriphery: Contract = await EPoolPeriphery.deploy(controller.address, UniswapV2Factory, UniswapV2Router02);
  await ePoolPeriphery.deployed();
  console.log(`EPoolPeriphery:`);
  console.log(`  TxHash:           ${ePoolPeriphery.deployTransaction.hash}`);
  console.log(`  Gas Used:         ${(await ePoolPeriphery.deployTransaction.wait()).gasUsed.toString()} Gwei`);
  console.log(`  Address:          ${ePoolPeriphery.address}`);

  /* --------------------------------------------------------------------------------------------------------------- */
  /* Set params                                                                                                      */
  /* --------------------------------------------------------------------------------------------------------------- */

  // Initialization
  console.log(`EPoolPeriphery.setEPoolApproval:`);
  const tx_approval = await ePoolPeriphery.connect(signer).setEPoolApproval(ePool.address, true);
  console.log(`  TxHash:           ${tx_approval.hash}`);
  console.log(`  Gas Used:         ${(await tx_approval.wait()).gasUsed.toString()} Gwei`);

  console.log(`EPool.setFeeRate:`);
  const tx_fee = await ePool.connect(signer).setFeeRate('50000000000000000');
  console.log(`  TxHash:           ${tx_fee.hash}`);
  console.log(`  Gas Used:         ${(await tx_fee.wait()).gasUsed.toString()} Gwei`);

  console.log(`EPool.addTranche:`);
  const tx_tranche = await ePool.connect(signer).addTranche(
    '428571428571428540', 'Barnbridge Exposure Token Wrapped-Ether 30% / DAI 70%', 'bb_ET_WETH30/DAI70'
  );
  console.log(`  TxHash:           ${tx_tranche.hash}`);
  console.log(`  Gas Used:         ${(await tx_tranche.wait()).gasUsed.toString()} Gwei`);
  console.log(`  EToken:           ${(await ePool.connect(signer).getTranches())[0].eToken }`);
}

main().then(() => process.exit(0)).catch((error: Error) => { console.error(error); process.exit(1); });
