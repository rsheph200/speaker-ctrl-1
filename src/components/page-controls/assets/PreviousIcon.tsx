interface PreviousIconProps {
  className?: string;
  color?: string;
}

export function PreviousIcon({
  className,
  color = "#7E7D7D",
}: PreviousIconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M4.6543 1C5.12126 1.00024 5.49976 1.37874 5.5 1.8457V6.33301L12.1846 1.87695C12.7468 1.50226 13.4999 1.90537 13.5 2.58105V13.4189C13.5 14.0948 12.7469 14.4979 12.1846 14.123L5.5 9.66602V14.1543C5.49976 14.6213 5.12126 14.9998 4.6543 15H3.3457C2.87874 14.9998 2.50024 14.6213 2.5 14.1543V1.8457C2.50024 1.37874 2.87874 1.00024 3.3457 1H4.6543Z"
        fill={color}
      />
    </svg>
  );
}
