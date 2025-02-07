import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { type SetStateAction, useEffect, useState } from "react";
import { db } from "../config/firebase";
import { useAuth } from "./use-auth";

interface MathQuestion {
  id: string;
  questionText: string; // 問題文
  answer: string; // 正解の答え
  level: number; // 問題のレベル
  formula: string; // 計算式
  correctCount: number; // 正解数
  wrongCount: number; // 不正解数
  createdAt: Date; // 作成日時
}

export const useMathQuestions = () => {
  const [mathQuestions, setMathQuestions] = useState<MathQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchMathQuestions = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const mathQuestionsRef = collection(db, `users/${user.uid}/mathQuestions`);
        const q = query(
          mathQuestionsRef,
          where("correctCount", "==", 0),
          where("createdAt", ">=", new Date(Date.now() - 15 * 60 * 1000)),
          orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(
          q,
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          (snapshot: { docs: { data: () => any; id: any }[] }) => {
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            const questions = snapshot.docs.map((doc: { data: () => any; id: any }) => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                // FirestoreのタイムスタンプをネイティブのDateオブジェクトに変換
                createdAt: data.createdAt?.toDate() || new Date(),
              };
            }) as MathQuestion[];
            setMathQuestions(questions);
            setError(null);
            setLoading(false);
          },
          (err: SetStateAction<Error | null>) => {
            // biome-ignore lint/suspicious/noConsole: <explanation>
            console.error("Error fetching math questions:", err);
            setError(err instanceof Error ? err : new Error("Failed to fetch math questions"));
            setLoading(false);
          }
        );

        // Cleanup subscription on unmount
        return () => unsubscribe();
      } catch (err) {
        // biome-ignore lint/suspicious/noConsole: <explanation>
        console.error("Error setting up snapshot:", err);
        setError(err instanceof Error ? err : new Error("Failed to setup snapshot"));
        setLoading(false);
      }
    };

    fetchMathQuestions();
  }, [user]);

  return { mathQuestions, loading, error };
};
