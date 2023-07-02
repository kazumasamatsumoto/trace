import React, { useState } from 'react';
import LeftDrawer from '@/components/LeftDrawer';
import Header from '@/components/Header';
import AlertsSnackbar from '@/components/AlertsSnackbar';
import AlertsDialog from '@/components/AlertsDialog';
import {
  Box,
  Typography,
  Button,
  Backdrop,
  CircularProgress,
  FormControl,
  TextField,
  Stack,
} from '@mui/material';
import axios from 'axios';
import { useQRCode } from 'next-qrcode';

import { Controller, SubmitHandler, useForm } from 'react-hook-form';

import { TargetMetaDataInputs } from '@/types/TargetMetaDataInputs';
import { TransactionStatusWithAddress } from '@/types/TransactionStatusWithAddress';

function Issue(): JSX.Element {
  //共通設定
  const [progress, setProgress] = useState<boolean>(false); //ローディングの設定
  const [openLeftDrawer, setOpenLeftDrawer] = useState<boolean>(false); //LeftDrawerの設定
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false); //AlertsSnackbarの設定
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success'>('error'); //AlertsSnackbarの設定
  const [snackbarMessage, setSnackbarMessage] = useState<string>(''); //AlertsSnackbarの設定
  const [dialogTitle, setDialogTitle] = useState<string>(''); //AlertsDialogの設定(共通)
  const [dialogMessage, setDialogMessage] = useState<string>(''); //AlertsDialogの設定(共通)

  //ページ個別設定
  const [inputData, setInputData] = useState<TargetMetaDataInputs>();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TargetMetaDataInputs>({
    defaultValues: { serialNumber: '', name: '', amount: 1 },
  });

  const validationRules = {
    serialNumber: {
      required: 'シリアルNoを入力して下さい',
      maxLength: {
        value: 100,
        message: 'シリアルNoは100文字以内にして下さい',
      },
    },
    name: {
      required: '名称を入力して下さい',
      maxLength: {
        value: 100,
        message: '名称は100文字以内にして下さい',
      },
    },
    amount: {
      required: '数量を指定して下さい',
      validate: {
        nonZero: (value: number) => value > 0 || '数量は0より多い数値を入力して下さい',
      },
    },
  };

  const onSubmit: SubmitHandler<TargetMetaDataInputs> = (inputData: TargetMetaDataInputs) => {
    setInputData(inputData);
    setDialogTitle('QRコードの作成');
    setDialogMessage('QRコードを作成しますか');
    setOpenDialog(true);
  };

  const { Image } = useQRCode();

  const [targetAddress, setTargetAddress] = useState<string | undefined>(); //アカウントの設定
  const [openDialog, setOpenDialog] = useState<boolean>(false); //AlertsDialogの設定(個別)
  const handleAgreeClick = () => {
    const fetchData = async () => {
      try {
        setProgress(true);
        const res = await axios.post(
          '/api/create-target',
          {
            metaData: inputData,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        const transactionStatus: TransactionStatusWithAddress | undefined = res.data;
        if (transactionStatus === undefined) {
          setSnackbarSeverity('error');
          setSnackbarMessage('NODEの接続に失敗しました');
          setOpenSnackbar(true);
        } else if (transactionStatus.transactionsStatus.code === 'Success') {
          console.log(transactionStatus.transactionsStatus.hash);
          // setHash(transactionStatus.hash);
          setSnackbarSeverity('success');
          setSnackbarMessage(`${transactionStatus.transactionsStatus.group} TXを検知しました`);
          setTargetAddress(transactionStatus.address);
          setOpenSnackbar(true);
        } else {
          setSnackbarSeverity('error');
          setSnackbarMessage(`TXに失敗しました ${transactionStatus.transactionsStatus.code}`);
          setOpenSnackbar(true);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setProgress(false);
      }
    };
    fetchData();
  };

  return (
    <>
      <Header setOpenLeftDrawer={setOpenLeftDrawer} />
      <LeftDrawer openLeftDrawer={openLeftDrawer} setOpenLeftDrawer={setOpenLeftDrawer} />
      <AlertsSnackbar
        openSnackbar={openSnackbar}
        setOpenSnackbar={setOpenSnackbar}
        vertical={'bottom'}
        snackbarSeverity={snackbarSeverity}
        snackbarMessage={snackbarMessage}
      />
      <AlertsDialog
        openDialog={openDialog}
        setOpenDialog={setOpenDialog}
        handleAgreeClick={() => {
          handleAgreeClick();
          setOpenDialog(false);
        }}
        dialogTitle={dialogTitle}
        dialogMessage={dialogMessage}
      />
      {progress ? (
        <Backdrop open={progress}>
          <CircularProgress color='inherit' />
        </Backdrop>
      ) : (
        <Box
          sx={{ p: 3 }}
          display='flex'
          alignItems='center'
          justifyContent='center'
          flexDirection='column'
        >
          {targetAddress ? (
            <>
              <Typography component='div' variant='h6' sx={{ mt: 5, mb: 5 }}>
                記録を行うQRコードを発行しました。
              </Typography>
              <Image
                text={targetAddress}
                options={{
                  level: 'H',
                  margin: 3,
                  scale: 10,
                  width: 70,
                }}
              />

              <Typography component='div' variant='caption' sx={{ mt: 1, mb: 1 }}>
                {`ターゲットアドレス : ${targetAddress}`}
              </Typography>
            </>
          ) : (
            <>
              <Typography component='div' variant='h6' sx={{ mt: 5, mb: 5 }}>
                記録を行うQRコードを発行します。
              </Typography>
              <Stack
                component='form'
                noValidate
                onSubmit={handleSubmit(onSubmit)}
                spacing={2}
                sx={{ m: 2, width: '100%', maxWidth: 700 }}
              >
                <Controller
                  name='serialNumber'
                  control={control}
                  rules={validationRules.serialNumber}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      multiline
                      type='text'
                      label='シリアルNo'
                      error={errors.serialNumber !== undefined}
                      helperText={errors.serialNumber?.message}
                    />
                  )}
                />
                <Controller
                  name='name'
                  control={control}
                  rules={validationRules.name}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      multiline
                      type='text'
                      label='名称'
                      error={errors.name !== undefined}
                      helperText={errors.name?.message}
                    />
                  )}
                />
                <Controller
                  name='amount'
                  control={control}
                  rules={validationRules.amount}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      multiline
                      type='number'
                      label='数量'
                      error={errors.amount !== undefined}
                      helperText={errors.amount?.message}
                    />
                  )}
                />
                <Button variant='contained' type='submit'>
                  QRコードの作成
                </Button>
              </Stack>
            </>
          )}
        </Box>
      )}
    </>
  );
}
export default Issue;