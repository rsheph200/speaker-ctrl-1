interface VolumeIconProps {
  className?: string;
  color?: string;
}

export function VolumeIcon({
  className,
  color = "#7E7D7D",
}: VolumeIconProps) {
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
        d="M11.5732 2.27148C13.613 3.3681 15 5.52191 15 8C15 10.4779 13.6128 12.6309 11.5732 13.7275L11.1777 11.6162C12.2832 10.7963 13 9.48205 13 8C13 6.51774 12.2835 5.20271 11.1777 4.38281L11.5732 2.27148Z"
        fill={color}
      />
      <path
        d="M8 1.5C8.55228 1.5 9 1.94772 9 2.5V13.5C9 14.0523 8.55228 14.5 8 14.5H6.49219C6.1818 14.4999 5.88945 14.3554 5.7002 14.1094L3.69238 11.5H2C1.44772 11.5 1 11.0523 1 10.5V5.5C1 4.94772 1.44772 4.5 2 4.5H3.69238L5.7002 1.89062C5.88945 1.6446 6.1818 1.50007 6.49219 1.5H8Z"
        fill={color}
      />
    </svg>
  );
}

