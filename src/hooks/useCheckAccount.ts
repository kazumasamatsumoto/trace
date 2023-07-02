import { useRouter } from 'next/router';
import { useEffect } from 'react';

const useCheckAccount = () => {
  const router = useRouter();
  useEffect(() => {
    try {
      if (!localStorage.getItem('accountData')) {
        router.push('/account');
      }
    } catch (e) {
      console.error(e);
    }
  }, []);
};

export default useCheckAccount;