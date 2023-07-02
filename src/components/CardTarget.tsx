import React from 'react';
import { Box, Button, Typography, Card, CardContent, CardActions } from '@mui/material';
import { useRouter } from 'next/router';
import { TargetMetaData } from '@/types/TargetMetaData';
function CardTarget(props: { targetMetaData: TargetMetaData }): JSX.Element {
  const { targetMetaData } = props;
  const router = useRouter();
  return (
    <Card variant='outlined'>
      <CardContent>
        <Box display={'flex'} alignItems={'center'} margin={0.5}>
          <Box width={100}>
            <Typography variant='caption' component='div'>
              シリアルNo
            </Typography>
          </Box>
          <Typography variant='body2' component='div'>
            {targetMetaData.serialNumber}
          </Typography>
        </Box>
        <Box display={'flex'} alignItems={'center'} margin={0.5}>
          <Box width={100}>
            <Typography variant='caption' component='div'>
              名称
            </Typography>
          </Box>
          <Typography variant='body2' component='div'>
            {targetMetaData.name}
          </Typography>
        </Box>
        <Box display={'flex'} alignItems={'center'} margin={0.5}>
          <Box width={100}>
            <Typography variant='caption' component='div'>
              個数
            </Typography>
          </Box>
          <Typography variant='body2' component='div'>
            {targetMetaData.amount}
          </Typography>
        </Box>
        <Box display={'flex'} alignItems={'center'} margin={0.5}>
          <Box width={100}>
            <Typography variant='caption' component='div'>
              アドレス
            </Typography>
          </Box>
          <Typography variant='body2' component='div'>
            {targetMetaData.targetAddress}
          </Typography>
        </Box>
      </CardContent>
      <CardActions>
        <Box width={600} display={'flex'} justifyContent={'center'} mb={3}>
          <Button
            variant='contained'
            size='small'
            onClick={() =>
              router.push({
                pathname: `/detail`,
                query: { targetAddress: targetMetaData.targetAddress },
              })
            }
          >
            詳細確認
          </Button>
        </Box>
      </CardActions>
    </Card>
  );
}
export default CardTarget;