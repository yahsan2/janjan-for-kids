import { useMathQuestions } from "../hooks/use-math-questions";

interface CurrentQuestionProps {
  isStarted: boolean;
}

export const CurrentQuestion: React.FC<CurrentQuestionProps> = ({ isStarted }) => {
  const { mathQuestions } = useMathQuestions();

  if (!isStarted || !mathQuestions[0]) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="space-y-8 max-w-2xl w-full -ml-60">
        {mathQuestions[0].questionText && (
          <p className="text-3xl bg-white p-8 rounded-lg">{mathQuestions[0].questionText}</p>
        )}
        {mathQuestions[0].formula && (
          <p className="text-8xl bg-white p-8 rounded-lg">{mathQuestions[0].formula}</p>
        )}
      </div>
    </div>
  );
};
