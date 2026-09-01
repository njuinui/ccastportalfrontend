import client from "./client";

/* Fetches the PDF as a blob and triggers a browser download. */
export async function downloadReportCard(studentId, examId) {
  const res = await client.get(`/students/${studentId}/report-card`, {
    params: { exam_id: examId },
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `report-card-${studentId}-${examId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
