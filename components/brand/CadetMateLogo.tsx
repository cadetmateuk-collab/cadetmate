import Image from 'next/image';
import { cn } from '@/lib/utils';

type CadetMateLogoProps = {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
  variant?: 'default' | 'onDark';
};

const markHeights = { sm: 28, md: 32, lg: 38 } as const;

/** Logo mark — no container, sits naturally in navigation */
export function CadetMateLogo({
  size = 'md',
  showWordmark = true,
  className,
  variant = 'default',
}: CadetMateLogoProps) {
  const markH = markHeights[size];
  const onDark = variant === 'onDark';

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <Image
        src={onDark ? '/images/c2.png' : '/images/logo.png'}
        alt="CadetMate"
        width={markH}
        height={markH}
        className="h-auto w-auto object-contain shrink-0"
        style={{ height: markH, width: 'auto' }}
        priority
      />
      {showWordmark && (
        <div className="hidden sm:block leading-none">
          <p className={cn('text-sm font-semibold tracking-tight', onDark ? 'text-white' : 'text-foreground')}>
            CadetMate
          </p>
        </div>
      )}
    </div>
  );
}
