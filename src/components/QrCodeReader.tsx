import { BrowserQRCodeReader } from '@zxing/browser';
import React, { FC, useEffect, useRef, useState } from 'react';
import Result from '@zxing/library/esm/core/Result';
import { useTheme } from '@mui/material/styles';

type QrCodeReaderProps = {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onRead: (result: Result) => void;
};

type CameraDeviceInfo = {
  id: string;
  name: string;
};

export const QrCodeReader: FC<QrCodeReaderProps> = ({ onRead, setOpen }) => {
  const theme = useTheme();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mountedRef = useRef<boolean>(false);
  const [devices, setDevices] = useState<CameraDeviceInfo[]>([]);
  const [currentCamera, setCurrentCamera] = useState<string | undefined>(undefined);

  const setDevicesList = async (): Promise<CameraDeviceInfo[]> => {
    const list = await BrowserQRCodeReader.listVideoInputDevices();
    const result: CameraDeviceInfo[] = [];
    for (const device of list) {
      result.push({ id: device.deviceId, name: device.label });
    }
    setDevices([...result]);
    return result;
  };

  useEffect(() => {
    mountedRef.current = true;
    const codeReader = new BrowserQRCodeReader(undefined, undefined);
    setDevicesList();
    codeReader.decodeFromVideoDevice(
      currentCamera,
      videoRef.current!,
      function (result, _, controls) {
        if (mountedRef.current === false) {
          controls.stop();
          return;
        }
        if (typeof result !== 'undefined') {
          controls.stop();
          onRead(result);
        }
      }
    );
    return function cleanup() {
      mountedRef.current = false;
    };
  }, [currentCamera, onRead]);

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        maxHeight: '500px',
        maxWidth: '500px',
        backgroundColor: theme.palette.background.default,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >
      <video
        style={{
          width: '90%',
          maxWidth: '1000px',
          borderRadius: '10px',
          marginTop: '1em',
          marginBottom: '1em',
        }}
        ref={videoRef}
      />
      <button
        style={{ width: '90%', maxWidth: '1000px' }}
        onClick={() => setOpen(false)}
      >
        読み取りキャンセル
      </button>
    </div>
  );
};