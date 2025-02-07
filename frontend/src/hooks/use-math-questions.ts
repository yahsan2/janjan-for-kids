import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
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
        const q = query(mathQuestionsRef, orderBy("createdAt", "asc"));
        const querySnapshot = await getDocs(q);

        const questions = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // FirestoreのタイムスタンプをネイティブのDateオブジェクトに変換
            createdAt: data.createdAt?.toDate() || new Date(),
          };
        }) as MathQuestion[];

        console.log("Fetched math questions:", questions);
        setMathQuestions(questions);
        setError(null);
      } catch (err) {
        console.error("Error fetching math questions:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch math questions"));
      } finally {
        setLoading(false);
      }
    };

    fetchMathQuestions();
  }, [user]);

  return { mathQuestions, loading, error };
};
