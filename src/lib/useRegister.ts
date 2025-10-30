import { useEffect, useMemo } from "react";
import type { Class } from "./types/Class.type";
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
