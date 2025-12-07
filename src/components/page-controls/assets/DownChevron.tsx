interface DownChevronProps {
  color?: string;
}

export function DownChevron({ color = "#737373" }: DownChevronProps) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.48483 3.99996L6.24219 7.24261L2.99955 3.99996H9.48483Z"
        className="group-hover:fill-neutral-800 transition-colors duration-150"
        style={{ fill: color }}
      />
    </svg>
  );
}
