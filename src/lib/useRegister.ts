import { useEffect, useMemo } from "react";
import type { Class } from "./useCtrl2";
import { register, unregister } from "./provider";

export function useRegister<T>(token: symbol | Class<any>, dependency: T) {
  const stableToken = useMemo(() => token, [token]);

  useEffect(() => {
    register(stableToken, dependency);

    return () => {
      unregister(stableToken);
    };
  }, [stableToken, dependency]);
}
