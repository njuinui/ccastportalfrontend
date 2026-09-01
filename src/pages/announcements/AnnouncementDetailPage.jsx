import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import SiteNavbar from "../../components/site/SiteNavbar";
import SiteFooter from "../../components/site/SiteFooter";

import {
  useAnnouncement,
  useAnnouncements,
} from "../../api/public";

import "../../styles/site.css";
import "./Announcements.css";

/* ============================================================
   HELPERS
============================================================ */

function fmtDate(iso) {
  if (!iso) return "";

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getCategoryIcon(category = "") {
  const value = category.toLowerCase();

  if (value.includes("academic")) return "fa-graduation-cap";
  if (value.includes("exam")) return "fa-file-lines";
  if (value.includes("admission")) return "fa-user-plus";
  if (value.includes("event")) return "fa-calendar-star";
  if (value.includes("sport")) return "fa-futbol";
  if (value.includes("notice")) return "fa-bullhorn";
  if (value.includes("holiday")) return "fa-umbrella-beach";
  if (value.includes("result")) return "fa-chart-line";
  if (value.includes("campus")) return "fa-building";
  if (value.includes("fee")) return "fa-money-bill-wave";

  return "fa-bullhorn";
}

/* ============================================================
   SHARE
============================================================ */

const ShareButtons = ({ announcement }) => {
  const [copied, setCopied] = useState(false);

  const shareUrl = window.location.href;

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: announcement.title,
          text:
            announcement.excerpt ||
            "CCAST Bambili announcement",
          url: shareUrl,
        });

        return;
      }

      await navigator.clipboard.writeText(shareUrl);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2200);
    } catch {
      // User cancelled share or clipboard unavailable.
    }
  };

  return (
    <div className="ann-share">
      <span className="ann-share-label">
        <i
          className="fas fa-share-nodes"
          aria-hidden="true"
        />

        Share this announcement
      </span>

      <div className="ann-share-actions">
        <button
          type="button"
          className="ann-share-btn"
          onClick={share}
          aria-label="Share announcement"
          title={copied ? "Link copied" : "Share"}
        >
          <i
            className={
              copied
                ? "fas fa-check"
                : "fas fa-share-nodes"
            }
          />
        </button>
      </div>
    </div>
  );
};

/* ============================================================
   DETAIL PAGE
============================================================ */

