"use client";

import { createContext, useCallback, useContext, useState } from "react";

type LoginSecretContextValue = {
  signupRevealed: boolean;
  revealSignup: () => void;
};

const LoginSecretContext = createContext<LoginSecretContextValue | null>(null);

const CLICKS_NEEDED = 3;

export function LoginSecretProvider({ children }: { children: React.ReactNode }) {
  const [clickCount, setClickCount] = useState(0);
  const [signupRevealed, setSignupRevealed] = useState(false);

  const revealSignup = useCallback(() => {
    setClickCount((prev) => {
      const next = prev + 1;
      if (next >= CLICKS_NEEDED) setSignupRevealed(true);
      return next;
    });
  }, []);

  return (
    <LoginSecretContext.Provider value={{ signupRevealed, revealSignup }}>
      {children}
    </LoginSecretContext.Provider>
  );
}

export function useLoginSecret() {
  return useContext(LoginSecretContext);
}
