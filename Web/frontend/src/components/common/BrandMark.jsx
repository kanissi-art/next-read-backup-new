const BrandMark = ({ className = 'h-9 w-9' }) => (
  <svg
    aria-hidden="true"
    className={className}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="48" height="48" rx="15" fill="#DB2777" />
    <path
      d="M23.5 17.2c-3.4-2.4-7.5-3.1-13-2.7v19.2c5.4-.4 9.6.5 13 3V17.2Z"
      fill="white"
    />
    <path
      d="M24.5 17.2c3.4-2.4 7.5-3.1 13-2.7v19.2c-5.4-.4-9.6.5-13 3V17.2Z"
      fill="white"
    />
    <path
      d="M31 20.8c0-1.8 2.3-2.5 3.3-.9 1-1.6 3.3-.9 3.3.9 0 1.5-1.5 2.6-3.3 4-1.8-1.4-3.3-2.5-3.3-4Z"
      fill="#DB2777"
    />
    <path
      d="M14 20.8c2.7 0 5.1.5 7.1 1.6M14 26.2c2.7 0 5.1.5 7.1 1.6"
      stroke="#F9A8D4"
      strokeLinecap="round"
      strokeWidth="1.8"
    />
  </svg>
);

export default BrandMark;
