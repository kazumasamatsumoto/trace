import React, { useEffect, useState } from 'react';
import LeftDrawer from '@/components/LeftDrawer';
import Header from '@/components/Header';
import AlertsSnackbar from '@/components/AlertsSnackbar';
import AlertsDialog from '@/components/AlertsDialog';
import { Box, Typography, Button, Backdrop, CircularProgress } from '@mui/material';
import { createAccount } from '@/utils/createAccount';
import { accountData } from '@/types/accountData';

function Account(): JSX.Element {
  //共通設定
  const [progress, setProgress] = useState<boolean>(false); //ローディングの設定
  const [openLeftDrawer, setOpenLeftDrawer] = useState<boolean>(false); //LeftDrawerの設定
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false); //AlertsSnackbarの設定
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success'>('error'); //AlertsSnackbarの設定
  const [snackbarMessage, setSnackbarMessage] = useState<string>(''); //AlertsSnackbarの設定
  const [dialogTitle, setDialogTitle] = useState<string>(''); //AlertsDialogの設定(共通)
  const [dialogMessage, setDialogMessage] = useState<string>(''); //AlertsDialogの設定(共通)

  //ページ個別設定
  const [account, setAccount] = useState<accountData | undefined>(); //アカウントの設定
  const [openDialog, setOpenDialog] = useState<boolean>(false); //AlertsDialogの設定(個別)
  const handleAgreeClick = () => {
    setProgress(true);
    const accountData: accountData = createAccount();
    setAccount(accountData);
    localStorage.setItem('accountData', JSON.stringify(accountData));
    setSnackbarSeverity('success');
    setSnackbarMessage('アカウントの生成に成功しました');
    setOpenSnackbar(true);
    setProgress(false);
  };

  useEffect(() => {
    if (localStorage.getItem('accountData')) {
      setAccount(JSON.parse(localStorage.getItem('accountData')!));
    }
  }, []);

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
          {account ? (
            <>
              <Typography component='div' variant='h6' sx={{ mt: 5, mb: 5 }}>
                アカウントは作成済みです。
              </Typography>
              <Typography component='div' variant='caption' sx={{ mt: 5, mb: 1 }}>
                {`秘密鍵 : ${account.privateKey}`}
              </Typography>
              <Typography component='div' variant='caption' sx={{ mt: 1, mb: 1 }}>
                {`公開鍵 : ${account.publicKey}`}
              </Typography>
              <Typography component='div' variant='caption' sx={{ mt: 1, mb: 1 }}>
                {`アドレス : ${account.address}`}
              </Typography>
            </>
          ) : (
            <>
              <Typography component='div' variant='h6' sx={{ mt: 5, mb: 5 }}>
                アカウントが作成されていません。
              </Typography>
              <Button
                color='primary'
                variant='contained'
                onClick={() => {
                  setDialogTitle('アカウントの生成');
                  setDialogMessage('アカウントを生成しますか？');
                  setOpenDialog(true);
                }}
              >
                アカウントの作成
              </Button>
            </>
          )}
        </Box>
      )}
    </>
  );
}
export default Account;