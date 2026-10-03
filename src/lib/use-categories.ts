import { useEffect, useRef, useState } from "react";
import type { Category } from "@/lib/jeopardy-data";
import {
  CATEGORIES as DEFAULT_CATEGORIES,
  POINT_VALUES,
} from "@/lib/jeopardy-data";
import { supabase } from "@/lib/supabase";

export const DEFAULT_TITLE = "Familienquiz";
export const DEFAULT_SUBTITLE =
  "Das klassische Quizspiel – ganz nach euch.";

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

export const QUIZ_IDS = {
  1: "2f167918-a027-44f0-a012-422e802a7bef",
  2: "1dd72322-8420-43a8-a504-6665757232c6",
  3: "6a14ed4b-febe-483e-bf11-8211daa4b947",
  4: "ba7f1a27-2381-4c78-9967-e35679b112a8",
} as const;

export type QuizSlot = 1 | 2 | 3 | 4;

function isValidCategories(data: unknown): data is Category[] {
  if (!Array.isArray(data) || data.length < 1 || data.length > 10) {
    return false;
  }

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
  const [quizSlot, setQuizSlot] = useState<QuizSlot>(1);

  const [categories, setCategories] =
    useState<Category[]>(DEFAULT_CATEGORIES);

  const [meta, setMeta] = useState<Meta>({
    title: DEFAULT_TITLE,
    subtitle: DEFAULT_SUBTITLE,
  });

  const [loading, setLoading] = useState(true);

  const categoriesRef = useRef(categories);
  const metaRef = useRef(meta);

  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  useEffect(() => {
    metaRef.current = meta;
  }, [meta]);

  const loadQuiz = async (slot: QuizSlot) => {
    const quizId = QUIZ_IDS[slot];

    setLoading(true);
    setQuizSlot(slot);

    const { data, error } = await supabase
      .from("quiz_data")
      .select("data")
      .eq("id", quizId)
      .single();

    if (error) {
      console.error("Fehler beim Laden:", error);
      setLoading(false);
      return;
    }

    const quizData = data.data as QuizData;

    const loadedMeta =
      quizData?.meta && isValidMeta(quizData.meta)
        ? quizData.meta
        : {
            title: slot === 1 ? DEFAULT_TITLE : `Quiz ${slot}`,
            subtitle: DEFAULT_SUBTITLE,
          };

    if (
      quizData?.categories &&
      isValidCategories(quizData.categories)
    ) {
      categoriesRef.current = quizData.categories;
      metaRef.current = loadedMeta;

      setCategories(quizData.categories);
      setMeta(loadedMeta);
    } else {
      const freshCategories =
        structuredClone(DEFAULT_CATEGORIES);

      categoriesRef.current = freshCategories;
      metaRef.current = loadedMeta;

      setCategories(freshCategories);
      setMeta(loadedMeta);

      const { error: initError } = await supabase
        .from("quiz_data")
        .update({
          data: {
            categories: freshCategories,
            meta: loadedMeta,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", quizId);

      if (initError) {
        console.error(
          `Quiz ${slot} konnte nicht initialisiert werden:`,
          initError
        );
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    loadQuiz(1);
  }, []);

  const saveAll = async (
    nextCategories: Category[],
    nextMeta: Meta
  ) => {
    const quizId = QUIZ_IDS[quizSlot];

    const { data, error } = await supabase
      .from("quiz_data")
      .update({
        data: {
          categories: nextCategories,
          meta: nextMeta,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", quizId)
      .select();

    console.log("SUPABASE UPDATE:", {
      slot: quizSlot,
      data,
      error,
    });

    if (error) {
      console.error("Fehler beim Speichern:", error);
    }
  };

  const save = async (next: Category[]) => {
    categoriesRef.current = next;
    setCategories(next);

    await saveAll(next, metaRef.current);
  };

  const saveMeta = async (next: Meta) => {
    metaRef.current = next;
    setMeta(next);

    await saveAll(categoriesRef.current, next);
  };

  const reset = async () => {
    const defaultMeta = {
      title:
        quizSlot === 1
          ? DEFAULT_TITLE
          : `Quiz ${quizSlot}`,
      subtitle: DEFAULT_SUBTITLE,
    };

    const freshCategories =
      structuredClone(DEFAULT_CATEGORIES);

    categoriesRef.current = freshCategories;
    metaRef.current = defaultMeta;

    setCategories(freshCategories);
    setMeta(defaultMeta);

    await saveAll(freshCategories, defaultMeta);
  };

  return {
    categories,
    save,
    meta,
    saveMeta,
    reset,
    pointValues: POINT_VALUES,
    quizSlot,
    loadQuiz,
    loading,
  };
}