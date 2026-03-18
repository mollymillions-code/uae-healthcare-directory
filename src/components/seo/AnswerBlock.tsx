interface AnswerBlockProps {
  title: string;
  answer: string;
}

export function AnswerBlock({ title, answer }: AnswerBlockProps) {
  return (
    <div className="answer-block mb-8" data-answer-block="true">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-sm text-gray-600 leading-relaxed">{answer}</p>
    </div>
  );
}
