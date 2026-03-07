"use client";

import React from "react";

type ToothData = {
  status: string;
  status_label: string;
  color: string;
  updated_at: string;
};

type ToothDiagramProps = {
  toothStates: { [toothNumber: string]: ToothData };
  selectedTeeth: string[];
  onToothClick: (toothNumber: string) => void;
  isKidsMode?: boolean;
};

const PERMANENT_TEETH = {
  upper: ["18", "17", "16", "15", "14", "13", "12", "11", "21", "22", "23", "24", "25", "26", "27", "28"],
  lower: ["48", "47", "46", "45", "44", "43", "42", "41", "31", "32", "33", "34", "35", "36", "37", "38"],
};

const BABY_TEETH = {
  upper: ["55", "54", "53", "52", "51", "61", "62", "63", "64", "65"],
  lower: ["85", "84", "83", "82", "81", "71", "72", "73", "74", "75"],
};

export function ToothDiagram({
  toothStates,
  selectedTeeth,
  onToothClick,
  isKidsMode = false,
}: ToothDiagramProps) {
  const teeth = isKidsMode ? BABY_TEETH : PERMANENT_TEETH;

  const getToothColor = (toothNumber: string): string => {
    const data = toothStates[toothNumber];
    if (!data) return "#ffffff"; // 白（記録なし）
    return data.color;
  };

  const isSelected = (toothNumber: string): boolean => {
    return selectedTeeth.includes(toothNumber);
  };

  const renderTooth = (toothNumber: string, index: number, isUpper: boolean) => {
    // シンプルに左から右へ配置
    const toothWidth = 60;
    const toothGap = 8;
    const spacing = toothWidth + toothGap;
    const startX = 20;

    const x = startX + index * spacing;
    const y = isUpper ? 50 : 200;

    const fill = getToothColor(toothNumber);
    const stroke = isSelected(toothNumber) ? "#3b82f6" : "#4b5563";
    const strokeWidth = isSelected(toothNumber) ? "3" : "1.5";

    return (
      <g
        key={toothNumber}
        onClick={() => onToothClick(toothNumber)}
        className="cursor-pointer hover:opacity-80 transition-opacity"
      >
        <rect
          x={x}
          y={y}
          width={toothWidth}
          height="80"
          rx="8"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
        <text
          x={x + toothWidth / 2}
          y={y + 45}
          textAnchor="middle"
          fontSize="14"
          fontWeight="600"
          fill="#334155"
        >
          {toothNumber}
        </text>
      </g>
    );
  };

  const teethPerRow = isKidsMode ? 10 : 16;
  const viewBoxWidth = 20 + teethPerRow * 68 + 20;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${viewBoxWidth} 350`}
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto border rounded-lg bg-slate-50"
      >
        {/* 中央線 */}
        <line
          x1={viewBoxWidth / 2}
          y1="20"
          x2={viewBoxWidth / 2}
          y2="330"
          stroke="#e2e8f0"
          strokeWidth="2"
          strokeDasharray="5,5"
        />

        {/* 上下区切り線 */}
        <line
          x1="20"
          y1="165"
          x2={viewBoxWidth - 20}
          y2="165"
          stroke="#e2e8f0"
          strokeWidth="2"
        />

        {/* 象限ラベル */}
        <text x="30" y="30" fontSize="12" fill="#64748b" fontWeight="600">
          右上 ({isKidsMode ? "5x" : "1x"})
        </text>
        <text
          x={viewBoxWidth - 30}
          y="30"
          fontSize="12"
          fill="#64748b"
          fontWeight="600"
          textAnchor="end"
        >
          左上 ({isKidsMode ? "6x" : "2x"})
        </text>
        <text x="30" y="340" fontSize="12" fill="#64748b" fontWeight="600">
          右下 ({isKidsMode ? "8x" : "4x"})
        </text>
        <text
          x={viewBoxWidth - 30}
          y="340"
          fontSize="12"
          fill="#64748b"
          fontWeight="600"
          textAnchor="end"
        >
          左下 ({isKidsMode ? "7x" : "3x"})
        </text>

        {/* 歯の描画 */}
        {teeth.upper.map((toothNumber, index) => renderTooth(toothNumber, index, true))}
        {teeth.lower.map((toothNumber, index) => renderTooth(toothNumber, index, false))}
      </svg>

      {/* 凡例 */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border border-gray-300 bg-white"></div>
          <span className="text-slate-600">記録なし</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: "#10b981" }}></div>
          <span className="text-slate-600">治療済み</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: "#eab308" }}></div>
          <span className="text-slate-600">経過観察</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: "#dc2626" }}></div>
          <span className="text-slate-600">治療予定</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: "#f97316" }}></div>
          <span className="text-slate-600">治療中</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: "#3b82f6" }}></div>
          <span className="text-slate-600">被せ物</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: "#06b6d4" }}></div>
          <span className="text-slate-600">歯石除去</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: "#a855f7" }}></div>
          <span className="text-slate-600">クリーニング</span>
        </div>
      </div>
    </div>
  );
}
