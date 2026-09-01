import React, {
    useMemo,
    useState,
    useEffect,
} from "react";

import {
    Link,
    useSearchParams,
} from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import "./AcademicResultsPage.css";

/*
|--------------------------------------------------------------------------
| RESULTS DATA WITH STUDENT PERFORMANCE
|--------------------------------------------------------------------------
*/

// Generate mock students for each class
const generateStudents = (className, stream, count) => {
    const firstNames = ["John", "Mary", "Peter", "Sarah", "Michael", "Emma", "David", "Grace", "James", "Joy", "Samuel", "Ruth", "Daniel", "Esther", "Joseph", "Deborah", "Joshua", "Rachel", "Benjamin", "Hannah"];
    const lastNames = ["Ndi", "Tata", "Neba", "Fong", "Awah", "Nchinda", "Akwo", "Tantoh", "Nfor", "Fonyuy", "Tia", "Ako", "Nya", "Titi", "Ngang", "Fon", "Nkem", "Tanyi", "Ndam", "Nkwain"];

    return Array.from({ length: count }, (_, i) => {
        const firstName = firstNames[i % firstNames.length];
        const lastName = lastNames[(i * 3) % lastNames.length];
        const totalSubjects = Math.floor(Math.random() * 5) + 7;
        const passedSubjects = Math.floor(Math.random() * (totalSubjects - 2)) + 4;
        const average = Math.round((passedSubjects / totalSubjects) * 100);
        const hasDistinction = average >= 80;

        return {
            id: `STU-${2024}-${String(i + 1).padStart(4, '0')}`,
            name: `${firstName} ${lastName}`,
            gender: i % 2 === 0 ? 'Male' : 'Female',
            totalSubjects,
            passedSubjects,
            average,
            grade: average >= 85 ? 'A' : average >= 75 ? 'B' : average >= 65 ? 'C' : 'D',
            hasDistinction,
            position: i + 1,
            subjects: [
                { name: 'Mathematics', score: Math.floor(Math.random() * 30) + 70 },
                { name: 'English', score: Math.floor(Math.random() * 30) + 65 },
                { name: 'Biology', score: Math.floor(Math.random() * 35) + 60 },
                { name: 'Chemistry', score: Math.floor(Math.random() * 30) + 65 },
                { name: 'Physics', score: Math.floor(Math.random() * 30) + 60 },
                { name: 'ICT', score: Math.floor(Math.random() * 30) + 70 },
            ],
        };
    });
};