const AnnouncementDetailPage = () => {
  const { slug } = useParams();

  const {
    data: a,
    isLoading,
    isError,
  } = useAnnouncement(slug);

  const {
    data: allAnnouncements = [],
  } = useAnnouncements();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [slug]);

  /* ----------------------------------------------------------
     Related announcements
  ---------------------------------------------------------- */

  const related = useMemo(() => {
    if (!a || !Array.isArray(allAnnouncements)) {
      return [];
    }

    return allAnnouncements
      .filter((item) => item.slug !== a.slug)
      .filter((item) => {
        if (!a.category) return true;

        return (
          item.category &&
          item.category.toLowerCase() ===
            a.category.toLowerCase()
        );
      })
      .slice(0, 3);
  }, [a, allAnnouncements]);

  /* ----------------------------------------------------------
     Loading
  ---------------------------------------------------------- */

  if (isLoading) {
    return (
      <div className="hp ann-page">
        <SiteNavbar />

        <main className="ann-detail-main">
          <div className="container-xl">
            <div className="ann-state">
              <div className="ann-state-icon">
                <i className="fas fa-spinner fa-spin"></i>
              </div>

              <h2>Loading announcement</h2>

              <p>
                Please wait while we retrieve the announcement.
              </p>
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>
    );
  }

  /* ----------------------------------------------------------
     Error
  ---------------------------------------------------------- */

  if (isError || !a) {
    return (
      <div className="hp ann-page">
        <SiteNavbar />

        <main className="ann-detail-error">
          <div className="container-xl">
            <div className="ann-state ann-state--error">
              <div className="ann-state-icon">
                <i className="fas fa-file-circle-xmark"></i>
              </div>

              <h2>Announcement not found</h2>

              <p>
                The announcement you're looking for may have
                been removed, unpublished, or the link may be
                incorrect.
              </p>

              <Link
                to="/announcements"
                className="ann-state-btn"
              >
                <i className="fas fa-arrow-left"></i>
                Back to announcements
              </Link>
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>
    );
  }

  const category = a.category || "General";
  const categoryIcon = getCategoryIcon(category);

  const paragraphs = (a.body || "")
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className="hp ann-page">
      <SiteNavbar />

      {/* ======================================================
          ARTICLE HERO
      ====================================================== */}

      <header className="hp-page-hero ann-page-hero">
        <div
          className="hp-page-hero-grid"
          aria-hidden="true"
        ></div>

        <div className="container-xl">
          <div className="hp-page-crumb">
            <Link to="/">Home</Link>

            <i
              className="fas fa-chevron-right"
              aria-hidden="true"
            ></i>

            <Link to="/announcements">
              Announcements
            </Link>

            <i
              className="fas fa-chevron-right"
              aria-hidden="true"
            ></i>

            <span>Details</span>
          </div>

          <div className="ann-hero-eyebrow">
            <span className="ann-hero-eyebrow-icon">
              <i
                className={`fas ${categoryIcon}`}
                aria-hidden="true"
              ></i>
            </span>

            {category}
          </div>

          <h1 className="hp-page-title">
            {a.title}
          </h1>

          <p className="hp-page-sub">
            <i
              className="far fa-calendar me-1"
              aria-hidden="true"
            />

            {fmtDate(a.published_at)}

            {a.pinned && (
              <>
                <span className="mx-2">·</span>

                <span>
                  <i
                    className="fas fa-thumbtack me-1"
                    aria-hidden="true"
                  />

                  Pinned announcement
                </span>
              </>
            )}
          </p>
        </div>
      </header>

      {/* ======================================================
          ARTICLE
      ====================================================== */}

      <main className="ann-detail-main">
        <div className="container-xl">
          <article className="ann-article">

            <div className="ann-article-shell">

              {/* Image */}

              {a.image && (
                <div className="ann-article-img-wrap">
                  <img
                    className="ann-article-img"
                    src={a.image}
                    alt={a.title}
                    onError={(e) => {
                      e.currentTarget
                        .closest(
                          ".ann-article-img-wrap"
                        )
                        ?.remove();
                    }}
                  />
                </div>
              )}

              <div className="ann-article-body-wrap">

                {/* Metadata */}

                <div className="ann-article-meta">

                  <span className="ann-article-meta-item">
                    <i
                      className="far fa-calendar"
                      aria-hidden="true"
                    />

                    {fmtDate(a.published_at)}
                  </span>

                  <span className="ann-article-dot">
                    •
                  </span>

                  <span className="ann-article-meta-item">
                    <i
                      className={`fas ${categoryIcon}`}
                      aria-hidden="true"
                    />

                    {category}
                  </span>

                  {a.pinned && (
                    <>
                      <span className="ann-article-dot">
                        •
                      </span>

                      <span className="ann-card-pin">
                        <i
                          className="fas fa-thumbtack"
                          aria-hidden="true"
                        />

                        Pinned
                      </span>
                    </>
                  )}
                </div>

                {/* Title */}

                <h2 className="ann-article-title">
                  {a.title}
                </h2>

                {/* Lead */}

                {a.excerpt && (
                  <p className="ann-article-lead">
                    {a.excerpt}
                  </p>
                )}

                {/* Body */}

                <div className="ann-article-body">
                  {paragraphs.length > 0 ? (
                    paragraphs.map((paragraph, index) => (
                      <p key={index}>
                        {paragraph}
                      </p>
                    ))
                  ) : (
                    <p>
                      This announcement does not contain
                      additional details.
                    </p>
                  )}
                </div>

                {/* Share */}

                <ShareButtons announcement={a} />

                {/* Footer */}

                <div className="ann-article-foot">
                  <Link
                    to="/announcements"
                    className="ann-back"
                  >
                    <i
                      className="fas fa-arrow-left"
                      aria-hidden="true"
                    />

                    Back to all announcements
                  </Link>
                </div>

              </div>
            </div>

          </article>

          {/* ==================================================
              RELATED
          ================================================== */}

          {related.length > 0 && (
            <section
              className="ann-section ann-section--regular"
              aria-labelledby="related-announcements"
            >
              <div className="ann-section-heading">
                <div>
                  <span className="ann-section-kicker">
                    <i
                      className="fas fa-layer-group"
                      aria-hidden="true"
                    />

                    Continue reading
                  </span>

                  <h2 id="related-announcements">
                    Related announcements
                  </h2>
                </div>
              </div>

              <div className="ann-grid">
                {related.map((item, index) => (
                  <Link
                    key={item.slug}
                    to={`/announcements/${item.slug}`}
                    className="ann-card rv-t"
                    style={{
                      transitionDelay: `${index * 80}ms`,
                    }}
                  >
                    <div className="ann-card-icon">
                      <span>
                        <i
                          className={`fas ${getCategoryIcon(
                            item.category
                          )}`}
                          aria-hidden="true"
                        />
                      </span>
                    </div>

                    <div className="ann-card-content">
                      <div className="ann-card-meta">
                        <span>
                          <i className="far fa-calendar"></i>
                          {fmtDate(
                            item.published_at
                          )}
                        </span>

                        <span className="ann-card-category">
                          {item.category ||
                            "General"}
                        </span>
                      </div>

                      <h3 className="ann-card-title">
                        {item.title}
                      </h3>

                      {item.excerpt && (
                        <p className="ann-card-excerpt">
                          {item.excerpt}
                        </p>
                      )}

                      <span className="ann-card-read">
                        Read announcement

                        <span className="ann-card-arrow">
                          <i className="fas fa-arrow-right"></i>
                        </span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default AnnouncementDetailPage;