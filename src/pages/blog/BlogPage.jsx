import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import SiteNavbar from "../../components/site/SiteNavbar";
import SiteFooter from "../../components/site/SiteFooter";
import useRevealOnScroll from "../../hooks/useRevealOnScroll";
import { usePosts } from "../../api/public";

import "../../styles/site.css";
import "./Blog.css";

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

function getCategoryIcon(category = "") {
  const value = category.toLowerCase();

  if (value.includes("academic")) return "fa-graduation-cap";
  if (value.includes("event")) return "fa-calendar-star";
  if (value.includes("school")) return "fa-school";
  if (value.includes("student")) return "fa-user-graduate";
  if (value.includes("technology")) return "fa-microchip";
  if (value.includes("sport")) return "fa-futbol";
  if (value.includes("news")) return "fa-newspaper";
  if (value.includes("community")) return "fa-people-group";
  if (value.includes("achievement")) return "fa-trophy";
  if (value.includes("announcement")) return "fa-bullhorn";

  return "fa-newspaper";
}


/* ============================================================
   SVG PLACEHOLDER
============================================================ */

const generateSVGPlaceholder = (
  title = "CCAST Blog",
  width = 1200,
  height = 750
) => {
  const safeTitle = String(title)
    .replace(/[<>&'"]/g, "")
    .slice(0, 42);

  const encodedTitle = encodeURIComponent(safeTitle);

  return `
    data:image/svg+xml;charset=UTF-8,
    %3Csvg xmlns="http://www.w3.org/2000/svg"
      width="${width}"
      height="${height}"
      viewBox="0 0 ${width} ${height}"%3E

      %3Cdefs%3E
        %3ClinearGradient id="bg"
          x1="0%25"
          y1="0%25"
          x2="100%25"
          y2="100%25"%3E

          %3Cstop offset="0%25"
            stop-color="%23071932"/%3E

          %3Cstop offset="52%25"
            stop-color="%230d3159"/%3E

          %3Cstop offset="100%25"
            stop-color="%230d6efd"/%3E
        %3C/linearGradient%3E

        %3CradialGradient id="glow"%3E
          %3Cstop offset="0%25"
            stop-color="%23ffffff"
            stop-opacity=".15"/%3E
          %3Cstop offset="100%25"
            stop-color="%23ffffff"
            stop-opacity="0"/%3E
        %3C/radialGradient%3E
      %3C/defs%3E

      %3Crect
        width="100%25"
        height="100%25"
        fill="url(%23bg)"/%3E

      %3Ccircle
        cx="${width * 0.82}"
        cy="${height * 0.18}"
        r="${height * 0.42}"
        fill="url(%23glow)"/%3E

      %3Cpath
        d="M0 ${height * 0.82}
           C${width * 0.25} ${height * 0.65},
           ${width * 0.42} ${height * 0.98},
           ${width} ${height * 0.68}"
        fill="none"
        stroke="rgba(255,255,255,.08)"
        stroke-width="3"/%3E

      %3Crect
        x="${width * 0.055}"
        y="${height * 0.055}"
        width="${width * 0.89}"
        height="${height * 0.89}"
        rx="22"
        fill="none"
        stroke="rgba(255,255,255,.12)"
        stroke-width="2"/%3E

      %3Ctext
        x="50%25"
        y="47%25"
        fill="white"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="${Math.min(width, height) * 0.065}"
        font-weight="700"%3E
        ${encodedTitle}
      %3C/text%3E

      %3Ctext
        x="50%25"
        y="58%25"
        fill="rgba(255,255,255,.58)"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="${Math.min(width, height) * 0.028}"
        letter-spacing="3"%3E
        CCAST BAMBILI • COMMUNITY STORIES
      %3C/text%3E

    %3C/svg%3E
  `.replace(/\s+/g, " ");
};

function getImageUrl(imageUrl, title = "Blog Post") {
  if (
    typeof imageUrl === "string" &&
    imageUrl.trim() !== ""
  ) {
    return imageUrl;
  }

  return generateSVGPlaceholder(title);
}


/* ============================================================
   IMAGE
============================================================ */

const BlogImage = ({
  src,
  title,
  className = "",
  loading = "lazy",
}) => {
  const [loaded, setLoaded] = useState(false);

  const fallback = generateSVGPlaceholder(title);

  return (
    <img
      src={getImageUrl(src, title)}
      alt={title}
      loading={loading}
      className={`${className} ${loaded ? "is-loaded" : ""}`}
      onLoad={() => setLoaded(true)}
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = fallback;
        setLoaded(true);
      }}
    />
  );
};


