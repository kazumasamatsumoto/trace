import { KeyGenerator, MetadataType, Order, PublicAccount, RepositoryFactoryHttp } from 'symbol-sdk';
import { firstValueFrom } from 'rxjs';
import { connectNode } from '@/utils/connectNode';
import { nodeList } from '@/consts/nodeList';
import axios from 'axios';
import { networkType } from '@/consts/blockchainProperty';
import { TargetMetaData } from '@/types/TargetMetaData';

export const searchTarget = async (): Promise<TargetMetaData[] | undefined> => {
  const NODE = await connectNode(nodeList);
  if (NODE === '') return undefined;
  const repo = new RepositoryFactoryHttp(NODE, {
    websocketUrl: NODE.replace('http', 'ws') + '/ws',
    websocketInjected: WebSocket,
  });
  const metaRepo = repo.createMetadataRepository();

  const res = await axios.get('/api/fetch-admin-pubkey');
  const adminPublicKey: string = res.data;
  const addminAddressAccount = PublicAccount.createFromPublicKey(
    adminPublicKey,
    networkType
  ).address;

  const scopedMetadataKey = KeyGenerator.generateUInt64Key('metaData').toHex(); //serialNumberを16進数文字列に変換
  const resultSearch = await firstValueFrom(
    metaRepo.search({
      metadataType: MetadataType.Account,
      scopedMetadataKey: scopedMetadataKey,
      sourceAddress: addminAddressAccount,
      pageNumber: 1,
      pageSize: 100,
      order: Order.Desc,
    })
  );

  const targetMetaDataList: TargetMetaData[] = [];

  for (let index = 0; index < resultSearch.data.length; index++) {
    let targetMetaData = JSON.parse(resultSearch.data[index].metadataEntry.value);
    targetMetaData['targetAddress'] = resultSearch.data[index].metadataEntry.targetAddress.plain();
    targetMetaDataList.push(targetMetaData);
  }

  return targetMetaDataList;
};