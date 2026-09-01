// src/pages/admission/AdmissionSuccess.jsx

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { confirmAction, swalInfo } from "../../lib/alerts";
import toast from "react-hot-toast";
import "./AdmissionSuccess.css";

// ============================================================
// ROADMAP CONFIGURATION
// ============================================================

const ROADMAP = [
  {
    num: "01",
    title: "Application Review",
    desc: "Your submitted documents and information are being reviewed by the admissions committee.",
    status: "active",
    date: "Est. 2 days",
    icon: "fa-file-lines",
  },
  {
    num: "02",
    title: "Interview Scheduling",
    desc: "If required, you will be contacted to schedule an interview or entrance assessment.",
    status: "pending",
    date: "Est. 1 week",
    icon: "fa-calendar-check",
  },
  {
    num: "03",
    title: "Final Decision",
    desc: "You will receive an official admission decision via email and on this portal.",
    status: "pending",
    date: "Est. 2 weeks",
    icon: "fa-envelope-open-text",
  },
  {
    num: "04",
    title: "Enrollment",
    desc: "Upon acceptance, complete enrollment by paying fees and submitting original documents.",
    status: "pending",
    date: "Est. 3 weeks",
    icon: "fa-user-graduate",
  },
];

// ============================================================
// CONFETTI COMPONENT
// ============================================================

function Confetti() {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = [
      "#059669", "#3b82f6", "#f59e0b", "#ef4444", 
      "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"
    ];
    
    const particles = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: Math.random() * 8 + 4,
      h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 3 + 2,
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 8,
      opacity: 1,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    }));

    let frame = 0;
    const maxFrames = 200;
    
    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.rot += p.rotV;
        
        if (frame > maxFrames - 40) {
          p.opacity = Math.max(0, p.opacity - 0.025);
        }
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        
        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        
        ctx.restore();
      });
      
      if (frame < maxFrames) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    
    requestAnimationFrame(animate);

    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return <canvas ref={canvasRef} className="succ-confetti-canvas" aria-hidden="true" />;
}

// ============================================================
// QR CODE COMPONENT (SVG-based, no external lib)
// ============================================================

function QRCode({ value, size = 94 }) {
  const modules = useMemo(() => generateQRModules(value), [value]);
  const cellSize = size / modules.length;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block" }}
      role="img"
      aria-label={`QR Code for ${value}`}
    >
      {modules.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <rect
              key={`${y}-${x}`}
              x={x * cellSize}
              y={y * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#0f172a"
              rx={1}
            />
          ) : null
        )
      )}
    </svg>
  );
}

/**
 * Minimal QR module generator (deterministic pattern from string)
 * Creates a 25x25 grid QR-like pattern
 */
function generateQRModules(str) {
  const n = 25;
  const grid = Array.from({ length: n }, () => Array(n).fill(false));

  /* Finder patterns */
  const drawFinder = (ox, oy) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const isBorder = y === 0 || y === 6 || x === 0 || x === 6;
        const isInner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        grid[oy + y][ox + x] = isBorder || isInner;
      }
    }
  };
  
  drawFinder(0, 0);
  drawFinder(n - 7, 0);
  drawFinder(0, n - 7);

  /* Timing patterns */
  for (let i = 8; i < n - 8; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  /* Data area: hash string into grid */
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  
  const seed = Math.abs(hash);
  let rng = seed;
  const next = () => {
    rng = (rng * 16807 + 0) % 2147483647;
    return rng / 2147483647;
  };

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (grid[y][x]) continue;
      
      const inFinder =
        (x < 9 && y < 9) || (x > n - 9 && y < 9) || (x < 9 && y > n - 9);
      
      if (inFinder || x === 6 || y === 6) continue;
      
      grid[y][x] = next() > 0.55;
    }
  }

  return grid;
}

// ============================================================
// TIMER COMPONENT
// ============================================================

