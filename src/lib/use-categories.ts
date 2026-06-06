import { useEffect, useState } from "react";
import type { Category } from "@/lib/jeopardy-data";
import { CATEGORIES as DEFAULT_CATEGORIES, POINT_VALUES } from "@/lib/jeopardy-data";

const STORAGE_KEY = "jeopardy-categories-v1";

function isValid(data: unknown): data is Category[] {
  if (!Array.isArray(data) || data.length !== 6) return false;
  return data.every(
    (c) =>
      c &&
      typeof c.name === "string" &&
      Array.isArray(c.questions) &&
      c.questions.length === 5 &&
      c.questions.every(
        (q: unknown) =>
          q &&
          typeof (q as Question).question === "string" &&
          typeof (q as Question).answer === "string"
      )
  );
}

type Question = { question: string; answer: string };

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isValid(parsed)) setCategories(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const save = (next: Category[]) => {
    setCategories(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const reset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setCategories(DEFAULT_CATEGORIES);
  };

  return { categories, save, reset, pointValues: POINT_VALUES };
}
