interface AnswerBlockProps {
  title: string;
  answer: string;
}

export function AnswerBlock({ title, answer }: AnswerBlockProps) {
  return (
    <div className="answer-block mb-8" data-answer-block="true">
      <h2 className="text-base font-bold text-dark mb-1">{title}</h2>
      <p className="text-sm text-muted leading-relaxed">{answer}</p>
    </div>
  );
}
