import { Typography } from '@mui/material';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import React from 'react';
import { HistoryData } from '@/types/HistoryData';
import { unixTimeToDateTime } from '@/utils/unixTimeToDateTime';
function TimeLine(props: { historyDataList: HistoryData[] }): JSX.Element {
  const historyDataList = props.historyDataList;
  return (
    <>
      <Timeline position='right'>
        {historyDataList.map((historyData: HistoryData) => (
          <React.Fragment key={historyData.hash}>
            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot
                  sx={{ colr: 'white', backgroundColor: 'green' }}
                  onClick={() => {
                    window.open(
                      `https://testnet.symbol.fyi/accounts/${historyData.hash}`,
                      '_blank'
                    );
                  }}
                >
                  <CheckCircleIcon sx={{ colr: 'white', backgroundColor: 'green' }} />
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent sx={{ py: '12px', px: 2 }}>
                <Typography variant='h6' component='span'>
                  {`${historyData.operation}`}
                </Typography>
                <Typography
                  component='div'
                  variant='caption'
                >{`locate ${historyData.latitude} , ${historyData.longitude}`}</Typography>
                <Typography component='div' variant='caption'>{`${unixTimeToDateTime(
                  historyData.blockCreateTime
                )}`}</Typography>

                <Typography
                  component='div'
                  variant='caption'
                >{`record by ${historyData.signerAddress}`}</Typography>
              </TimelineContent>
            </TimelineItem>
          </React.Fragment>
        ))}
      </Timeline>
    </>
  );
}
export default TimeLine;