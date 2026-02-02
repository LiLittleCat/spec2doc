interface StepHeaderProps {
  step: number;
  title: string;
}

export function StepHeader({ step, title }: StepHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
        <span className="text-sm font-bold text-primary">{step}</span>
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
    </div>
  );
}
