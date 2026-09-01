import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import SiteNavbar from "../../components/site/SiteNavbar";
import SiteFooter from "../../components/site/SiteFooter";

import {
  usePost,
  usePosts,
} from "../../api/public";

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
    month: "long",
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
   PLACEHOLDER
============================================================ */

const generateSVGPlaceholder = (
  title = "CCAST Blog",
  width = 1400,
  height = 800
) => {
  const safeTitle = String(title)
    .replace(/[<>&'"]/g, "")
    .slice(0, 45);

  return `
    data:image/svg+xml;charset=UTF-8,
    %3Csvg xmlns="http://www.w3.org/2000/svg"
      width="${width}"
      height="${height}"
      viewBox="0 0 ${width} ${height}"%3E

      %3Cdefs%3E
        %3ClinearGradient id="g"
          x1="0%25"
          y1="0%25"
          x2="100%25"
          y2="100%25"%3E

          %3Cstop
            offset="0%25"
            stop-color="%23071932"/%3E

          %3Cstop
            offset="55%25"
            stop-color="%230d3159"/%3E

          %3Cstop
            offset="100%25"
            stop-color="%230d6efd"/%3E
        %3C/linearGradient%3E
      %3C/defs%3E

      %3Crect
        width="100%25"
        height="100%25"
        fill="url(%23g)"/%3E

      %3Crect
        x="5%25"
        y="7%25"
        width="90%25"
        height="86%25"
        rx="28"
        fill="none"
        stroke="rgba(255,255,255,.12)"
        stroke-width="3"/%3E

      %3Ctext
        x="50%25"
        y="47%25"
        fill="white"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="${Math.min(width, height) * 0.065}"
        font-weight="700"%3E
        ${encodeURIComponent(safeTitle)}
      %3C/text%3E

      %3Ctext
        x="50%25"
        y="58%25"
        fill="rgba(255,255,255,.58)"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="${Math.min(width, height) * 0.027}"
        letter-spacing="3"%3E
        CCAST BAMBILI
      %3C/text%3E

    %3C/svg%3E
  `.replace(/\s+/g, " ");
};

function getImageUrl(imageUrl, title) {
  if (
    typeof imageUrl === "string" &&
    imageUrl.trim() !== ""
  ) {
    return imageUrl;
  }

  return generateSVGPlaceholder(title);
}


/* ============================================================
   SHARE
============================================================ */

const ShareArticle = ({ post }) => {
  const [copied, setCopied] = useState(false);

  const shareUrl = window.location.href;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text:
            post.excerpt ||
            "CCAST Bambili community story",
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
      // User cancelled share.
    }
  };

  return (
    <div className="blog-share">
      <div className="blog-share-label">
        <span>
          <i
            className="fas fa-share-nodes"
            aria-hidden="true"
          />
        </span>

        <div>
          <strong>Share this story</strong>
          <small>Help others discover it</small>
        </div>
      </div>

      <button
        type="button"
        className="blog-share-btn"
        onClick={handleShare}
        title={
          copied
            ? "Link copied"
            : "Share article"
        }
        aria-label={
          copied
            ? "Link copied"
            : "Share article"
        }
      >
        <i
          className={
            copied
              ? "fas fa-check"
              : "fas fa-share-nodes"
          }
        />

        <span>
          {copied ? "Copied" : "Share"}
        </span>
      </button>
    </div>
  );
};


/* ============================================================
   ARTICLE PAGE
============================================================ */

