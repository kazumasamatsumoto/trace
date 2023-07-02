import React, { useEffect, useState } from 'react';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import axios from 'axios';
import { useQRCode } from 'next-qrcode';
import { QrCodeReader } from '@/components/QrCodeReader';
import useCheckAccount from '@/hooks/useCheckAccount';
import { accountData } from '@/types/accountData';
import { PayloadForOfflineSignature } from '@/types/PayloadForOfflineSignature';
import { offlineSignature } from '@/utils/offlineSignature';
import { TransactionStatus } from 'symbol-sdk';

function Record(): JSX.Element {
  //共通設定
  const [progress, setProgress] = useState<boolean>(false); //ローディングの設定
  const [openLeftDrawer, setOpenLeftDrawer] = useState<boolean>(false); //LeftDrawerの設定
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false); //AlertsSnackbarの設定
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success'>('error'); //AlertsSnackbarの設定
  const [snackbarMessage, setSnackbarMessage] = useState<string>(''); //AlertsSnackbarの設定
  const [dialogTitle, setDialogTitle] = useState<string>(''); //AlertsDialogの設定(共通)
  const [dialogMessage, setDialogMessage] = useState<string>(''); //AlertsDialogの設定(共通)

  //ページ個別設定

  useCheckAccount();
  useEffect(() => {
    if (localStorage.getItem('accountData')) {
      setUserAccount(JSON.parse(localStorage.getItem('accountData')!));
    }
    navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
  }, []);

  function successCallback(position: GeolocationPosition) {
    setPosition(position);
  }
  function errorCallback(error: GeolocationPositionError) {
    console.log(error);
    alert('位置情報の取得に失敗しました。位置情報の利用を許可して下さい');
  }

  const [position, setPosition] = useState<GeolocationPosition | undefined>(); //現在地情報
  const [operation, setOperation] = useState<string>('着荷'); //記録する作業内容

  const [clinetAccount, setUserAccount] = useState<accountData | undefined>(); //アカウントの設定

  const { Image } = useQRCode();

  const [isOpenQRCamera, setIsOpenQRCamera] = useState<boolean>(false);
  const clickOpenQrReader = () => {
    setIsOpenQRCamera(true);
  };

  const [targetAddress, setTargetAddress] = useState<string | undefined>(); //アカウントの設定
  const [openDialog, setOpenDialog] = useState<boolean>(false); //AlertsDialogの設定(個別)
  const handleAgreeClick = () => {
    const fetchData = async () => {
      try {
        setProgress(true);
        const res = await axios.post(
          '/api/record-target',
          {
            clinetPublicKey: clinetAccount?.publicKey,
            targetAddress: targetAddress,
            operation: operation,
            latitude: position?.coords.latitude.toString(),
            longitude: position?.coords.longitude.toString(),
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const payloadForOfflineSignature: PayloadForOfflineSignature | undefined =
          res.data.payloadForOfflineSignature;
        console.log(payloadForOfflineSignature);

        const transactionStatus: TransactionStatus | undefined = await offlineSignature(
          clinetAccount!.privateKey,
          payloadForOfflineSignature!
        );

        if (transactionStatus === undefined) {
          setSnackbarSeverity('error');
          setSnackbarMessage('NODEの接続に失敗しました');
          setOpenSnackbar(true);
        } else if (transactionStatus.code === 'Success') {
          console.log(transactionStatus.hash);
          // setHash(transactionStatus.hash);
          setSnackbarSeverity('success');
          setSnackbarMessage(`${transactionStatus.group} TXを検知しました`);
          // setTargetAddress(transactionStatus.address);
          setOpenSnackbar(true);
        } else {
          setSnackbarSeverity('error');
          setSnackbarMessage(`TXに失敗しました ${transactionStatus.code}`);
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
                記録する内容を確認して下さい。
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
              <Typography component='div' variant='caption' sx={{ mt: 1, mb: 1 }}>
                {`記録者アドレス : ${clinetAccount?.address}`}
              </Typography>
              <Typography component='div' variant='caption' sx={{ mt: 1, mb: 1 }}>
                {`現在地情報 : ${position?.coords.latitude},${position?.coords.longitude}`}
              </Typography>
              <Box width='30vw' mt={1} mb={1}>
                <FormControl fullWidth>
                  <InputLabel>内容を選択</InputLabel>
                  <Select
                    value={operation}
                    label='Operation'
                    onChange={(event) => {
                      setOperation(event.target.value as string);
                    }}
                  >
                    <MenuItem value={'着荷'}>着荷</MenuItem>
                    <MenuItem value={'加工'}>加工</MenuItem>
                    <MenuItem value={'出荷'}>出荷</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Button
                color='primary'
                variant='contained'
                onClick={() => {
                  setDialogTitle('情報の記録');
                  setDialogMessage('この情報を記録しますか？');
                  setOpenDialog(true);
                }}
              >
                記録へ進む
              </Button>
            </>
          ) : (
            <>
              {isOpenQRCamera ? (
                <QrCodeReader
                  onRead={async (res) => {
                    setIsOpenQRCamera(false);
                    console.log(res.getText());
                    setTargetAddress(res.getText());
                  }}
                  setOpen={setIsOpenQRCamera}
                />
              ) : (
                <>
                  <Typography component='div' variant='h6' sx={{ mt: 5, mb: 5 }}>
                    QRコードを読み込み、情報の確認や記録を行います。
                  </Typography>
                  <Button color='primary' variant='contained' onClick={clickOpenQrReader}>
                    カメラを起動する
                  </Button>
                </>
              )}
            </>
          )}
        </Box>
      )}
    </>
  );
}
export default Record;