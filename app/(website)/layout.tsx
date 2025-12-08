import Header from "@/components/Header";
import Footer from "@/components/Footer";
import QRCodeScanner from "@/components/QRCodeScanner";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <QRCodeScanner />
      {children}
      <Footer />
    </>
  );
}