const BlogPostPage = () => {
  const { slug } = useParams();

  const {
    data: post,
    isLoading,
    isError,
  } = usePost(slug);

  const {
    data: allPosts = [],
  } = usePosts();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [slug]);


  /* ==========================================================
     RELATED POSTS
  ========================================================== */

  const relatedPosts = useMemo(() => {
    if (!post || !Array.isArray(allPosts)) {
      return [];
    }

    const sameCategory = allPosts.filter(
      (item) =>
        item.slug !== post.slug &&
        item.category &&
        post.category &&
        item.category.toLowerCase() ===
          post.category.toLowerCase()
    );

    const others = allPosts.filter(
      (item) =>
        item.slug !== post.slug &&
        !sameCategory.some(
          (related) =>
            related.slug === item.slug
        )
    );

    return [
      ...sameCategory,
      ...others,
    ].slice(0, 3);
  }, [post, allPosts]);


  /* ==========================================================
     BODY
  ========================================================== */

  const paragraphs = (post?.body || "")
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);


  return (
    <div className="hp blog-page blog-post-page">
      <SiteNavbar />

      {/* ======================================================
          LOADING
      ====================================================== */}

      {isLoading && (
        <main className="blog-detail-state">
          <div className="container-xl">
            <div className="blog-state">
              <div className="blog-state-icon">
                <i className="fas fa-spinner fa-spin" />
              </div>

              <h2>
                Loading story
              </h2>

              <p>
                Please wait while we retrieve this
                CCAST community story.
              </p>
            </div>
          </div>
        </main>
      )}


      {/* ======================================================
          ERROR
      ====================================================== */}

      {isError && (
        <main className="blog-detail-state">
          <div className="container-xl">
            <div className="blog-state blog-state--error">
              <div className="blog-state-icon">
                <i className="fas fa-file-circle-xmark" />
              </div>

              <h2>
                Story not found
              </h2>

              <p>
                This blog post may have been removed,
                unpublished, or the link may be incorrect.
              </p>

              <Link
                to="/blog"
                className="blog-state-btn"
              >
                <i className="fas fa-arrow-left" />
                Back to blog
              </Link>
            </div>
          </div>
        </main>
      )}


      {/* ======================================================
          ARTICLE
      ====================================================== */}

      {post && (
        <main className="blog-detail">

          <article>

            {/* ==================================================
                HERO
            ================================================== */}

            <header className="blog-article-hero">

              <img
                src={getImageUrl(
                  post.cover_image,
                  post.title
                )}
                alt={post.title}
                className="blog-article-cover"
              />

              <div className="blog-article-overlay" />

              <div
                className="blog-article-pattern"
                aria-hidden="true"
              />

              <div className="container-xl blog-article-hero-inner">

                <div className="hp-page-crumb">
                  <Link to="/">
                    Home
                  </Link>

                  <i
                    className="fas fa-chevron-right"
                    aria-hidden="true"
                  />

                  <Link to="/blog">
                    Blog
                  </Link>

                  <i
                    className="fas fa-chevron-right"
                    aria-hidden="true"
                  />

                  <span>
                    Story
                  </span>
                </div>


                {post.category && (
                  <span className="blog-article-cat">
                    <i
                      className={`fas ${getCategoryIcon(
                        post.category
                      )}`}
                    />

                    {post.category}
                  </span>
                )}


                <h1 className="blog-article-title">
                  {post.title}
                </h1>


                <div className="blog-article-meta">

                  {post.author && (
                    <span>
                      <i
                        className="far fa-user"
                        aria-hidden="true"
                      />

                      {post.author}
                    </span>
                  )}

                  {post.published_at && (
                    <span>
                      <i
                        className="far fa-calendar"
                        aria-hidden="true"
                      />

                      {fmtDate(
                        post.published_at
                      )}
                    </span>
                  )}

                  {post.read_minutes && (
                    <span>
                      <i
                        className="far fa-clock"
                        aria-hidden="true"
                      />

                      {post.read_minutes} min read
                    </span>
                  )}

                </div>

              </div>
            </header>


            {/* ==================================================
                ARTICLE CONTENT
            ================================================== */}

            <div className="blog-article-content">

              <div className="container-xl">

                <div className="blog-article-layout">

                  <div className="blog-article-body">

                    {post.excerpt && (
                      <p className="blog-article-lead">
                        {post.excerpt}
                      </p>
                    )}

                    <div className="blog-article-copy">
                      {paragraphs.length > 0 ? (
                        paragraphs.map(
                          (paragraph, index) => (
                            <p key={index}>
                              {paragraph}
                            </p>
                          )
                        )
                      ) : (
                        <p>
                          This story does not contain
                          additional content.
                        </p>
                      )}
                    </div>


                    <ShareArticle post={post} />


                    <footer className="blog-article-foot">

                      <Link
                        to="/blog"
                        className="blog-back"
                      >
                        <span>
                          <i className="fas fa-arrow-left" />
                        </span>

                        Back to all stories
                      </Link>

                    </footer>

                  </div>

                </div>

              </div>
            </div>

          </article>


          {/* ==================================================
              RELATED STORIES
          ================================================== */}

          {relatedPosts.length > 0 && (
            <section
              className="blog-related"
              aria-labelledby="related-stories"
            >
              <div className="container-xl">

                <div className="blog-related-heading">

                  <div>
                    <span>
                      Continue reading
                    </span>

                    <h2 id="related-stories">
                      More from CCAST
                    </h2>
                  </div>

                  <Link to="/blog">
                    View all stories
                    <i className="fas fa-arrow-right" />
                  </Link>

                </div>


                <div className="blog-grid blog-related-grid">

                  {relatedPosts.map((item, index) => (
                    <Link
                      key={item.slug}
                      to={`/blog/${item.slug}`}
                      className="blog-card rv-t"
                      style={{
                        transitionDelay: `${
                          index * 80
                        }ms`,
                      }}
                    >

                      <div className="blog-card-img">

                        <img
                          src={getImageUrl(
                            item.cover_image,
                            item.title
                          )}
                          alt={item.title}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.onerror =
                              null;

                            event.currentTarget.src =
                              generateSVGPlaceholder(
                                item.title
                              );
                          }}
                        />

                        <div className="blog-card-image-overlay" />

                        {item.category && (
                          <span className="blog-card-cat">
                            <i
                              className={`fas ${getCategoryIcon(
                                item.category
                              )}`}
                            />

                            {item.category}
                          </span>
                        )}

                      </div>


                      <div className="blog-card-body">

                        <div className="blog-meta blog-meta--compact">

                          <span>
                            <i className="far fa-calendar" />

                            {fmtDate(
                              item.published_at
                            )}
                          </span>

                          {item.read_minutes && (
                            <span>
                              <i className="far fa-clock" />

                              {item.read_minutes} min
                            </span>
                          )}

                        </div>


                        <h3 className="blog-card-t">
                          {item.title}
                        </h3>


                        {item.excerpt && (
                          <p className="blog-card-ex">
                            {item.excerpt}
                          </p>
                        )}


                        <span className="blog-card-link">
                          Read story

                          <span>
                            <i className="fas fa-arrow-right" />
                          </span>
                        </span>

                      </div>

                    </Link>
                  ))}

                </div>

              </div>
            </section>
          )}

        </main>
      )}

      <SiteFooter />
    </div>
  );
};

export default BlogPostPage;