/* ============================================================
   META
============================================================ */

const BlogMeta = ({
  post,
  compact = false,
}) => {
  return (
    <div className={`blog-meta ${compact ? "blog-meta--compact" : ""}`}>
      {post.author && (
        <span>
          <i className="far fa-user" aria-hidden="true" />
          {post.author}
        </span>
      )}

      {post.published_at && (
        <span>
          <i className="far fa-calendar" aria-hidden="true" />
          {fmtDate(post.published_at)}
        </span>
      )}

      {post.read_minutes && (
        <span>
          <i className="far fa-clock" aria-hidden="true" />
          {post.read_minutes} min read
        </span>
      )}
    </div>
  );
};


/* ============================================================
   BLOG PAGE
============================================================ */

const BlogPage = () => {
  useRevealOnScroll();

  const {
    data: posts = [],
    isLoading,
    isError,
  } = usePosts();

  const [activeCat, setActiveCat] = useState("All");

  const categories = useMemo(() => {
    const values = posts
      .map((post) => post.category)
      .filter(Boolean);

    return [
      "All",
      ...Array.from(new Set(values)),
    ];
  }, [posts]);

  const filtered = useMemo(() => {
    if (activeCat === "All") {
      return posts;
    }

    return posts.filter(
      (post) => post.category === activeCat
    );
  }, [posts, activeCat]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="hp blog-page">
      <SiteNavbar />

      {/* ======================================================
          PAGE HERO
      ====================================================== */}

      <header className="hp-page-hero blog-page-hero">
        <div
          className="hp-page-hero-grid"
          aria-hidden="true"
        />

        <div className="container-xl">
          <div className="hp-page-crumb">
            <Link to="/">Home</Link>

            <i
              className="fas fa-chevron-right"
              aria-hidden="true"
            />

            <span>Blog</span>
          </div>

          <div className="blog-hero-kicker">
            <span>
              <i
                className="fas fa-newspaper"
                aria-hidden="true"
              />
            </span>

            CCAST Journal
          </div>

          <h1 className="hp-page-title">
            From Our Community
          </h1>

          <p className="hp-page-sub">
            Stories, insights, achievements and updates
            from across the CCAST Bambili community.
          </p>

          {!isLoading && !isError && posts.length > 0 && (
            <div className="blog-hero-stats">
              <span>
                <strong>{posts.length}</strong>
                Published stories
              </span>

              <span className="blog-hero-stat-divider" />

              <span>
                <strong>{categories.length - 1}</strong>
                Categories
              </span>
            </div>
          )}
        </div>
      </header>


      {/* ======================================================
          CONTENT
      ====================================================== */}

      <main className="blog-main">
        <div className="container-xl">

          {/* Loading */}

          {isLoading && (
            <div className="blog-state blog-state--loading">
              <div className="blog-state-icon">
                <i className="fas fa-spinner fa-spin" />
              </div>

              <h2>Loading stories</h2>

              <p>
                Please wait while we retrieve the latest
                CCAST community stories.
              </p>
            </div>
          )}


          {/* Error */}

          {isError && (
            <div className="blog-state blog-state--error">
              <div className="blog-state-icon">
                <i className="fas fa-triangle-exclamation" />
              </div>

              <h2>Unable to load the blog</h2>

              <p>
                We couldn't retrieve the latest posts.
                Please check your connection and try again.
              </p>

              <button
                type="button"
                className="blog-state-btn"
                onClick={() => window.location.reload()}
              >
                <i className="fas fa-rotate-right" />
                Try again
              </button>
            </div>
          )}


          {/* Content */}

          {!isLoading &&
            !isError &&
            posts.length > 0 && (
              <>
                {/* ==================================================
                    FILTERS
                ================================================== */}

                <section
                  className="blog-toolbar"
                  aria-label="Blog categories"
                >
                  <div>
                    <span className="blog-toolbar-label">
                      Explore
                    </span>

                    <h2>
                      Latest stories
                    </h2>
                  </div>

                  <div
                    className="blog-filters"
                    role="tablist"
                    aria-label="Filter blog posts"
                  >
                    {categories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        role="tab"
                        aria-selected={
                          activeCat === category
                        }
                        className={`blog-filter ${
                          activeCat === category
                            ? "blog-filter--active"
                            : ""
                        }`}
                        onClick={() =>
                          setActiveCat(category)
                        }
                      >
                        {category === "All" && (
                          <i className="fas fa-grid-2 me-1" />
                        )}

                        {category !== "All" && (
                          <i
                            className={`fas ${getCategoryIcon(
                              category
                            )} me-1`}
                          />
                        )}

                        {category}
                      </button>
                    ))}
                  </div>
                </section>


                {/* ==================================================
                    FEATURED
                ================================================== */}

                {featured ? (
                  <Link
                    to={`/blog/${featured.slug}`}
                    className="blog-feature rv-t"
                  >
                    <div className="blog-feature-img">
                      <BlogImage
                        src={featured.cover_image}
                        title={featured.title}
                        className="blog-image"
                        loading="eager"
                      />

                      <div className="blog-feature-image-overlay" />

                      {featured.category && (
                        <span className="blog-feature-cat">
                          <i
                            className={`fas ${getCategoryIcon(
                              featured.category
                            )}`}
                          />

                          {featured.category}
                        </span>
                      )}

                      <span className="blog-feature-badge">
                        <i className="fas fa-star" />
                        Featured
                      </span>
                    </div>

                    <div className="blog-feature-body">
                      <div className="blog-feature-label">
                        Latest from CCAST
                      </div>

                      <h2 className="blog-feature-t">
                        {featured.title}
                      </h2>

                      {featured.excerpt && (
                        <p className="blog-feature-ex">
                          {featured.excerpt}
                        </p>
                      )}

                      <BlogMeta post={featured} />

                      <span className="blog-feature-link">
                        Read full story

                        <span>
                          <i className="fas fa-arrow-right" />
                        </span>
                      </span>
                    </div>
                  </Link>
                ) : (
                  <div className="blog-state">
                    <div className="blog-state-icon">
                      <i className="fas fa-folder-open" />
                    </div>

                    <h2>
                      No posts in this category
                    </h2>

                    <p>
                      There are currently no published
                      stories in this category.
                    </p>
                  </div>
                )}


                {/* ==================================================
                    POST GRID
                ================================================== */}

                {rest.length > 0 && (
                  <section
                    className="blog-grid-section"
                    aria-label="More blog posts"
                  >
                    <div className="blog-grid-heading">
                      <div>
                        <span>
                          Continue exploring
                        </span>

                        <h2>
                          More stories
                        </h2>
                      </div>

                      <div className="blog-grid-count">
                        {rest.length}{" "}
                        {rest.length === 1
                          ? "story"
                          : "stories"}
                      </div>
                    </div>

                    <div className="blog-grid">
                      {rest.map((post, index) => (
                        <Link
                          key={post.slug}
                          to={`/blog/${post.slug}`}
                          className="blog-card rv-t"
                          style={{
                            transitionDelay: `${
                              (index % 3) * 80
                            }ms`,
                          }}
                        >
                          <div className="blog-card-img">
                            <BlogImage
                              src={post.cover_image}
                              title={post.title}
                            />

                            <div className="blog-card-image-overlay" />

                            {post.category && (
                              <span className="blog-card-cat">
                                <i
                                  className={`fas ${getCategoryIcon(
                                    post.category
                                  )}`}
                                />

                                {post.category}
                              </span>
                            )}
                          </div>

                          <div className="blog-card-body">
                            <BlogMeta
                              post={post}
                              compact
                            />

                            <h3 className="blog-card-t">
                              {post.title}
                            </h3>

                            {post.excerpt && (
                              <p className="blog-card-ex">
                                {post.excerpt}
                              </p>
                            )}

                            <span className="blog-card-link">
                              Continue reading

                              <span>
                                <i className="fas fa-arrow-right" />
                              </span>
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}


          {/* No posts */}

          {!isLoading &&
            !isError &&
            posts.length === 0 && (
              <div className="blog-state">
                <div className="blog-state-icon">
                  <i className="fas fa-newspaper" />
                </div>

                <h2>
                  No stories published yet
                </h2>

                <p>
                  Check back soon for news, insights and
                  community updates from CCAST Bambili.
                </p>
              </div>
            )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default BlogPage;