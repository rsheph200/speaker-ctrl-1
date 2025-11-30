interface NextIconProps {
  className?: string;
  color?: string;
}

export function NextIcon({ className, color = "#7E7D7D" }: NextIconProps) {
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
        d="M12.6543 1C13.1213 1.00024 13.4998 1.37874 13.5 1.8457V14.1543C13.4998 14.6213 13.1213 14.9998 12.6543 15H11.3457C10.8787 14.9998 10.5002 14.6213 10.5 14.1543V9.66602L3.81543 14.123C3.25312 14.4979 2.5 14.0948 2.5 13.4189V2.58105C2.50009 1.90537 3.25316 1.50226 3.81543 1.87695L10.5 6.33301V1.8457C10.5002 1.37874 10.8787 1.00024 11.3457 1H12.6543Z"
        fill={color}
      />
    </svg>
  );
}
