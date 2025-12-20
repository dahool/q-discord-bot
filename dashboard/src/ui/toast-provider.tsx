import { Toast } from 'flowbite-react';
import { useState, type ReactNode, type FC } from 'react';

type ToastType = 'info' | 'error' | 'success' | 'warning';

interface ToastProviderProps {
  children: (showToast: (msg: string, toastType: ToastType ) => void) => ReactNode;
}

const ToastProvider: FC<ToastProviderProps> = ({ children }) => {
  
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');
  const [, setType] = useState<ToastType>('info');

  const showToast = (msg: string, toastType: ToastType) => {
    setMessage(msg);
    setType(toastType);
    setShow(true);
    setTimeout(() => setShow(false), 5000); // auto hide
  };

  return (
    <>
      {show && (
      <Toast duration={500}>
        <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-cyan-500 dark:bg-cyan-800 dark:text-cyan-200">
            {/*<HiFire className="h-5 w-5" />*/}
        </div>
        <div className="ml-3 text-sm font-normal">{message}</div>
        <Toast.Toggle onDismiss={() => setShow(false)} />
      </Toast>
      )}
      { children(showToast) }
    </>
  );
};

export default ToastProvider;
