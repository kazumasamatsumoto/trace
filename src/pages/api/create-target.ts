import type { NextApiRequest, NextApiResponse } from 'next';
import {
  Account,
  AggregateTransaction,
  CosignatureTransaction,
  Deadline,
  EmptyMessage,
  KeyGenerator,
  MetadataTransactionService,
  RepositoryFactoryHttp,
  TransactionMapping,
  TransactionStatus,
  TransferTransaction,
  UInt64,
} from 'symbol-sdk';
import { firstValueFrom } from 'rxjs';
import { connectNode } from '@/utils/connectNode';
import { nodeList } from '@/consts/nodeList';
import { epochAdjustment, generationHash, networkType } from '@/consts/blockchainProperty';
import { TransactionStatusWithAddress } from '@/types/TransactionStatusWithAddress';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<TransactionStatusWithAddress | undefined> {
  if (req.method === 'POST') {
    const NODE = await connectNode(nodeList);
    if (NODE === '') return undefined;
    const repo = new RepositoryFactoryHttp(NODE, {
      websocketUrl: NODE.replace('http', 'ws') + '/ws',
      websocketInjected: WebSocket,
    });
    const txRepo = repo.createTransactionRepository();
    const tsRepo = repo.createTransactionStatusRepository();
    const metaRepo = repo.createMetadataRepository();
    const metaService = new MetadataTransactionService(metaRepo);
    const listener = repo.createListener();

    const admin = Account.createFromPrivateKey(process.env.PRIVATE_KEY!, networkType);
    const targetAccount = Account.generateNewAccount(networkType);

    const key = KeyGenerator.generateUInt64Key('metaData');
    const value = JSON.stringify(req.body.metaData);
    const metadataTx = await firstValueFrom(
      metaService.createAccountMetadataTransaction(
        Deadline.create(epochAdjustment),
        networkType,
        targetAccount.address, //メタデータ記録先アドレス
        key,
        value, //Key-Value値
        admin.address, //メタデータ作成者アドレス
        UInt64.fromUint(0)
      )
    );

    const dummyTx = TransferTransaction.create(
      Deadline.create(epochAdjustment),
      admin.address,
      [],
      EmptyMessage,
      networkType
    );

    const aggregateTx = AggregateTransaction.createComplete(
      Deadline.create(epochAdjustment),
      [metadataTx.toAggregate(admin.publicAccount), dummyTx.toAggregate(admin.publicAccount)],
      networkType,
      []
    ).setMaxFeeForAggregate(100, 1);

    const adminSignedTx = admin.sign(aggregateTx, generationHash);

    const cosignedTransactionTarget = CosignatureTransaction.signTransactionPayload(
      targetAccount,
      adminSignedTx.payload,
      generationHash
    );

    const rectreatedAggregateTransactionFromPayload = TransactionMapping.createFromPayload(
      adminSignedTx.payload
    ) as AggregateTransaction;

    const signedTx = admin.signTransactionGivenSignatures(
      rectreatedAggregateTransactionFromPayload,
      [cosignedTransactionTarget],
      generationHash
    );

    await firstValueFrom(txRepo.announce(signedTx));
    await listener.open();
    //未承認トランザクションの検知
    listener
      .unconfirmedAdded(targetAccount.address, signedTx.hash)
      .subscribe(async (unconfirmedTx) => {
        const response: TransactionStatus = await firstValueFrom(
          tsRepo.getTransactionStatus(signedTx.hash)
        );
        listener.close();
        clearTimeout(timerId);
        console.log(response);
        res.status(200).json({
          transactionsStatus: response,
          address: targetAccount.address.plain(),
        });
      });
    //未承認トランザクションの検知ができなかった時の処理
    const timerId = setTimeout(async function () {
      const response: TransactionStatus = await firstValueFrom(
        tsRepo.getTransactionStatus(signedTx.hash)
      );
      //監視前に未承認TXがノードに認識されてしまった場合
      if (response.code === 'Success') {
        listener.close();
        res.status(200).json({
          transactionsStatus: response,
          address: targetAccount.address.plain(),
        });
      }
      //トランザクションでエラーが発生した場合の処理
      else {
        listener.close();
        console.log(response);
        res.status(400).json({
          transactionsStatus: response,
          address: targetAccount.address.plain(),
        });
      }
    }, 1000); //タイマーを1秒に設定
  }
}