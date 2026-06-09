import React from 'react'

const Loader = ({
  size = "h-5 w-5",
  color = "border-t-blue-500",
  borderWidth = "border-2",
  backgroundColor="border-gray-300"
}) => {
  return (
    <div
      className={`${size} aspect-square animate-spin rounded-full ${borderWidth} ${backgroundColor} ${color} m-auto `}
    />
  );
};

export default Loader;