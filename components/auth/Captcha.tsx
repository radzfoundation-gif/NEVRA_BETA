import React, { useState, useEffect } from 'react';

interface CaptchaProps {
  onSuccess: () => void;
  onFail?: () => void;
}

export function Captcha({ onSuccess, onFail }: CaptchaProps) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [answer, setAnswer] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState(false);

  const generateCaptcha = () => {
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
    setAnswer('');
    setError(false);
    setIsVerified(false);
    if (onFail) onFail();
  };

  useEffect(() => {
    generateCaptcha();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verify = () => {
    if (parseInt(answer) === num1 + num2) {
      setIsVerified(true);
      setError(false);
      onSuccess();
    } else {
      setError(true);
      generateCaptcha();
    }
  };

  if (isVerified) {
    return (
      <div className="flex items-center gap-2 text-green-700 bg-green-50/80 p-3.5 rounded-xl border border-green-200 mt-2 transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <span className="font-medium text-sm">Security Verification Passed</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4 bg-zinc-50 border border-zinc-200 rounded-xl mt-2 w-full shadow-sm">
      <label className="text-sm font-medium text-zinc-700">Security Verification <span className="text-red-500">*</span></label>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="px-4 py-2.5 bg-white font-mono font-bold text-lg rounded-xl border border-zinc-200 shadow-sm flex items-center justify-center select-none tracking-widest text-zinc-800 shrink-0">
          {num1} + {num2} 
        </div>
        <div className="flex items-center gap-2 flex-1 relative">
          <input 
            type="number" 
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              setError(false);
            }}
            className={`flex-1 w-full pl-4 pr-24 py-3 border rounded-xl outline-none focus:ring-2 transition-all font-medium ${error ? 'border-red-500 focus:ring-red-200 bg-red-50 text-red-900' : 'border-zinc-200 focus:border-purple-500 focus:ring-purple-200 bg-white placeholder:text-zinc-400'}`}
            placeholder="Answer?"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), verify())}
          />
          <button 
            type="button" 
            onClick={verify}
            disabled={!answer}
            className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 font-medium transition-colors text-sm"
          >
            Verify
          </button>
        </div>
      </div>
      {error && (
        <div className="flex items-center gap-1.5 mt-1 text-red-500 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          <span className="text-sm font-medium">Jawaban salah! Silakan coba jawab lagi.</span>
        </div>
      )}
    </div>
  );
}