function Timer({ targetDate, label = "Processing" }) {
  const [timeLeft, setTimeLeft] = useState("");
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date(targetDate);
      const diff = target - now;
      
      if (diff <= 0) {
        setTimeLeft("Processing started");
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };
    
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, [targetDate]);
  
  return (
    <div className="succ-timer">
      <i className="fas fa-hourglass-half"></i>
      <span>{label}: <strong>{timeLeft}</strong></span>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

const AdmissionSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get application data from location state
  const applicationData = location.state || {};
  const trackingId = applicationData.applicationNumber || "ADM — pending";
  const applicationId = applicationData.applicationId || null;
  const submittedAt = applicationData.submittedAt || new Date().toISOString();
  
  const [showSlip, setShowSlip] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  
  // Estimated processing time (10 business days from now)
  const estimatedCompletionDate = useMemo(() => {
    const date = new Date();
    let daysAdded = 0;
    while (daysAdded < 10) {
      date.setDate(date.getDate() + 1);
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        daysAdded++;
      }
    }
    return date;
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Track success page view (for analytics)
  }, [trackingId]);

  /**
   * Print the application slip
   */
  const handlePrintSlip = useCallback(() => {
    const slip = document.querySelector(".succ-slip-preview");
    if (!slip) return;
    
    setIsPrinting(true);
    
    try {
      const win = window.open("", "_blank", "width=600,height=700");
      if (!win) {
        toast.error("Please allow popups to print the slip");
        setIsPrinting(false);
        return;
      }
      
      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Application Slip - ${trackingId}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                padding: 2rem;
                color: #0f172a;
                font-size: 14px;
                background: #f8fafc;
              }
              .slip-container {
                max-width: 500px;
                margin: 0 auto;
                background: #fff;
                padding: 2rem;
                border-radius: 12px;
                box-shadow: 0 4px 24px rgba(0,0,0,0.06);
              }
              .slip-header {
                text-align: center;
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 3px solid #1e3a5f;
              }
              .slip-header h2 {
                font-size: 1.2rem;
                color: #1e3a5f;
                margin-bottom: 0.2rem;
              }
              .slip-header small {
                color: #94a3b8;
                font-size: 0.75rem;
              }
              .slip-row {
                display: flex;
                justify-content: space-between;
                padding: 0.5rem 0;
                border-bottom: 1px dashed #e2e8f0;
              }
              .slip-row:last-child { border-bottom: none; }
              .slip-label {
                color: #94a3b8;
                font-weight: 500;
                font-size: 0.8rem;
              }
              .slip-value {
                font-weight: 600;
                color: #0f172a;
                font-size: 0.85rem;
              }
              .slip-tracking {
                font-family: 'SF Mono', 'Courier New', monospace;
                font-size: 1.1rem;
                color: #1e3a5f;
                letter-spacing: 0.05em;
              }
              .slip-footer {
                text-align: center;
                margin-top: 1.5rem;
                padding-top: 1rem;
                border-top: 3px solid #1e3a5f;
              }
              .slip-footer small {
                color: #94a3b8;
                font-size: 0.7rem;
              }
              .slip-status {
                display: inline-block;
                padding: 0.2rem 0.8rem;
                border-radius: 999px;
                font-size: 0.75rem;
                font-weight: 600;
                background: #fef3c7;
                color: #92400e;
              }
              .slip-status--accepted {
                background: #d1fae5;
                color: #065f46;
              }
              .slip-status--rejected {
                background: #fee2e2;
                color: #991b1b;
              }
              .slip-status--reviewing {
                background: #dbeafe;
                color: #1e40af;
              }
              @media print {
                body { background: #fff; }
                .slip-container { box-shadow: none; padding: 1rem; }
              }
            </style>
          </head>
          <body>
            <div class="slip-container">
              <div class="slip-header">
                <h2>🏫 CCAST Bambili</h2>
                <small>Application Submission Slip — Admissions 2025–2026</small>
              </div>
              
              <div class="slip-row">
                <span class="slip-label">Tracking Number</span>
                <span class="slip-value slip-tracking">${trackingId}</span>
              </div>
              
              <div class="slip-row">
                <span class="slip-label">Submission Date</span>
                <span class="slip-value">${new Date(submittedAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}</span>
              </div>
              
              <div class="slip-row">
                <span class="slip-label">Academic Year</span>
                <span class="slip-value">2025–2026</span>
              </div>
              
              <div class="slip-row">
                <span class="slip-label">Status</span>
                <span class="slip-value">
                  <span class="slip-status">Pending Review</span>
                </span>
              </div>
              
              <div class="slip-row">
                <span class="slip-label">Application ID</span>
                <span class="slip-value">${applicationId || '—'}</span>
              </div>
              
              <div class="slip-footer">
                <small>
                  Present this slip at the admissions office for verification.<br>
                  This is not an admission letter.
                </small>
              </div>
            </div>
          </body>
        </html>
      `);
      
      win.document.close();
      
      // Wait for content to load before printing
      setTimeout(() => {
        win.print();
        setIsPrinting(false);
      }, 500);
      
    } catch (error) {
      console.error("Print error:", error);
      toast.error("Failed to print. Please try again.");
      setIsPrinting(false);
    }
  }, [trackingId, applicationId, submittedAt]);

  /**
   * Copy tracking number to clipboard
   */
  const handleCopyTrackingId = useCallback(() => {
    if (!trackingId || trackingId === "ADM — pending") {
      toast.error("No tracking number available yet");
      return;
    }
    
    navigator.clipboard.writeText(trackingId)
      .then(() => {
        setCopied(true);
        toast.success("Tracking number copied!");
        setTimeout(() => setCopied(false), 3000);
      })
      .catch(() => {
        toast.error("Failed to copy. Please copy manually.");
      });
  }, [trackingId]);

  /**
   * Share via WhatsApp
   */
  const handleShareWhatsApp = useCallback(() => {
    if (!trackingId || trackingId === "ADM — pending") {
      toast.error("No tracking number available yet");
      return;
    }
    
    const message = `🎓 CCAST Bambili Application\n\nTracking Number: ${trackingId}\nStatus: Pending Review\n\nYou can track your application status on the CCAST admissions portal.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  }, [trackingId]);

  /**
   * Share via Email
   */
  const handleShareEmail = useCallback(() => {
    if (!trackingId || trackingId === "ADM — pending") {
      toast.error("No tracking number available yet");
      return;
    }
    
    const subject = `CCAST Bambili Application - ${trackingId}`;
    const body = `Dear Admissions Team,\n\nI have submitted my application to CCAST Bambili.\n\nTracking Number: ${trackingId}\nSubmission Date: ${new Date(submittedAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })}\n\nPlease let me know if you need any additional information.\n\nThank you.`;
    
    window.open(`mailto:admissions@ccastbambili.cm?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
  }, [trackingId, submittedAt]);

  /**
   * Handle download PDF (placeholder)
   */
  const handleDownloadPDF = useCallback(() => {
    swalInfo(
      "Coming Soon",
      "Downloading your application summary PDF will be available here shortly."
    );
  }, []);

  /**
   * Handle navigate to home with confirmation if slip is shown
   * Using confirmAction from your alerts.js
   */
  const handleNavigateHome = useCallback(async () => {
    if (showSlip) {
      const confirmed = await confirmAction({
        title: "You have an open slip preview",
        text: "Are you sure you want to leave? The slip will be hidden.",
        confirmText: "Yes, leave",
        icon: "question",
      });
      
      if (confirmed) {
        navigate("/");
      }
    } else {
      navigate("/");
    }
  }, [showSlip, navigate]);

  /**
   * Get status badge class
   */
  const getStatusBadgeClass = (status) => {
    const classes = {
      active: "succ-rm-badge",
      pending: "succ-rm-badge succ-rm-badge--pending",
      completed: "succ-rm-badge succ-rm-badge--completed",
      delayed: "succ-rm-badge succ-rm-badge--delayed",
    };
    return classes[status] || classes.pending;
  };

  /**
   * Get status label
   */
  const getStatusLabel = (status) => {
    const labels = {
      active: "In Progress",
      pending: "Upcoming",
      completed: "Completed",
      delayed: "Delayed",
    };
    return labels[status] || status;
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="succ-page">
      <Confetti />

      {/* Top bar */}
      <div className="succ-top">
        <div className="container-xl">
          <div className="d-flex align-items-center justify-content-between">
            <a
              href="/"
              className="adm-brand d-flex align-items-center text-decoration-none"
            >
              <div className="hp-logo" style={{ width: 36, height: 36, fontSize: 1 }}>
                C
              </div>
              <div className="hp-logo-txt" style={{ marginLeft: ".5rem" }}>
                <span className="hp-logo-n" style={{ color: "#fff", fontSize: ".9rem" }}>
                  CCAST Bambili
                </span>
                <span className="hp-logo-s" style={{ fontSize: ".55rem" }}>
                  Admissions Portal
                </span>
              </div>
            </a>
          </div>
        </div>
      </div>

      <div className="succ-body">
        <div className="container-xl">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              {/* Success card */}
              <div className="succ-card">
                <div className="succ-icon-wrap">
                  <div className="succ-icon">
                    <i className="fas fa-check"></i>
                  </div>
                  <div className="succ-ring"></div>
                </div>
                
                <h2 className="succ-title">Submission Successful</h2>
                <p className="succ-desc">
                  Your application has been received by the Admissions Registry.
                  A confirmation email has been sent to the address you provided.
                </p>

                <div className="succ-tracking">
                  <div className="succ-tracking-label">
                    Application Tracking Number
                  </div>
                  <div className="succ-tracking-id">
                    {trackingId}
                    <button
                      className="succ-tracking-copy"
                      onClick={handleCopyTrackingId}
                      aria-label="Copy tracking number"
                      title="Copy to clipboard"
                    >
                      <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                    </button>
                  </div>
                  <div className="succ-tracking-note">
                    Save this number to track your application status at any time.
                  </div>
                </div>

                {/* Timer */}
                <Timer 
                  targetDate={estimatedCompletionDate} 
                  label="Estimated processing time" 
                />

                {/* QR Code */}
                <div className="succ-qr-wrap">
                  <div className="succ-qr-box">
                    <QRCode value={trackingId} />
                  </div>
                  <span className="succ-qr-label">Scan to check status</span>
                </div>

                {/* Notification badges */}
                <div className="succ-notif-list">
                  <div className="succ-notif-item">
                    <i className="fas fa-check-circle"></i> 
                    Confirmation SMS sent to your phone
                  </div>
                  <div className="succ-notif-item">
                    <i className="fas fa-envelope-circle-check"></i>
                    Confirmation email sent to your inbox
                  </div>
                  <div className="succ-notif-item">
                    <i className="fas fa-shield-halved"></i>
                    Application secured in our system
                  </div>
                </div>

                {/* Action buttons */}
                <div className="succ-action-row">
                  <button
                    className="btn succ-act-btn succ-act-btn--primary"
                    onClick={handlePrintSlip}
                    disabled={isPrinting}
                  >
                    <i className={`fas ${isPrinting ? 'fa-spinner fa-spin' : 'fa-print'} me-2`}></i>
                    {isPrinting ? 'Preparing...' : 'Print Slip'}
                  </button>
                  <button
                    className="btn succ-act-btn succ-act-btn--primary"
                    onClick={handleDownloadPDF}
                  >
                    <i className="fas fa-download me-2"></i>
                    Download PDF
                  </button>
                  <button
                    className="btn succ-act-btn succ-act-btn--outline"
                    onClick={() => setShowSlip(!showSlip)}
                  >
                    <i className={`fas fa-${showSlip ? "eye-slash" : "eye"} me-2`}></i>
                    {showSlip ? "Hide" : "Preview"} Slip
                  </button>
                </div>

                {/* Share row */}
                <div className="succ-share-row">
                  <button
                    className="succ-share-btn"
                    title="Share via WhatsApp"
                    onClick={handleShareWhatsApp}
                  >
                    <i className="fab fa-whatsapp"></i>
                  </button>
                  <button
                    className="succ-share-btn"
                    title="Share via Email"
                    onClick={handleShareEmail}
                  >
                    <i className="fas fa-envelope"></i>
                  </button>
                  <button
                    className="succ-share-btn"
                    title="Share on Twitter/X"
                    onClick={() => {
                      window.open(
                        `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                          `🎓 I've just submitted my application to CCAST Bambili!\nTracking: ${trackingId}`
                        )}`,
                        "_blank"
                      );
                    }}
                  >
                    <i className="fa-brands fa-twitter"></i>
                  </button>
                </div>

                {/* Slip preview */}
                <div className={`succ-slip-preview ${showSlip ? "show" : ""}`}>
                  <div className="succ-slip-hd">
                    <h4>CCAST Bambili</h4>
                    <small>
                      Application Submission Slip — Admissions 2025–2026
                    </small>
                  </div>
                  
                  <div className="succ-slip-row">
                    <span className="succ-slip-label">Tracking Number</span>
                    <span className="succ-slip-val succ-slip-tracking">
                      {trackingId}
                    </span>
                  </div>
                  
                  <div className="succ-slip-row">
                    <span className="succ-slip-label">Submission Date</span>
                    <span className="succ-slip-val">
                      {new Date(submittedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  
                  <div className="succ-slip-row">
                    <span className="succ-slip-label">Academic Year</span>
                    <span className="succ-slip-val">2025–2026</span>
                  </div>
                  
                  <div className="succ-slip-row">
                    <span className="succ-slip-label">Status</span>
                    <span className="succ-slip-val">
                      <span className="succ-slip-status">Pending Review</span>
                    </span>
                  </div>
                  
                  {applicationId && (
                    <div className="succ-slip-row">
                      <span className="succ-slip-label">Application ID</span>
                      <span className="succ-slip-val">{applicationId}</span>
                    </div>
                  )}
                  
                  <div className="succ-slip-footer">
                    <small>
                      Present this slip at the admissions office for verification.
                      <br />
                      This is not an admission letter.
                    </small>
                  </div>
                </div>
              </div>

              {/* Roadmap */}
              <div className="succ-roadmap">
                <div className="succ-roadmap-hd">
                  <h3>Application Roadmap</h3>
                  <p>Your application will go through the following stages:</p>
                </div>
                <div className="succ-roadmap-steps">
                  {ROADMAP.map((s, i) => (
                    <div key={i} className={`succ-rm-step ${s.status}`}>
                      <div className="succ-rm-left">
                        <div className="succ-rm-num">
                          {s.status === 'completed' ? (
                            <i className="fas fa-check"></i>
                          ) : (
                            s.num
                          )}
                        </div>
                        {i < ROADMAP.length - 1 && (
                          <div className="succ-rm-line"></div>
                        )}
                      </div>
                      <div className="succ-rm-right">
                        <div className="succ-rm-header">
                          <h5>{s.title}</h5>
                          <span className={getStatusBadgeClass(s.status)}>
                            {s.status === 'active' && (
                              <span className="succ-rm-pulse"></span>
                            )}
                            {getStatusLabel(s.status)}
                          </span>
                        </div>
                        <p>{s.desc}</p>
                        <div className="succ-rm-date">
                          <i className="fas fa-clock me-1"></i>
                          {s.date}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info cards */}
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div className="succ-info-card">
                    <div
                      className="succ-info-ic"
                      style={{ background: "#eff6ff", color: "#1d4ed8" }}
                    >
                      <i className="fas fa-envelope"></i>
                    </div>
                    <div>
                      <div className="succ-info-t">Check Your Email</div>
                      <div className="succ-info-d">
                        A confirmation email with your application details has
                        been sent. Check spam if you don't see it.
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="succ-info-card">
                    <div
                      className="succ-info-ic"
                      style={{ background: "#f0fdf4", color: "#059669" }}
                    >
                      <i className="fas fa-clock"></i>
                    </div>
                    <div>
                      <div className="succ-info-t">Processing Time</div>
                      <div className="succ-info-d">
                        Applications are typically reviewed within 10–15
                        business days. You'll be notified of updates.
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="succ-info-card">
                    <div
                      className="succ-info-ic"
                      style={{ background: "#fffbeb", color: "#d97706" }}
                    >
                      <i className="fas fa-headset"></i>
                    </div>
                    <div>
                      <div className="succ-info-t">Need Help?</div>
                      <div className="succ-info-d">
                        Contact admissions at{" "}
                        <strong>admissions@ccastbambili.cm</strong> or call
                        during office hours.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="succ-actions">
                <button
                  className="btn succ-home-btn"
                  onClick={handleNavigateHome}
                >
                  <i className="fas fa-house me-2"></i>Back to Home
                </button>
                <button
                  className="btn succ-portal-btn"
                  onClick={() => navigate("/login")}
                >
                  <i className="fas fa-right-to-bracket me-2"></i>Sign In to
                  Portal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="adm-bottom">
        <div className="container-xl d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="adm-bottom-links">
            <a href="#">Help Center</a>
            <a href="#">Contact Admissions</a>
            <a href="#">FAQs</a>
          </div>
          <div>
            &copy; {new Date().getFullYear()} CCAST Bambili. All rights
            reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdmissionSuccess;