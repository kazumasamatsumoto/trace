import React, { useEffect, useState } from 'react';
import LeftDrawer from '@/components/LeftDrawer';
import Header from '@/components/Header';
import { Box, Typography, Backdrop, CircularProgress, Button } from '@mui/material';
import useCheckAccount from '@/hooks/useCheckAccount';
import { searchTarget } from '@/utils/searchTarget';
import CardTarget from '@/components/CardTarget';
import { TargetMetaData } from '@/types/TargetMetaData';

function Home(): JSX.Element {
  //共通設定
  const [progress, setProgress] = useState<boolean>(true); //ローディングの設定
  const [openLeftDrawer, setOpenLeftDrawer] = useState<boolean>(false); //LeftDrawerの設定

  useCheckAccount();
  useEffect(() => {
    initaltargetMetaDataInputsList();
    setProgress(false);
  }, []);

  const initaltargetMetaDataInputsList = async () => {
    const result = await searchTarget();
    if (result === undefined) return;
    setTargetMetaDataList(result);
  };

  const [targetMetaDataList, setTargetMetaDataList] = useState<TargetMetaData[]>([]); //アカウントの設定

  return (
    <>
      <Header setOpenLeftDrawer={setOpenLeftDrawer} />
      <LeftDrawer openLeftDrawer={openLeftDrawer} setOpenLeftDrawer={setOpenLeftDrawer} />
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
            トレース一覧
          </Typography>
          {targetMetaDataList.map((targetMetaData, index) => (
            <Box key={index} mb={1}>
              <CardTarget key={index} targetMetaData={targetMetaData} />
            </Box>
          ))}
        </Box>
      )}
    </>
  );
}
export default Home;