const RESULTS = [
    {
        year: "2024",
        overallPassRate: 96.4,
        overallAverage: 78.6,
        bestStudent: "Ako Emmanuel",
        bestStudentAverage: 94.2,
        totalStudents: 762,

        classes: [
            {
                className: "Form 5 Science A",
                stream: "Science",
                candidates: 64,
                passed: 62,
                passRate: 96.9,
                distinction: 16,
                classAverage: 82.4,
                bestStudent: "Ako Emmanuel",
                bestStudentAverage: 94.2,
                pdfUrl: "/results/2024-form-5-science.pdf",
                students: generateStudents("Form 5 Science A", "Science", 64),
            },
            {
                className: "Form 5 Science B",
                stream: "Science",
                candidates: 64,
                passed: 61,
                passRate: 95.3,
                distinction: 14,
                classAverage: 79.8,
                bestStudent: "Nfor Michael",
                bestStudentAverage: 91.5,
                pdfUrl: "/results/2024-form-5-science-b.pdf",
                students: generateStudents("Form 5 Science B", "Science", 64),
            },
            {
                className: "Form 5 Arts A",
                stream: "Arts",
                candidates: 56,
                passed: 53,
                passRate: 94.6,
                distinction: 11,
                classAverage: 76.3,
                bestStudent: "Tata Sarah",
                bestStudentAverage: 89.7,
                pdfUrl: "/results/2024-form-5-arts.pdf",
                students: generateStudents("Form 5 Arts A", "Arts", 56),
            },
            {
                className: "Form 5 Arts B",
                stream: "Arts",
                candidates: 56,
                passed: 54,
                passRate: 96.4,
                distinction: 13,
                classAverage: 78.1,
                bestStudent: "Awah Grace",
                bestStudentAverage: 90.2,
                pdfUrl: "/results/2024-form-5-arts-b.pdf",
                students: generateStudents("Form 5 Arts B", "Arts", 56),
            },
            {
                className: "Lower Sixth Science A",
                stream: "Science",
                candidates: 71,
                passed: 69,
                passRate: 97.2,
                distinction: 19,
                classAverage: 83.7,
                bestStudent: "Tantoh David",
                bestStudentAverage: 95.1,
                pdfUrl: "/results/2024-lower-sixth-science.pdf",
                students: generateStudents("Lower Sixth Science A", "Science", 71),
            },
            {
                className: "Lower Sixth Science B",
                stream: "Science",
                candidates: 71,
                passed: 68,
                passRate: 95.8,
                distinction: 19,
                classAverage: 81.2,
                bestStudent: "Nchinda Peter",
                bestStudentAverage: 92.8,
                pdfUrl: "/results/2024-lower-sixth-science-b.pdf",
                students: generateStudents("Lower Sixth Science B", "Science", 71),
            },
            {
                className: "Lower Sixth Arts A",
                stream: "Arts",
                candidates: 65,
                passed: 62,
                passRate: 95.4,
                distinction: 14,
                classAverage: 77.6,
                bestStudent: "Fonyuy Mary",
                bestStudentAverage: 88.9,
                pdfUrl: "/results/2024-lower-sixth-arts.pdf",
                students: generateStudents("Lower Sixth Arts A", "Arts", 65),
            },
            {
                className: "Lower Sixth Arts B",
                stream: "Arts",
                candidates: 65,
                passed: 63,
                passRate: 96.9,
                distinction: 15,
                classAverage: 78.3,
                bestStudent: "Akwo Joseph",
                bestStudentAverage: 89.5,
                pdfUrl: "/results/2024-lower-sixth-arts-b.pdf",
                students: generateStudents("Lower Sixth Arts B", "Arts", 65),
            },
            {
                className: "Upper Sixth Science A",
                stream: "Science",
                candidates: 66,
                passed: 64,
                passRate: 97.0,
                distinction: 21,
                classAverage: 84.5,
                bestStudent: "Nya James",
                bestStudentAverage: 96.3,
                pdfUrl: "/results/2024-upper-sixth-science.pdf",
                students: generateStudents("Upper Sixth Science A", "Science", 66),
            },
            {
                className: "Upper Sixth Science B",
                stream: "Science",
                candidates: 66,
                passed: 64,
                passRate: 97.0,
                distinction: 21,
                classAverage: 82.9,
                bestStudent: "Tia Samuel",
                bestStudentAverage: 93.6,
                pdfUrl: "/results/2024-upper-sixth-science-b.pdf",
                students: generateStudents("Upper Sixth Science B", "Science", 66),
            },
            {
                className: "Upper Sixth Arts A",
                stream: "Arts",
                candidates: 59,
                passed: 56,
                passRate: 94.9,
                distinction: 10,
                classAverage: 75.8,
                bestStudent: "Ngang Ruth",
                bestStudentAverage: 87.2,
                pdfUrl: "/results/2024-upper-sixth-arts.pdf",
                students: generateStudents("Upper Sixth Arts A", "Arts", 59),
            },
            {
                className: "Upper Sixth Arts B",
                stream: "Arts",
                candidates: 59,
                passed: 57,
                passRate: 96.6,
                distinction: 13,
                classAverage: 77.4,
                bestStudent: "Tanyi Daniel",
                bestStudentAverage: 88.4,
                pdfUrl: "/results/2024-upper-sixth-arts-b.pdf",
                students: generateStudents("Upper Sixth Arts B", "Arts", 59),
            },
        ],
    },
    {
        year: "2023",
        overallPassRate: 94.8,
        overallAverage: 76.2,
        bestStudent: "Fon Emmanuel",
        bestStudentAverage: 92.8,
        totalStudents: 698,

        classes: [
            {
                className: "Form 5 Science",
                stream: "Science",
                candidates: 120,
                passed: 114,
                passRate: 95.0,
                distinction: 28,
                classAverage: 80.1,
                bestStudent: "Fon Emmanuel",
                bestStudentAverage: 92.8,
                pdfUrl: "/results/2023-form-5-science.pdf",
                students: generateStudents("Form 5 Science", "Science", 120),
            },
            {
                className: "Form 5 Arts",
                stream: "Arts",
                candidates: 106,
                passed: 100,
                passRate: 94.3,
                distinction: 20,
                classAverage: 75.6,
                bestStudent: "Ndi Sarah",
                bestStudentAverage: 88.5,
                pdfUrl: "/results/2023-form-5-arts.pdf",
                students: generateStudents("Form 5 Arts", "Arts", 106),
            },
            {
                className: "Upper Sixth Science",
                stream: "Science",
                candidates: 126,
                passed: 120,
                passRate: 95.2,
                distinction: 34,
                classAverage: 81.8,
                bestStudent: "Neba Michael",
                bestStudentAverage: 93.1,
                pdfUrl: "/results/2023-upper-sixth-science.pdf",
                students: generateStudents("Upper Sixth Science", "Science", 126),
            },
            {
                className: "Upper Sixth Arts",
                stream: "Arts",
                candidates: 112,
                passed: 105,
                passRate: 93.8,
                distinction: 19,
                classAverage: 74.9,
                bestStudent: "Fong Grace",
                bestStudentAverage: 86.7,
                pdfUrl: "/results/2023-upper-sixth-arts.pdf",
                students: generateStudents("Upper Sixth Arts", "Arts", 112),
            },
        ],
    },
    {
        year: "2022",
        overallPassRate: 93.2,
        overallAverage: 74.8,
        bestStudent: "Nchinda Joseph",
        bestStudentAverage: 91.4,
        totalStudents: 630,

        classes: [
            {
                className: "Form 5 Science",
                stream: "Science",
                candidates: 118,
                passed: 110,
                passRate: 93.2,
                distinction: 25,
                classAverage: 78.5,
                bestStudent: "Nchinda Joseph",
                bestStudentAverage: 91.4,
                pdfUrl: "/results/2022-form-5-science.pdf",
                students: generateStudents("Form 5 Science", "Science", 118),
            },
            {
                className: "Form 5 Arts",
                stream: "Arts",
                candidates: 104,
                passed: 97,
                passRate: 93.3,
                distinction: 18,
                classAverage: 74.2,
                bestStudent: "Akwo Mary",
                bestStudentAverage: 87.6,
                pdfUrl: "/results/2022-form-5-arts.pdf",
                students: generateStudents("Form 5 Arts", "Arts", 104),
            },
            {
                className: "Upper Sixth Science",
                stream: "Science",
                candidates: 121,
                passed: 106,
                passRate: 87.6,
                distinction: 27,
                classAverage: 76.3,
                bestStudent: "Tata Peter",
                bestStudentAverage: 89.8,
                pdfUrl: "/results/2022-upper-sixth-science.pdf",
                students: generateStudents("Upper Sixth Science", "Science", 121),
            },
            {
                className: "Upper Sixth Arts",
                stream: "Arts",
                candidates: 101,
                passed: 94,
                passRate: 93.1,
                distinction: 17,
                classAverage: 73.5,
                bestStudent: "Nya Ruth",
                bestStudentAverage: 86.2,
                pdfUrl: "/results/2022-upper-sixth-arts.pdf",
                students: generateStudents("Upper Sixth Arts", "Arts", 101),
            },
        ],
    },
    {
        year: "2021",
        overallPassRate: 92.0,
        overallAverage: 73.4,
        bestStudent: "Tantoh David",
        bestStudentAverage: 90.5,
        totalStudents: 580,

        classes: [
            {
                className: "Form 5 Science",
                stream: "Science",
                candidates: 110,
                passed: 101,
                passRate: 91.8,
                distinction: 23,
                classAverage: 77.8,
                bestStudent: "Tantoh David",
                bestStudentAverage: 90.5,
                pdfUrl: "/results/2021-form-5-science.pdf",
                students: generateStudents("Form 5 Science", "Science", 110),
            },
            {
                className: "Form 5 Arts",
                stream: "Arts",
                candidates: 94,
                passed: 87,
                passRate: 92.6,
                distinction: 16,
                classAverage: 73.1,
                bestStudent: "Nfor Sarah",
                bestStudentAverage: 86.9,
                pdfUrl: "/results/2021-form-5-arts.pdf",
                students: generateStudents("Form 5 Arts", "Arts", 94),
            },
            {
                className: "Upper Sixth Science",
                stream: "Science",
                candidates: 118,
                passed: 108,
                passRate: 91.5,
                distinction: 24,
                classAverage: 76.4,
                bestStudent: "Tia Michael",
                bestStudentAverage: 89.2,
                pdfUrl: "/results/2021-upper-sixth-science.pdf",
                students: generateStudents("Upper Sixth Science", "Science", 118),
            },
            {
                className: "Upper Sixth Arts",
                stream: "Arts",
                candidates: 92,
                passed: 85,
                passRate: 92.4,
                distinction: 15,
                classAverage: 72.6,
                bestStudent: "Ngang Grace",
                bestStudentAverage: 84.8,
                pdfUrl: "/results/2021-upper-sixth-arts.pdf",
                students: generateStudents("Upper Sixth Arts", "Arts", 92),
            },
        ],
    },
    {
        year: "2020",
        overallPassRate: 90.6,
        overallAverage: 72.1,
        bestStudent: "Tanyi Joseph",
        bestStudentAverage: 89.3,
        totalStudents: 538,

        classes: [
            {
                className: "Form 5 Science",
                stream: "Science",
                candidates: 102,
                passed: 92,
                passRate: 90.2,
                distinction: 19,
                classAverage: 76.2,
                bestStudent: "Tanyi Joseph",
                bestStudentAverage: 89.3,
                pdfUrl: "/results/2020-form-5-science.pdf",
                students: generateStudents("Form 5 Science", "Science", 102),
            },
            {
                className: "Form 5 Arts",
                stream: "Arts",
                candidates: 90,
                passed: 81,
                passRate: 90.0,
                distinction: 14,
                classAverage: 71.5,
                bestStudent: "Fonyuy Mary",
                bestStudentAverage: 85.7,
                pdfUrl: "/results/2020-form-5-arts.pdf",
                students: generateStudents("Form 5 Arts", "Arts", 90),
            },
            {
                className: "Upper Sixth Science",
                stream: "Science",
                candidates: 112,
                passed: 101,
                passRate: 90.2,
                distinction: 21,
                classAverage: 75.3,
                bestStudent: "Nya Peter",
                bestStudentAverage: 88.6,
                pdfUrl: "/results/2020-upper-sixth-science.pdf",
                students: generateStudents("Upper Sixth Science", "Science", 112),
            },
            {
                className: "Upper Sixth Arts",
                stream: "Arts",
                candidates: 88,
                passed: 80,
                passRate: 90.9,
                distinction: 13,
                classAverage: 70.8,
                bestStudent: "Nchinda Ruth",
                bestStudentAverage: 83.9,
                pdfUrl: "/results/2020-upper-sixth-arts.pdf",
                students: generateStudents("Upper Sixth Arts", "Arts", 88),
            },
        ],
    },
];

