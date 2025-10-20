import { useCallback, useState } from "react";

/**
 * Hook para forzar el re-renderizado de un componente
 * @returns Una función que al ser llamada fuerza el re-render del componente
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const refresh = useRefresh();
 *
 *   return (
 *     <button onClick={refresh}>
 *       Refrescar componente
 *     </button>
 *   );
 * }
 * ```
 */
export function useRefresh(): () => void {
  const [, setState] = useState(0);

  const refresh = useCallback(() => {
    setState((prev) => prev + 1);
  }, []);

  return refresh;
}
