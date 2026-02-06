import { useShortCutContext } from "@/context/ShortCutContext";
import { useEffect, useRef } from "react";

export const useFocusableInput = (id: string, order: number) => {

  const ref = useRef<HTMLInputElement>(null);
  const { register, unregister } = useShortCutContext();

  useEffect(() => {
    register({ id, ref, order });
    return () => unregister(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, order]);
  return ref

};
