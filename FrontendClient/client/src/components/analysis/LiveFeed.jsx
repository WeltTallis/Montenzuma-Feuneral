// src/components/analysis/LiveFeed.jsx
import React from "react";

const LiveFeed = () => {
  const feedItems = [
    { time: "09:41", color: "primary", message: "H-03 departed Westlands mortuary en route to Memorial Chapel", category: "In Transit" },
    { time: "09:33", color: "success", message: "FN-2048 transfer completed — John Kamau received at Nairobi branch", category: "Completed" },
    { time: "09:20", color: "purple", message: "Floral arrangement preparation started for FN-2051 · Grace Wanjiku", category: "Preparing" },
    { time: "09:15", color: "success", message: "Burial permit uploaded — FN-2049 · Samuel Mwenda", category: "Document" },
    { time: "09:05", color: "warning", message: "Coffin order #ORD-441 approved — 6x Mahogany Deluxe", category: "Approved" },
  ];

  const filters = ["All", "Cases", "Hearse", "Staff", "Flowers"];

  return (
    <div className="live-feed">
      <div className="panel-header">
        <div className="panel-title">
          <div className="live-dot-indicator"></div>
          <span>Live Operations Feed</span>
        </div>
      </div>
      <div className="feed-filters">
        {filters.map((f, i) => (
          <button key={i} className={"filter-chip " + (i === 0 ? "active" : "")}>{f}</button>
        ))}
      </div>
      <div className="feed-list">
        {feedItems.map((item, idx) => (
          <div key={idx} className="feed-item">
            <span className="feed-time mono-font">{item.time}</span>
            <div className={"feed-dot " + item.color}></div>
            <div className="feed-message">{item.message}</div>
            <div className={"feed-tag " + item.color}>{item.category}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveFeed;
