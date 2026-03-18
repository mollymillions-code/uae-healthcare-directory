interface AnswerBlockProps {
  title: string;
  answer: string;
}

export function AnswerBlock({ title, answer }: AnswerBlockProps) {
  return (
    <div className="answer-block mb-8" data-answer-block="true">
      <h2 className="font-display text-section text-ink mb-2">{title}</h2>
      <p className="text-sm text-ink-muted leading-relaxed">{answer}</p>
    </div>
  );
}
