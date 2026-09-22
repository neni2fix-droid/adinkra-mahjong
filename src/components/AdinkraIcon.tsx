import { memo } from 'react';
import { SYMBOL_BY_ID } from '../data/symbols';
import { getSymbolSvg } from '../data/svg-registry';

interface Props {
  symbolId: number;
  className?: string;
}

const AdinkraIcon = memo(function AdinkraIcon({ symbolId, className = 'h-10 w-10' }: Props) {
  const symbol = SYMBOL_BY_ID[symbolId];
  if (!symbol) return null;

  const svg = getSymbolSvg(symbol.svgAssetPath);
  return (
    <span
      className={`inline-flex items-center justify-center text-gold ${className}`}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
});

export default AdinkraIcon;
