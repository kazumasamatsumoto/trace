import React, { useEffect, useState } from 'react';
import LeftDrawer from '@/components/LeftDrawer';
import Header from '@/components/Header';
import AlertsSnackbar from '@/components/AlertsSnackbar';
import { Box, Typography, Backdrop, CircularProgress, Button, Stack, Divider } from '@mui/material';
import { PublicAccount, TransactionGroup, TransactionStatus } from 'symbol-sdk';
import { networkType } from '@/consts/blockchainProperty';
import { useRouter } from 'next/router';
import TimeLine from '@/components/TimeLine';
import { getHistory } from '@/utils/getHistory';
import { HistoryData } from '@/types/HistoryData';

function Detail(): JSX.Element {
  //共通設定
  const [progress, setProgress] = useState<boolean>(true); //ローディングの設定
  const [openLeftDrawer, setOpenLeftDrawer] = useState<boolean>(false); //LeftDrawerの設定
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false); //AlertsSnackbarの設定
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success'>('error'); //AlertsSnackbarの設定
  const [snackbarMessage, setSnackbarMessage] = useState<string>(''); //AlertsSnackbarの設定
  const router = useRouter();
  const targetAddress = router.query.targetAddress as string;
  const [histroyDataList, setHistroyDataList] = useState<HistoryData[]>([]);

  useEffect(() => {
    initalhistroyDataList();
  }, []);

  const initalhistroyDataList = async () => {
    const result = await getHistory(targetAddress);
    if (result === undefined) return;
    console.log(result);
    setHistroyDataList(result);
    setProgress(false);
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
      {progress ? (
        <Backdrop open={progress}>
          <CircularProgress color='inherit' />
        </Backdrop>
      ) : (
        <Box
          p={3}
          display='flex'
          alignItems='center'
          justifyContent='center'
          flexDirection='column'
        >
          <Typography component='div' variant='h6' mt={5} mb={1}>
            履歴詳細
          </Typography>
          <TimeLine historyDataList={histroyDataList} />
          <Box width={500} display={'flex'} justifyContent={'space-around'} m={5}>
            <Button variant='outlined' size='small' onClick={() => router.push(`/`)}>
              一覧に戻る
            </Button>
          </Box>
        </Box>
      )}
    </>
  );
}
export default Detail;