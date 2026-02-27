import { Input } from '@/components/ui/input';

interface ReadOnlyFieldProps {
  label: string;
  value: string;
}

export function ReadOnlyField({ label, value }: ReadOnlyFieldProps) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <Input
        type="text"
        value={value}
        disabled
        className="bg-field-disabled text-muted-foreground h-10"
      />
    </div>
  );
}
