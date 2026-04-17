/**
 * Scheletro per generazione PDF di report brandizzati.
 *
 * Per abilitarlo:
 * 1. Installa @react-pdf/renderer (già in package.json)
 * 2. Importa Document, Page, Text, etc.
 * 3. Crea un <ReportDocument /> React component
 * 4. Renderizza con renderToStream / renderToBuffer in un'API route
 *
 * Esempio minimo:
 *
 * import { Document, Page, Text, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
 *
 * const styles = StyleSheet.create({
 *   page: { padding: 40 },
 *   title: { fontSize: 24, marginBottom: 12 },
 * });
 *
 * export function ReportDocument({ data }: { data: any }) {
 *   return (
 *     <Document>
 *       <Page size="A4" style={styles.page}>
 *         <Text style={styles.title}>@{data.user.username}</Text>
 *         <Text>Follower: {data.user.follower_count}</Text>
 *       </Page>
 *     </Document>
 *   );
 * }
 *
 * export async function generatePdf(data: any): Promise<Buffer> {
 *   return renderToBuffer(<ReportDocument data={data} />);
 * }
 *
 * API route (app/api/report/[username]/route.ts):
 *
 * import { generatePdf } from '@/lib/pdf/report-generator';
 * export async function GET(req, { params }) {
 *   const data = await fetchAnalysisFromDb(params.username);
 *   const buffer = await generatePdf(data);
 *   return new Response(buffer, {
 *     headers: {
 *       'Content-Type': 'application/pdf',
 *       'Content-Disposition': `attachment; filename="${params.username}-report.pdf"`,
 *     },
 *   });
 * }
 */

export const PDF_REPORT_READY = false;
