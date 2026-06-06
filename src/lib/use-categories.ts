import { useEffect, useState } from "react";
import type { Category } from "@/lib/jeopardy-data";
import { CATEGORIES as DEFAULT_CATEGORIES, POINT_VALUES } from "@/lib/jeopardy-data";

const CAT_KEY = "jeopardy-categories-v1";
const META_KEY = "jeopardy-meta-v1";

export const DEFAULT_TITLE = "Familienquiz";
export const DEFAULT_SUBTITLE = "Das klassische Quizspiel – ganz nach euch.";

type Question = { question: string; answer: string };

interface Meta {
  title: string;
  subtitle: string;
}

function isValidCategories(data: unknown): data is Category[] {
  if (!Array.isArray(data) || data.length < 1 || data.length > 10) return false;
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

function isValidMeta(data: unknown): data is Meta {
  return (
    !!data &&
    typeof (data as Meta).title === "string" &&
    typeof (data as Meta).subtitle === "string"
  );
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [meta, setMeta] = useState<Meta>({
    title: DEFAULT_TITLE,
    subtitle: DEFAULT_SUBTITLE,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CAT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isValidCategories(parsed)) setCategories(parsed);
      }
    } catch {
      /* ignore */
    }
    try {
      const raw = localStorage.getItem(META_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isValidMeta(parsed)) setMeta(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const save = (next: Category[]) => {
    setCategories(next);
    try {
      localStorage.setItem(CAT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const saveMeta = (next: Meta) => {
    setMeta(next);
    try {
      localStorage.setItem(META_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const reset = () => {
    try {
      localStorage.removeItem(CAT_KEY);
      localStorage.removeItem(META_KEY);
    } catch {
      /* ignore */
    }
    setCategories(DEFAULT_CATEGORIES);
    setMeta({ title: DEFAULT_TITLE, subtitle: DEFAULT_SUBTITLE });
  };

  return { categories, save, meta, saveMeta, reset, pointValues: POINT_VALUES };
}