const ITEMS_PER_PAGE = 6;
const STUDENTS_PER_PAGE = 10;

const AcademicResultsPage = () => {
    const [searchParams] = useSearchParams();
    const initialYear = searchParams.get("year") || "2024";

    const [selectedYear, setSelectedYear] = useState(initialYear);
    const [selectedStream, setSelectedStream] = useState("All");
    const [selectedClass, setSelectedClass] = useState(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [studentPage, setStudentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);

    // Reset student page when class changes
    useEffect(() => {
        setStudentPage(1);
    }, [selectedClass]);

    const selectedResults = useMemo(() => {
        return RESULTS.find((item) => item.year === selectedYear) || RESULTS[0];
    }, [selectedYear]);

    const streams = useMemo(() => {
        const values = selectedResults.classes.map((item) => item.stream);
        return ["All", ...new Set(values)];
    }, [selectedResults]);

    const filteredResults = useMemo(() => {
        const query = search.trim().toLowerCase();

        return selectedResults.classes.filter((item) => {
            const matchesStream =
                selectedStream === "All" || item.stream === selectedStream;

            const matchesSearch =
                !query || item.className.toLowerCase().includes(query);

            return matchesStream && matchesSearch;
        });
    }, [selectedResults, selectedStream, search]);

    const totalPages = Math.max(1, Math.ceil(filteredResults.length / ITEMS_PER_PAGE));

    const paginatedResults = filteredResults.slice(
        (page - 1) * ITEMS_PER_PAGE,
        page * ITEMS_PER_PAGE
    );

    // Get selected class data
    const selectedClassData = useMemo(() => {
        if (!selectedClass) return null;
        return selectedResults.classes.find((c) => c.className === selectedClass) || null;
    }, [selectedClass, selectedResults]);

    // Student pagination
    const studentTotalPages = selectedClassData
        ? Math.max(1, Math.ceil(selectedClassData.students.length / STUDENTS_PER_PAGE))
        : 0;

    const paginatedStudents = selectedClassData
        ? selectedClassData.students.slice(
            (studentPage - 1) * STUDENTS_PER_PAGE,
            studentPage * STUDENTS_PER_PAGE
        )
        : [];

    const handleYearChange = (year) => {
        setSelectedYear(year);
        setSelectedStream("All");
        setSearch("");
        setPage(1);
        setSelectedClass(null);
        setShowModal(false);
    };

    const handleFilterChange = (stream) => {
        setSelectedStream(stream);
        setPage(1);
        setSelectedClass(null);
    };

    const handleSearchChange = (event) => {
        setSearch(event.target.value);
        setPage(1);
    };

    const handleClassClick = (className) => {
        setSelectedClass(className);
        setStudentPage(1);
        setShowModal(true);
        document.body.style.overflow = "hidden";
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedClass(null);
        document.body.style.overflow = "auto";
    };

    // Close modal on ESC
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") closeModal();
        };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, []);

    const getGradeColor = (grade) => {
        const colors = {
            'A': '#0d9488',
            'B': '#3b82f6',
            'C': '#f59e0b',
            'D': '#ef4444',
        };
        return colors[grade] || '#6b7280';
    };

    return (
        <div className="academic-results-page">
            {/* HERO */}
            <section className="academic-results-hero">
                <div className="container-xl">
                    <div className="academic-results-hero-content">
                        <span className="academic-results-eyebrow">
                            <i className="bi bi-trophy-fill me-2" />
                            Academic Excellence
                        </span>

                        <h1>Academic Results</h1>

                        <p>
                            Explore CCAST Bambili's academic performance across previous years,
                            classes and programmes. View detailed class performance and student achievements.
                        </p>

                        <div className="academic-results-breadcrumb">
                            <Link to="/">Home</Link>
                            <i className="bi bi-chevron-right" />
                            <span>Academic Results</span>
                        </div>
                    </div>
                </div>
            </section>

            <main className="container-xl py-5">
                {/* YEAR SELECTOR */}
                <section className="results-years-section">
                    <div className="section-heading-row">
                        <div>
                            <span className="results-section-label">Results Archive</span>
                            <h2>Select Academic Year</h2>
                            <p>Browse results from previous academic years.</p>
                        </div>
                    </div>

                    <div className="results-year-list">
                        {RESULTS.map((result) => (
                            <button
                                type="button"
                                key={result.year}
                                className={`results-year-button ${selectedYear === result.year ? "active" : ""
                                    }`}
                                onClick={() => handleYearChange(result.year)}
                            >
                                <span>{result.year}</span>
                                <small>{result.overallPassRate}% pass</small>
                            </button>
                        ))}
                    </div>
                </section>

                {/* SUMMARY STATS */}
                <section className="results-summary">
                    <div className="results-summary-card">
                        <div className="results-summary-icon">
                            <i className="bi bi-calendar3" />
                        </div>
                        <div>
                            <span>Academic Year</span>
                            <strong>{selectedResults.year}</strong>
                        </div>
                    </div>

                    <div className="results-summary-card">
                        <div className="results-summary-icon">
                            <i className="bi bi-graph-up-arrow" />
                        </div>
                        <div>
                            <span>Overall Pass Rate</span>
                            <strong>{selectedResults.overallPassRate}%</strong>
                        </div>
                    </div>

                    <div className="results-summary-card">
                        <div className="results-summary-icon">
                            <i className="bi bi-mortarboard-fill" />
                        </div>
                        <div>
                            <span>Overall Average</span>
                            <strong>{selectedResults.overallAverage}%</strong>
                        </div>
                    </div>

                    <div className="results-summary-card">
                        <div className="results-summary-icon">
                            <i className="bi bi-trophy" />
                        </div>
                        <div>
                            <span>Best Student</span>
                            <strong>{selectedResults.bestStudent}</strong>
                            <small>{selectedResults.bestStudentAverage}%</small>
                        </div>
                    </div>

                    <div className="results-summary-card">
                        <div className="results-summary-icon">
                            <i className="bi bi-people-fill" />
                        </div>
                        <div>
                            <span>Total Students</span>
                            <strong>{selectedResults.totalStudents}</strong>
                        </div>
                    </div>

                    <div className="results-summary-card">
                        <div className="results-summary-icon">
                            <i className="bi bi-book" />
                        </div>
                        <div>
                            <span>Classes</span>
                            <strong>{selectedResults.classes.length}</strong>
                        </div>
                    </div>
                </section>

                {/* FILTERS */}
                <section className="results-toolbar">
                    <div className="results-filter-tabs">
                        {streams.map((stream) => (
                            <button
                                type="button"
                                key={stream}
                                className={selectedStream === stream ? "active" : ""}
                                onClick={() => handleFilterChange(stream)}
                            >
                                {stream}
                            </button>
                        ))}
                    </div>

                    <div className="results-search">
                        <i className="bi bi-search" />
                        <input
                            type="search"
                            placeholder="Search class..."
                            value={search}
                            onChange={handleSearchChange}
                            aria-label="Search results"
                        />
                    </div>
                </section>

                {/* RESULTS TABLE */}
                <section className="results-table-section">
                    <div className="results-table-header">
                        <div>
                            <span>
                                {filteredResults.length} result{filteredResults.length !== 1 ? "s" : ""}
                            </span>
                            <h2>{selectedResults.year} Class Performance</h2>
                        </div>
                    </div>

                    {paginatedResults.length ? (
                        <>
                            <div className="results-desktop-table">
                                <div className="results-table">
                                    <div className="results-table-head">
                                        <span>Class</span>
                                        <span>Stream</span>
                                        <span>Candidates</span>
                                        <span>Passed</span>
                                        <span>Pass Rate</span>
                                        <span>Class Avg</span>
                                        <span>Best Student</span>
                                        <span>Action</span>
                                    </div>

                                    {paginatedResults.map((result) => (
                                        <div
                                            className="results-table-row"
                                            key={`${selectedResults.year}-${result.className}`}
                                        >
                                            <div className="result-class">
                                                <div className="result-class-icon">
                                                    <i className="bi bi-mortarboard" />
                                                </div>
                                                <strong>{result.className}</strong>
                                            </div>

                                            <span
                                                className={`result-stream result-stream--${result.stream.toLowerCase()}`}
                                            >
                                                {result.stream}
                                            </span>

                                            <span>{result.candidates}</span>
                                            <span>{result.passed}</span>

                                            <strong className="result-rate">{result.passRate}%</strong>

                                            <strong className="result-class-avg">{result.classAverage}%</strong>

                                            <div className="result-best-student">
                                                <strong>{result.bestStudent}</strong>
                                                <small>{result.bestStudentAverage}%</small>
                                            </div>

                                            <button
                                                className="result-view-button"
                                                onClick={() => handleClassClick(result.className)}
                                            >
                                                <i className="bi bi-eye" />
                                                View
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* MOBILE CARDS */}
                            <div className="results-mobile-list">
                                {paginatedResults.map((result) => (
                                    <article
                                        className="result-mobile-card"
                                        key={`${selectedResults.year}-mobile-${result.className}`}
                                    >
                                        <div className="result-mobile-top">
                                            <div className="result-class">
                                                <div className="result-class-icon">
                                                    <i className="bi bi-mortarboard" />
                                                </div>
                                                <div>
                                                    <strong>{result.className}</strong>
                                                    <span>{result.stream}</span>
                                                </div>
                                            </div>
                                            <span className="result-rate">{result.passRate}%</span>
                                        </div>

                                        <div className="result-mobile-stats">
                                            <div>
                                                <span>Candidates</span>
                                                <strong>{result.candidates}</strong>
                                            </div>
                                            <div>
                                                <span>Passed</span>
                                                <strong>{result.passed}</strong>
                                            </div>
                                            <div>
                                                <span>Class Avg</span>
                                                <strong>{result.classAverage}%</strong>
                                            </div>
                                            <div>
                                                <span>Best Student</span>
                                                <strong>{result.bestStudent}</strong>
                                                <small>{result.bestStudentAverage}%</small>
                                            </div>
                                        </div>

                                        <button
                                            className="result-view-button result-view-button--full"
                                            onClick={() => handleClassClick(result.className)}
                                        >
                                            <i className="bi bi-eye" />
                                            View Details
                                        </button>
                                    </article>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="results-empty">
                            <div>
                                <i className="bi bi-search" />
                            </div>
                            <h3>No results found</h3>
                            <p>Try changing your search or stream filter.</p>
                        </div>
                    )}
                </section>

                {/* PAGINATION */}
                {filteredResults.length > ITEMS_PER_PAGE && (
                    <nav className="results-pagination" aria-label="Academic results pagination">
                        <button
                            type="button"
                            disabled={page === 1}
                            onClick={() => setPage((value) => Math.max(1, value - 1))}
                        >
                            <i className="bi bi-chevron-left" />
                            Previous
                        </button>

                        <div className="results-page-numbers">
                            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                                (pageNumber) => (
                                    <button
                                        type="button"
                                        key={pageNumber}
                                        className={page === pageNumber ? "active" : ""}
                                        onClick={() => setPage(pageNumber)}
                                    >
                                        {pageNumber}
                                    </button>
                                )
                            )}
                        </div>

                        <button
                            type="button"
                            disabled={page === totalPages}
                            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                        >
                            Next
                            <i className="bi bi-chevron-right" />
                        </button>
                    </nav>
                )}

                {/* PRIVACY NOTE */}
                <div className="results-notice">
                    <i className="bi bi-info-circle-fill" />
                    <div>
                        <strong>Academic results archive</strong>
                        <p>
                            This section provides institutional academic performance information.
                            Individual student results should be accessed through the appropriate
                            secure student portal.
                        </p>
                    </div>
                </div>
            </main>

            {/* CLASS DETAIL MODAL */}
            {showModal && selectedClassData && (
                <div className="results-modal-overlay" onClick={closeModal}>
                    <div className="results-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="results-modal-close" onClick={closeModal}>
                            <i className="bi bi-x-lg" />
                        </button>

                        <div className="results-modal-header">
                            <div>
                                <span className="results-modal-badge">
                                    {selectedClassData.stream}
                                </span>
                                <h2>{selectedClassData.className}</h2>
                                <p>
                                    {selectedClassData.candidates} students • {selectedClassData.passRate}% pass rate
                                </p>
                            </div>
                            <div className="results-modal-stats">
                                <div>
                                    <span>Class Average</span>
                                    <strong>{selectedClassData.classAverage}%</strong>
                                </div>
                                <div>
                                    <span>Best Student</span>
                                    <strong>{selectedClassData.bestStudent}</strong>
                                    <small>{selectedClassData.bestStudentAverage}%</small>
                                </div>
                                <div>
                                    <span>Distinctions</span>
                                    <strong>{selectedClassData.distinction}</strong>
                                </div>
                            </div>
                        </div>

                        <div className="results-modal-body">
                            <div className="results-modal-section">
                                <h3>Student Performance</h3>
                                <div className="results-student-table">
                                    <div className="results-student-head">
                                        <span>#</span>
                                        <span>Student Name</span>
                                        <span>Gender</span>
                                        <span>Total Subjects</span>
                                        <span>Passed</span>
                                        <span>Average</span>
                                        <span>Grade</span>
                                        <span>Distinction</span>
                                    </div>

                                    {paginatedStudents.map((student, index) => (
                                        <div className="results-student-row" key={student.id}>
                                            <span>{student.position}</span>
                                            <span className="student-name">{student.name}</span>
                                            <span>{student.gender}</span>
                                            <span>{student.totalSubjects}</span>
                                            <span>{student.passedSubjects}</span>
                                            <span className="student-avg">{student.average}%</span>
                                            <span
                                                className="student-grade"
                                                style={{ color: getGradeColor(student.grade) }}
                                            >
                                                {student.grade}
                                            </span>
                                            <span>
                                                {student.hasDistinction ? (
                                                    <i className="bi bi-award-fill student-distinction" />
                                                ) : (
                                                    <span className="student-no-distinction">—</span>
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Student Pagination */}
                                {studentTotalPages > 1 && (
                                    <div className="results-student-pagination">
                                        <button
                                            type="button"
                                            disabled={studentPage === 1}
                                            onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                                        >
                                            <i className="bi bi-chevron-left" />
                                        </button>
                                        <span>
                                            Page {studentPage} of {studentTotalPages}
                                        </span>
                                        <button
                                            type="button"
                                            disabled={studentPage === studentTotalPages}
                                            onClick={() =>
                                                setStudentPage((p) => Math.min(studentTotalPages, p + 1))
                                            }
                                        >
                                            <i className="bi bi-chevron-right" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="results-modal-section">
                                <h3>Class Summary</h3>
                                <div className="results-summary-grid">
                                    <div className="summary-item">
                                        <span>Total Students</span>
                                        <strong>{selectedClassData.candidates}</strong>
                                    </div>
                                    <div className="summary-item">
                                        <span>Passed</span>
                                        <strong>{selectedClassData.passed}</strong>
                                    </div>
                                    <div className="summary-item">
                                        <span>Pass Rate</span>
                                        <strong>{selectedClassData.passRate}%</strong>
                                    </div>
                                    <div className="summary-item">
                                        <span>Class Average</span>
                                        <strong>{selectedClassData.classAverage}%</strong>
                                    </div>
                                    <div className="summary-item">
                                        <span>Distinctions</span>
                                        <strong>{selectedClassData.distinction}</strong>
                                    </div>
                                    <div className="summary-item">
                                        <span>Best Student</span>
                                        <strong>{selectedClassData.bestStudent}</strong>
                                    </div>
                                </div>
                            </div>

                            <div className="results-modal-actions">
                                <a
                                    href={selectedClassData.pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="results-modal-pdf"
                                >
                                    <i className="bi bi-file-earmark-pdf" />
                                    Download Full Results (PDF)
                                </a>
                                <button className="results-modal-close-btn" onClick={closeModal}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcademicResultsPage;