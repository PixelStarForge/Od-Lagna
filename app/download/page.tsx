import { Metadata } from "next";
import { DownloadPageContent } from "../../components/DownloadPageContent";

export const metadata: Metadata = {
  title: "Download App — Od-Lagna Re:Zero Offline Archive",
  description:
    "Download the Od-Lagna offline application for Windows, macOS, Linux, Android, and iOS. Enjoy complete offline access with automatic background updates.",
};

export default function DownloadPage() {
  return <DownloadPageContent />;
}

