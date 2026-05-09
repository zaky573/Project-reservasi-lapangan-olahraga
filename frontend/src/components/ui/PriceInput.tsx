import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Plus, Minus } from 'lucide-react';

interface PriceInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  value: string | number;
  onChange: (e: any) => void;
  step?: number;
}

export const PriceInput = forwardRef<HTMLInputElement, PriceInputProps>(
  ({ label, error, className, value, onChange, step = 1000, ...props }, ref) => {
    const formatNumberWithDots = (num: string | number): string => {
      const numStr = typeof num === 'string' ? num : String(num);
      const cleanNum = numStr.replace(/\D/g, '');
      return cleanNum.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/\D/g, '');
      onChange({ target: { value: rawValue } });
    };

    const handleIncrement = () => {
      const currentValue = typeof value === 'string' ? parseInt(value) || 0 : value;
      const newValue = currentValue + step;
      onChange({ target: { value: String(newValue) } });
    };

    const handleDecrement = () => {
      const currentValue = typeof value === 'string' ? parseInt(value) || 0 : value;
      const newValue = Math.max(0, currentValue - step);
      onChange({ target: { value: String(newValue) } });
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm mb-1.5 text-foreground font-medium">
            {label}
          </label>
        )}
        <div className="flex items-stretch gap-2">
          <button
            type="button"
            onClick={handleDecrement}
            className={cn(
              'px-3 bg-destructive/10 hover:bg-destructive/15 text-destructive rounded-lg',
              'transition-colors duration-150 flex-shrink-0 flex items-center justify-center',
              'border border-destructive/20 hover:border-destructive/30'
            )}
            aria-label="Kurangi 1000"
          >
            <Minus className="w-5 h-5" />
          </button>
          
          <div className="flex-1 flex items-stretch gap-0">
            <div className="px-4 py-2 bg-muted/50 rounded-l-lg flex items-center justify-center border border-r-0 border-border text-sm font-semibold text-muted-foreground">
              Rp
            </div>
            <input
              ref={ref}
              type="text"
              className={cn(
                'flex-1 px-4 py-2 bg-input-background border border-border rounded-r-lg',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'text-right font-semibold text-base',
                error && 'border-destructive focus:ring-destructive',
                className
              )}
              value={formatNumberWithDots(value)}
              onChange={handleInputChange}
              placeholder="0"
              inputMode="numeric"
              {...props}
            />
          </div>
          
          <button
            type="button"
            onClick={handleIncrement}
            className={cn(
              'px-3 bg-primary/10 hover:bg-primary/15 text-primary rounded-lg',
              'transition-colors duration-150 flex-shrink-0 flex items-center justify-center',
              'border border-primary/20 hover:border-primary/30'
            )}
            aria-label="Tambah 1000"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        {error && <p className="text-destructive text-sm mt-1.5">{error}</p>}
      </div>
    );
  }
);

PriceInput.displayName = 'PriceInput';
