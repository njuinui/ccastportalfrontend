import React from "react";
import { Link } from "react-router-dom";

import "./StudentLifePage.css";

const ACTIVITIES = [
  {
    icon: "bi-trophy-fill",
    category: "Sports",
    title: "Sports & Athletics",
    description:
      "Students participate in football, basketball, athletics and other sporting activities that promote teamwork, discipline and healthy living.",
  },

  {
    icon: "bi-cpu-fill",
    category: "Innovation",
    title: "ICT & Digital Innovation",
    description:
      "Our students explore programming, computer applications, robotics, digital literacy and technology-based projects.",
  },

  {
    icon: "bi-flask-fill",
    category: "STEM",
    title: "Science & Practical Work",
    description:
      "Science students learn through practical experiments, laboratory sessions, demonstrations and research activities.",
  },

  {
    icon: "bi-music-note-beamed",
    category: "Culture",
    title: "Music & Performing Arts",
    description:
      "Students discover and develop their talents through music, drama, cultural performances and creative arts.",
  },

  {
    icon: "bi-people-fill",
    category: "Leadership",
    title: "Student Leadership",
    description:
      "Leadership programmes give students opportunities to develop responsibility, communication skills and confidence.",
  },

  {
    icon: "bi-book-half",
    category: "Academics",
    title: "Academic Clubs",
    description:
      "Students participate in subject-based clubs, debates, quizzes, competitions and peer-learning activities.",
  },

  {
    icon: "bi-tree-fill",
    category: "Community",
    title: "Community Outreach",
    description:
      "Students participate in activities designed to build social responsibility, environmental awareness and community spirit.",
  },

  {
    icon: "bi-map-fill",
    category: "Exploration",
    title: "Educational Excursions",
    description:
      "Educational visits expose students to institutions, industries, cultural locations and practical learning environments.",
  },

  {
    icon: "bi-megaphone-fill",
    category: "Communication",
    title: "Debate & Public Speaking",
    description:
      "Debates, public speaking and presentation activities help students develop confidence, critical thinking and communication skills.",
  },
];

const StudentLifePage = () => {
  return (
    <div className="student-life-page">
      {/* HERO */}

      <section className="student-life-hero">
        <div className="container-xl">
          <div className="student-life-hero-content">
            <span className="student-life-eyebrow">
              <i className="bi bi-stars me-2" />

              Beyond The Classroom
            </span>

            <h1>
              Student Life at CCAST
            </h1>

            <p>
              School life is more than lessons and
              examinations. Our students learn,
              compete, create, lead, collaborate and
              discover their talents every day.
            </p>

            <div className="student-life-actions">
              <a
                href="#activities"
                className="btn btn-light btn-lg"
              >
                Explore Activities

                <i className="bi bi-arrow-down ms-2" />
              </a>

              <Link
                to="/contact"
                className="btn btn-outline-light btn-lg"
              >
                Contact the School
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* INTRO */}

      <section className="student-life-intro">
        <div className="container-xl">
          <div className="student-life-intro-grid">
            <div>
              <span className="student-life-section-label">
                Life at CCAST
              </span>

              <h2>
                Developing the whole student
              </h2>
            </div>

            <div>
              <p>
                We believe students should have
                opportunities to develop academically,
                socially, physically and creatively.
                Our extracurricular programmes
                complement classroom learning and help
                students become confident, responsible
                and well-rounded individuals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ACTIVITIES */}

      <section
        className="student-life-activities"
        id="activities"
      >
        <div className="container-xl">
          <div className="student-life-section-heading">
            <span className="student-life-section-label">
              Explore
            </span>

            <h2>
              Activities & Experiences
            </h2>

            <p>
              Discover some of the activities that
              make life at CCAST Bambili engaging,
              practical and memorable.
            </p>
          </div>

          <div className="student-life-grid">
            {ACTIVITIES.map((activity) => (
              <article
                className="student-life-card"
                key={activity.title}
              >
                <div className="student-life-card-icon">
                  <i
                    className={`bi ${activity.icon}`}
                    aria-hidden="true"
                  />
                </div>

                <span className="student-life-card-category">
                  {activity.category}
                </span>

                <h3>
                  {activity.title}
                </h3>

                <p>
                  {activity.description}
                </p>

                <span className="student-life-card-arrow">
                  Discover more

                  <i className="bi bi-arrow-right ms-2" />
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}

      <section className="student-life-cta">
        <div className="container-xl">
          <div className="student-life-cta-card">
            <div>
              <span>
                Join the CCAST community
              </span>

              <h2>
                Give your child an environment
                where they can grow.
              </h2>

              <p>
                Academic excellence, character,
                leadership, creativity and practical
                experiences come together at CCAST
                Bambili.
              </p>
            </div>

            <Link
              to="/admission"
              className="student-life-cta-button"
            >
              Explore Admission

              <i className="bi bi-arrow-right ms-2" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StudentLifePage;