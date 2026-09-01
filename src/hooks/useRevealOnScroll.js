import { useEffect } from "react";

/**
 * Fades/slides any element with the `.rv-t` class into view as it scrolls
 * into the viewport. Call once per page component (top of the function body).
 */
export default function useRevealOnScroll() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("rv");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.06, rootMargin: "0px 0px -40px 0px" },
    );
    document.querySelectorAll(".rv-t").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}