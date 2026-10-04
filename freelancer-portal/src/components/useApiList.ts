"use client";

import { useCallback, useEffect, useState } from "react";

/*
  Loads a list from one of the portal APIs (always from MongoDB,
  never cached) and exposes loading / error / reload.
*/
export function useApiList<T>(url: string, key: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(url, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load data.");
      }

      setItems(Array.isArray(data[key]) ? data[key] : []);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Failed to load data."
      );
    } finally {
      setLoading(false);
    }
  }, [url, key]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, error, reload };
}
