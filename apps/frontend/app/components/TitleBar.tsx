"use client";

import { useState } from "react";

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow();
  };

  const handleMaximize = () => {
    window.electronAPI?.maximizeWindow();
    setIsMaximized((prev) => !prev);
  };

  const handleClose = () => {
    window.electronAPI?.closeWindow();
  };

  return (
    <>
      <style>{`
        .titlebar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 32px;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 0 0 14px;
          background: #030f0f;
          border-bottom: 1px solid rgba(0, 180, 180, 0.12);
          -webkit-app-region: drag;
          user-select: none;
        }

        .titlebar-left {
          display: flex;
          align-items: center;
          gap: 8px;
          -webkit-app-region: drag;
        }

        .titlebar-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(0, 200, 200, 0.35);
        }

        .titlebar-app-name {
          font-family: 'Orbitron', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 4px;
          color: rgba(0, 200, 200, 0.5);
          text-transform: uppercase;
        }

        .titlebar-controls {
          display: flex;
          height: 32px;
          -webkit-app-region: no-drag;
        }

        .titlebar-btn {
          width: 46px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: background 0.15s ease;
          color: rgba(0, 200, 200, 0.5);
        }

        .titlebar-btn:hover {
          background: rgba(0, 200, 200, 0.08);
          color: rgba(0, 220, 220, 0.85);
        }

        .titlebar-btn.close:hover {
          background: rgba(220, 50, 50, 0.75);
          color: #fff;
        }

        .titlebar-btn svg {
          pointer-events: none;
        }
      `}</style>

      <div className="titlebar">
        <div className="titlebar-left">
          <div className="titlebar-dot" />
          <span className="titlebar-app-name">AURIX</span>
        </div>

        <div className="titlebar-controls">
          {/* Minimize */}
          <button
            className="titlebar-btn"
            onClick={handleMinimize}
            title="Minimize"
          >
            <svg width="11" height="1" viewBox="0 0 11 1" fill="none">
              <rect width="11" height="1" fill="currentColor" />
            </svg>
          </button>

          {/* Maximize / Restore */}
          <button
            className="titlebar-btn"
            onClick={handleMaximize}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? (
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path
                  d="M3 1h7v7M1 3h7v7"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </svg>
            ) : (
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <rect
                  x="0.5"
                  y="0.5"
                  width="10"
                  height="10"
                  stroke="currentColor"
                />
              </svg>
            )}
          </button>

          {/* Close */}
          <button
            className="titlebar-btn close"
            onClick={handleClose}
            title="Close"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <line
                x1="1"
                y1="1"
                x2="10"
                y2="10"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <line
                x1="10"
                y1="1"
                x2="1"
                y2="10"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
