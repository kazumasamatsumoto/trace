import {
  Account,
  CosignatureTransaction,
  RepositoryFactoryHttp,
  SignedTransaction,
  TransactionMapping,
  TransactionStatus,
} from 'symbol-sdk';
import { firstValueFrom } from 'rxjs';
import { connectNode } from '@/utils/connectNode';
import { nodeList } from '@/consts/nodeList';
import axios from 'axios';
import { generationHash, networkType } from '@/consts/blockchainProperty';
import { PayloadForOfflineSignature } from '@/types/PayloadForOfflineSignature';

export const offlineSignature = async (
  clientPrivateKey: string,
  payloadForOfflineSignature: PayloadForOfflineSignature
): Promise<TransactionStatus | undefined> => {
  const NODE = await connectNode(nodeList);
  if (NODE === '') return undefined;
  const repo = new RepositoryFactoryHttp(NODE, {
    websocketUrl: NODE.replace('http', 'ws') + '/ws',
    websocketInjected: WebSocket,
  });
  const txRepo = repo.createTransactionRepository();
  const tsRepo = repo.createTransactionStatusRepository();
  const listener = repo.createListener();
  const client = Account.createFromPrivateKey(clientPrivateKey, networkType);

  const res = await axios.get('/api/fetch-admin-pubkey');
  const adminPublicKey: string = res.data;

  const clientSignedTx = CosignatureTransaction.signTransactionPayload(
    client,
    payloadForOfflineSignature.signedPayload,
    generationHash
  );
  let signedPayload =
    payloadForOfflineSignature.signedPayload +
    clientSignedTx.version.toHex() +
    clientSignedTx.signerPublicKey +
    clientSignedTx.signature;

  const recreatedTx = TransactionMapping.createFromPayload(
    payloadForOfflineSignature.signedPayload
  );

  const size = `00000000${(signedPayload.length / 2).toString(16)}`;
  const formatedSize = size.substr(size.length - 8, size.length);
  const littleEndianSize =
    formatedSize.substr(6, 2) +
    formatedSize.substr(4, 2) +
    formatedSize.substr(2, 2) +
    formatedSize.substr(0, 2);
  signedPayload = littleEndianSize + signedPayload.substr(8, signedPayload.length - 8);
  const signedTx = new SignedTransaction(
    signedPayload,
    payloadForOfflineSignature.signedHash,
    adminPublicKey,
    recreatedTx.type,
    recreatedTx.networkType
  );

  await firstValueFrom(txRepo.announce(signedTx));
  await listener.open();
  const transactionStatus: TransactionStatus = await new Promise((resolve) => {
    //未承認トランザクションの検知
    listener.unconfirmedAdded(client.address, signedTx.hash).subscribe(async (unconfirmedTx) => {
      const response = await firstValueFrom(tsRepo.getTransactionStatus(signedTx.hash));
      listener.close();
      resolve(response);
    });
    //トランザクションでエラーが発生した場合の処理
    setTimeout(async function () {
      const response = await firstValueFrom(tsRepo.getTransactionStatus(signedTx.hash));
      if (response.code !== 'Success') {
        listener.close();
        resolve(response);
      }
    }, 1000); //タイマーを1秒に設定
  });
  return transactionStatus;
};