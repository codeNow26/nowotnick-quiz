import { useEffect, useState } from "react";
import type { Category } from "@/lib/jeopardy-data";
import { CATEGORIES as DEFAULT_CATEGORIES, POINT_VALUES } from "@/lib/jeopardy-data";
import { supabase } from "@/lib/supabase";

export const DEFAULT_TITLE = "Familienquiz";
export const DEFAULT_SUBTITLE = "Das klassische Quizspiel – ganz nach euch.";

type Question = {
  question: string;
  answer: string;
};

interface Meta {
  title: string;
  subtitle: string;
}

interface QuizData {
  categories: Category[];
  meta: Meta;
}

const QUIZ_ID = "2f167918-a027-44f0-a012-422e802a7bef";

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
    async function loadData() {
      const { data, error } = await supabase
        .from("quiz_data")
        .select("data")
        .eq("id", QUIZ_ID)
        .single();

      if (error) {
        console.error("Fehler beim Laden:", error);
        return;
      }

      const quizData = data.data as QuizData;

      if (quizData?.categories && isValidCategories(quizData.categories)) {
        setCategories(quizData.categories);
      }

      if (quizData?.meta && isValidMeta(quizData.meta)) {
        setMeta(quizData.meta);
      }
    }

    loadData();
  }, []);

  const saveAll = async (nextCategories: Category[], nextMeta: Meta) => {
    setCategories(nextCategories);
    setMeta(nextMeta);

  const { data, error } = await supabase
  .from("quiz_data")
  .update({
    data: {
      categories: nextCategories,
      meta: nextMeta,
    },
    updated_at: new Date().toISOString(),
  })
  .eq("id", QUIZ_ID)
  .select();

console.log("SUPABASE UPDATE:", { data, error });

    if (error) {
      console.error("Fehler beim Speichern:", error);
    }
  };

  const save = async (next: Category[]) => {
    await saveAll(next, meta);
  };

  const saveMeta = async (next: Meta) => {
    await saveAll(categories, next);
  };

  const reset = async () => {
    const defaultMeta = {
      title: DEFAULT_TITLE,
      subtitle: DEFAULT_SUBTITLE,
    };

    await saveAll(DEFAULT_CATEGORIES, defaultMeta);
  };

  return {
    categories,
    save,
    meta,
    saveMeta,
    reset,
    pointValues: POINT_VALUES,
  };
}