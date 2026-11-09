import {
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Container,
  Stack,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon from "@mui/icons-material/Download";
import {
  PDF_SPRAWOZDANIE_2024,
  PDF_SPRAWOZDANIE_2025,
} from "../app/mediaUrls.ts";

export type FinancialReport = {
  title: string;
  url: string;
  downloadName: string;
  organization?: string;
};

const financialReports: FinancialReport[] = [
    {
    title: "Sprawozdanie finansowe 2025",
    url: PDF_SPRAWOZDANIE_2025,
    downloadName: "Sprawozdanie_finansowe_WyjatkoweSerca_2025.pdf",
    organization: "Fundacja Wyjątkowe Serca",
  },
  {
    title: "Sprawozdanie finansowe 2024",
    url: PDF_SPRAWOZDANIE_2024,
    downloadName: "Sprawozdanie_finansowe_WyjatkoweSerca_2024.pdf",
    organization: "Fundacja Wyjątkowe Serca",
  },
];

export function FinancialReportCard({ report }: { report: FinancialReport }) {
  return (
    <Card raised sx={{ borderRadius: 3, boxShadow: 3 }}>
      <CardContent sx={{ textAlign: "center", pb: 2 }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ fontWeight: "bold", fontFamily: "Montserrat" }}
        >
          {report.title}
        </Typography>
        {report.organization && (
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {report.organization}
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: "center", pb: 4 }}>
        <Button
          variant="contained"
          size="large"
          href={report.url}
          target="_blank"
          rel="noopener noreferrer"
          download={report.downloadName}
          startIcon={<DownloadIcon />}
          sx={{
            px: 4,
            py: 1.5,
            backgroundColor: "#2383C5",
            "&:hover": { backgroundColor: "#EC1A3B" },
          }}
        >
          Pobierz PDF
        </Button>

        <Button
          variant="outlined"
          size="large"
          href={report.url}
          target="_blank"
          rel="noopener noreferrer"
          startIcon={<PictureAsPdfIcon />}
          sx={{
            ml: 2,
            px: 4,
            py: 1.5,
            color: "#2383C5",
            "&:hover": { color: "#EC1A3B" },
          }}
        >
          Otwórz w nowej karcie
        </Button>
      </CardActions>
    </Card>
  );
}

export default function FinancialReportsPage({
  reports = financialReports,
}: {
  reports?: FinancialReport[];
}) {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Stack spacing={3}>
        {reports.map((report) => (
          <FinancialReportCard key={report.url} report={report} />
        ))}
      </Stack>
    </Container>
  );
}
