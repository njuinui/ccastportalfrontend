// src/pages/site/AnnouncementsPage.jsx

import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import SiteNavbar from "../../components/site/SiteNavbar";
import SiteFooter from "../../components/site/SiteFooter";
import useRevealOnScroll from "../../hooks/useRevealOnScroll";
import { useAnnouncements } from "../../api/public";

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
    month: "short",
    year: "numeric",
  });
}

function getCategory(item) {
  return item?.category?.trim() || "General";
}

function getExcerpt(item) {
  return (
    item?.excerpt ||
    item?.body?.replace(/\s+/g, " ").slice(0, 180) ||
    "Read the latest update from CCAST Bambili."
  );
}

/* ============================================================
   PAGE
============================================================ */

const AnnouncementsPage = () => {
  useRevealOnScroll();

  const {
    data: items = [],
    isLoading,
    isError,
  } = useAnnouncements();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  /* ============================================================
     CATEGORIES
  ============================================================ */

  const categories = useMemo(() => {
    const unique = new Set(
      items
        .map((item) => getCategory(item))
        .filter(Boolean)
    );

    return ["All", ...Array.from(unique)];
  }, [items]);

  /* ============================================================
     FILTERED ANNOUNCEMENTS
  ============================================================ */

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const itemCategory = getCategory(item);

      const matchesCategory =
        category === "All" ||
        itemCategory === category;

      const searchableText = [
        item?.title,
        item?.excerpt,
        item?.body,
        itemCategory,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query ||
        searchableText.includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [items, search, category]);

  /* ============================================================
     FEATURED / PINNED
  ============================================================ */

  const featuredItems = useMemo(() => {
    return filteredItems.filter((item) => item.pinned);
  }, [filteredItems]);

  const regularItems = useMemo(() => {
    return filteredItems.filter((item) => !item.pinned);
  }, [filteredItems]);

  /* ============================================================
     LOADING
  ============================================================ */

  if (isLoading) {
    return (
      <div className="hp announcements-page">
        <SiteNavbar />

        <main className="ann-loading-page">
          <div className="container-xl">
            <div className="ann-loading-card">
              <div className="ann-loading-spinner">
                <i className="fas fa-spinner fa-spin" />
              </div>

              <h2>Loading announcements</h2>

              <p>
                Please wait while we fetch the latest CCAST updates.
              </p>
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>
    );
  }

  /* ============================================================
     ERROR
  ============================================================ */

  if (isError) {
    return (
      <div className="hp announcements-page">
        <SiteNavbar />

        <main className="ann-error-page">
          <div className="container-xl">
            <div className="ann-error-card">

              <div className="ann-error-icon">
                <i className="fas fa-triangle-exclamation" />
              </div>

              <span className="ann-eyebrow">
                Something went wrong
              </span>

              <h1>
                We couldn't load the announcements.
              </h1>

              <p>
                There was a problem retrieving the latest updates.
                Please refresh the page and try again.
              </p>

              <button
                type="button"
                className="ann-btn ann-btn-primary"
                onClick={() => window.location.reload()}
              >
                <i className="fas fa-rotate-right" />
                Try Again
              </button>
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="hp announcements-page">

      <SiteNavbar />

      <main>

        {/* =====================================================
            HERO
        ===================================================== */}

        <header className="ann-page-hero">

          <div
            className="ann-hero-orb ann-hero-orb-one"
            aria-hidden="true"
          />

          <div
            className="ann-hero-orb ann-hero-orb-two"
            aria-hidden="true"
          />

          <div
            className="ann-hero-grid"
            aria-hidden="true"
          />

          <div className="container-xl">

            <div className="ann-breadcrumb">
              <Link to="/">
                Home
              </Link>

              <i
                className="fas fa-chevron-right"
                aria-hidden="true"
              />

              <span>
                Announcements
              </span>
            </div>

            <div className="ann-hero-layout">

              <div className="ann-hero-copy">

                <span className="ann-eyebrow">
                  <span className="ann-eyebrow-dot" />
                  CCAST Bambili Newsroom
                </span>

                <h1>
                  Announcements
                  <span>.</span>
                </h1>

                <p>
                  Stay informed about important academic updates,
                  school activities, deadlines, events and opportunities
                  at CCAST Bambili.
                </p>

                <div className="ann-hero-meta">

                  <div className="ann-hero-meta-item">
                    <span className="ann-hero-meta-icon">
                      <i className="fas fa-bullhorn" />
                    </span>

                    <div>
                      <strong>
                        {items.length}
                      </strong>

                      <small>
                        Published updates
                      </small>
                    </div>
                  </div>

                  <div className="ann-hero-divider" />

                  <div className="ann-hero-meta-item">
                    <span className="ann-hero-meta-icon">
                      <i className="fas fa-thumbtack" />
                    </span>

                    <div>
                      <strong>
                        {items.filter((item) => item.pinned).length}
                      </strong>

                      <small>
                        Important updates
                      </small>
                    </div>
                  </div>

                </div>

              </div>

              <div className="ann-hero-visual">
                <div className="ann-hero-card">

                  <div className="ann-hero-card-icon">
                    <i className="fas fa-newspaper" />
                  </div>

                  <div className="ann-hero-card-content">
                    <span>
                      CCAST Bambili
                    </span>

                    <strong>
                      Latest Updates
                    </strong>

                    <p>
                      Academic news, events and important
                      notices — all in one place.
                    </p>
                  </div>

                  <div className="ann-hero-card-arrow">
                    <i className="fas fa-arrow-down" />
                  </div>

                </div>
              </div>

            </div>

          </div>
        </header>


        {/* =====================================================
            CONTENT
        ===================================================== */}

        <section
          className="ann-content"
          aria-label="CCAST announcements"
        >

          <div className="container-xl">

            {/* =================================================
                SEARCH / FILTER
            ================================================= */}

            <div className="ann-toolbar rv-t">

              <div className="ann-search">

                <i
                  className="fas fa-magnifying-glass"
                  aria-hidden="true"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search announcements..."
                  aria-label="Search announcements"
                />

                {search && (
                  <button
                    type="button"
                    className="ann-search-clear"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                  >
                    <i className="fas fa-xmark" />
                  </button>
                )}

              </div>

              <div className="ann-filter">

                <span className="ann-filter-label">
                  <i className="fas fa-filter" />
                  Filter
                </span>

                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                  aria-label="Filter announcements by category"
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item === "All"
                        ? "All categories"
                        : item}
                    </option>
                  ))}
                </select>

              </div>

            </div>


            {/* =================================================
                RESULTS SUMMARY
            ================================================= */}

            <div className="ann-results-bar">

              <p>
                Showing{" "}
                <strong>
                  {filteredItems.length}
                </strong>{" "}
                {filteredItems.length === 1
                  ? "announcement"
                  : "announcements"}
              </p>

              {(search || category !== "All") && (
                <button
                  type="button"
                  className="ann-reset"
                  onClick={() => {
                    setSearch("");
                    setCategory("All");
                  }}
                >
                  <i className="fas fa-rotate-left" />
                  Reset filters
                </button>
              )}

            </div>


            {/* =================================================
                EMPTY STATE
            ================================================= */}

            {filteredItems.length === 0 && (
              <div className="ann-empty rv-t">

                <div className="ann-empty-icon">
                  <i className="fas fa-magnifying-glass" />
                </div>

                <h2>
                  No announcements found
                </h2>

                <p>
                  We couldn't find any announcements matching
                  your search or selected category.
                </p>

                <button
                  type="button"
                  className="ann-btn ann-btn-secondary"
                  onClick={() => {
                    setSearch("");
                    setCategory("All");
                  }}
                >
                  Clear filters
                </button>

              </div>
            )}


            {/* =================================================
                FEATURED / PINNED
            ================================================= */}

            {featuredItems.length > 0 && (
              <section
                className="ann-featured-section"
                aria-labelledby="ann-featured-title"
              >

                <div className="ann-section-heading rv-t">

                  <div>
                    <span className="ann-section-kicker">
                      <i className="fas fa-thumbtack" />
                      Important Updates
                    </span>

                    <h2 id="ann-featured-title">
                      Featured announcements
                    </h2>

                    <p>
                      Important information from CCAST Bambili
                      that you shouldn't miss.
                    </p>
                  </div>

                  <span className="ann-section-count">
                    {featuredItems.length}
                  </span>

                </div>


                <div className="ann-featured-grid">

                  {featuredItems.map((a, index) => (
                    <Link
                      key={a.slug}
                      to={`/announcements/${a.slug}`}
                      className="ann-featured-card rv-t"
                      style={{
                        transitionDelay: `${index * 100}ms`,
                      }}
                    >

                      <div className="ann-featured-accent" />

                      <div className="ann-card-top">

                        <span className="ann-pinned">
                          <i className="fas fa-thumbtack" />
                          Pinned
                        </span>

                        <span className="ann-date">
                          <i className="far fa-calendar" />
                          {fmtDate(a.published_at)}
                        </span>

                      </div>

                      <div className="ann-featured-icon">
                        <i className="fas fa-bullhorn" />
                      </div>

                      <span className="ann-category">
                        {getCategory(a)}
                      </span>

                      <h3>
                        {a.title}
                      </h3>

                      <p>
                        {getExcerpt(a)}
                      </p>

                      <div className="ann-read-more">
                        Read announcement

                        <span>
                          <i className="fas fa-arrow-right" />
                        </span>
                      </div>

                    </Link>
                  ))}

                </div>

              </section>
            )}


            {/* =================================================
                ALL ANNOUNCEMENTS
            ================================================= */}

            {regularItems.length > 0 && (
              <section
                className="ann-all-section"
                aria-labelledby="ann-all-title"
              >

                <div className="ann-section-heading rv-t">

                  <div>
                    <span className="ann-section-kicker">
                      <i className="fas fa-newspaper" />
                      Latest News
                    </span>

                    <h2 id="ann-all-title">
                      All announcements
                    </h2>

                    <p>
                      Browse the latest news and updates from
                      the CCAST community.
                    </p>
                  </div>

                </div>


                <div className="ann-grid">

                  {regularItems.map((a, index) => (
                    <Link
                      key={a.slug}
                      to={`/announcements/${a.slug}`}
                      className="ann-card rv-t"
                      style={{
                        transitionDelay: `${(index % 3) * 80}ms`,
                      }}
                    >

                      <div className="ann-card-top">

                        <span className="ann-category">
                          {getCategory(a)}
                        </span>

                        <span className="ann-date">
                          <i className="far fa-calendar" />
                          {fmtDate(a.published_at)}
                        </span>

                      </div>

                      <div className="ann-card-icon">
                        <i className="fas fa-newspaper" />
                      </div>

                      <h3>
                        {a.title}
                      </h3>

                      <p>
                        {getExcerpt(a)}
                      </p>

                      <div className="ann-read-more">
                        Read more

                        <span>
                          <i className="fas fa-arrow-right" />
                        </span>
                      </div>

                    </Link>
                  ))}

                </div>

              </section>
            )}

          </div>

        </section>

      </main>

      <SiteFooter />

    </div>
  );
};

export default AnnouncementsPage;