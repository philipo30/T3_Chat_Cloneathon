import React from "react";

export const DecorativeLine: React.FC = () => {
  return (
    <div
      className="fixed right-0 top-0 w-28 h-16 pointer-events-none"
      style={{
        clipPath: "inset(0px 12px 0px 0px)",
        zIndex: "15",
      }}
    >
      <div
        className="absolute top-3.5 w-full h-32 -mb-8 pointer-events-none"
        style={{
          animation:
            "0s cubic-bezier(0.2, 0.4, 0.1, 0.95) 0s 1 normal none running none",
          animationTimingFunction: "cubic-bezier(0.2, 0.4, 0.1, 0.95)",
          transformOrigin: "50% 0%",
          transitionDuration: "0.15s",
          transitionTimingFunction: "cubic-bezier(0.2, 0.4, 0.1, 0.95)",
          zIndex: "10",
        }}
      >
        <svg
          className="absolute overflow-visible translate-y-[0.5px]"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 128 32"
          style={{
            height: "36px",
            overflowClipMargin: "content-box",
            pointerEvents: "none",
            position: "absolute",
            right: "-32px",
            transformOrigin: "0% 0%",
            verticalAlign: "middle",
            transform: "matrix(1, 0, 0.57735, 1, 0, 0)",
          }}
        >
          <path
            fill="transparent"
            shapeRendering="optimizeQuality"
            strokeWidth="1px"
            strokeLinecap="round"
            strokeMiterlimit="10"
            vectorEffect="non-scaling-stroke"
            d="M0,0c5.9,0,10.7,4.8,10.7,10.7v10.7c0,5.9,4.8,10.7,10.7,10.7H128V0"
            stroke="rgb(50,32,40)"
          />
        </svg>
      </div>
    </div>
  );
};
