interface PauseIconProps {
  className?: string;
  color?: string;
}

export function PauseIcon({ className, color = "#7E7D7D" }: PauseIconProps) {
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
        d="M2 2C2 1.44772 2.44772 1 3 1H6C6.55228 1 7 1.44772 7 2V14C7 14.5523 6.55228 15 6 15H3C2.44772 15 2 14.5523 2 14V2Z"
        fill={color}
      />
      <path
        d="M9 2C9 1.44772 9.44772 1 10 1H13C13.5523 1 14 1.44772 14 2V14C14 14.5523 13.5523 15 13 15H10C9.44772 15 9 14.5523 9 14V2Z"
        fill={color}
      />
    </svg>
  );
}
