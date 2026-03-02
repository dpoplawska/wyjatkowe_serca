import {
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Container,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon from "@mui/icons-material/Download";
import sprawozdanie2024 from "./../media/Sprawozdanie finansowe WyjatkoweSerca 2024.pdf";

export default function FinancialReportsPage() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Card raised sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent sx={{ textAlign: "center", pb: 2 }}>
    
          <Typography variant="h5"  gutterBottom sx={{ fontWeight: "bold", justifyContent: "center", fontFamily: "Montserrat" }}>
            Sprawozdanie finansowe 2024
          </Typography>

          <Typography variant="h6" color="text.secondary" gutterBottom>
            Fundacja Wyjątkowe Serca
          </Typography>

        </CardContent>

        <CardActions sx={{ justifyContent: "center", pb: 4 }}>
          <Button
            variant="contained"
            size="large"
            href={sprawozdanie2024}
            target="_blank"
            rel="noopener noreferrer"
            download="Sprawozdanie_finansowe_WyjatkoweSerca_2024.pdf"
            startIcon={<DownloadIcon />}
            sx={{ px: 4, py: 1.5, backgroundColor: "#2383C5", '&:hover': { backgroundColor: '#EC1A3B' } }}
          >
            Pobierz PDF
          </Button>

          <Button
            variant="outlined"
            size="large"
            href={sprawozdanie2024}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<PictureAsPdfIcon />}
            sx={{
              ml: 2, px: 4, py: 1.5, color: "#2383C5", '&:hover': { color: '#EC1A3B' }
            }}
          >
            Otwórz w nowej karcie
          </Button>
        </CardActions>
      </Card>
    </Container>
  );
}