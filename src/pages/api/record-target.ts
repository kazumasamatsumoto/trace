import type { NextApiRequest, NextApiResponse } from 'next';
import {
  Account,
  Address,
  AggregateTransaction,
  Deadline,
  EmptyMessage,
  PlainMessage,
  PublicAccount,
  TransferTransaction,
} from 'symbol-sdk';
import { epochAdjustment, generationHash, networkType } from '@/consts/blockchainProperty';
import { PayloadForOfflineSignature } from '@/types/PayloadForOfflineSignature';

export default function handler(req: NextApiRequest, res: NextApiResponse): void {
  if (req.method === 'POST') {
    const admin = Account.createFromPrivateKey(process.env.PRIVATE_KEY!, networkType);
    const clinetPublicAccount = PublicAccount.createFromPublicKey(
      req.body.clinetPublicKey,
      networkType
    );
    const targetAddressAccount = Address.createFromRawAddress(req.body.targetAddress);
    const operation: string = req.body.operation;
    const latitude: string = req.body.latitude;
    const longitude: string = req.body.longitude;

    const operationTx = TransferTransaction.create(
      Deadline.create(epochAdjustment),
      targetAddressAccount,
      [],
      PlainMessage.create(operation),
      networkType
    );

    const latitudeTx = TransferTransaction.create(
      Deadline.create(epochAdjustment),
      targetAddressAccount,
      [],
      PlainMessage.create(latitude),
      networkType
    );

    const longitudeTx = TransferTransaction.create(
      Deadline.create(epochAdjustment),
      targetAddressAccount,
      [],
      PlainMessage.create(longitude),
      networkType
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
      [
        operationTx.toAggregate(clinetPublicAccount),
        latitudeTx.toAggregate(clinetPublicAccount),
        longitudeTx.toAggregate(clinetPublicAccount),
        dummyTx.toAggregate(admin.publicAccount),
      ],
      networkType,
      []
    ).setMaxFeeForAggregate(100, 1);

    const adminSignedTx = admin.sign(aggregateTx, generationHash);

    const signedHash = adminSignedTx.hash;
    const signedPayload = adminSignedTx.payload;

    const payloadForOfflineSignature: PayloadForOfflineSignature = {
      signedHash,
      signedPayload,
    };

    res.status(200).json({
      payloadForOfflineSignature,
    });
  }
}