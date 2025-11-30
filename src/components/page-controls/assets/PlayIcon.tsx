interface PlayIconProps {
  className?: string;
  color?: string;
}

export function PlayIcon({ className, color = "#7E7D7D" }: PlayIconProps) {
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
        d="M3 2.74106C3 1.96926 3.83722 1.48839 4.50388 1.87728L13.5191 7.13628C14.1806 7.52216 14.1806 8.47795 13.5191 8.86383L4.50387 14.1227C3.83722 14.5116 3 14.0307 3 13.259V2.74106Z"
        fill={color}
      />
    </svg>
  );
}
