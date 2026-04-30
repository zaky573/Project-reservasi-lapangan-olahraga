import { useState } from 'react';
import { ExternalLink, FileImage } from 'lucide-react';

type PaymentProofPreviewProps = {
  src?: string;
  title: string;
  amountLabel?: string;
};

export function PaymentProofPreview({ src, title, amountLabel }: PaymentProofPreviewProps) {
  const [hasError, setHasError] = useState(false);

  if (!src) return null;

  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          {amountLabel && (
            <p className="text-xs text-muted-foreground">{amountLabel}</p>
          )}
        </div>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
        >
          <ExternalLink className="mr-1 h-3.5 w-3.5" />
          Buka
        </a>
      </div>

      {hasError ? (
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground hover:border-primary/50 hover:bg-primary/5"
        >
          <FileImage className="mb-2 h-8 w-8 text-primary" />
          File bukti pembayaran tidak bisa ditampilkan langsung. Klik untuk membuka file.
        </a>
      ) : (
        <img
          src={src}
          alt={title}
          onError={() => setHasError(true)}
          className="max-h-[520px] w-full rounded-lg border border-border object-contain"
        />
      )}
    </div>
  );
}
