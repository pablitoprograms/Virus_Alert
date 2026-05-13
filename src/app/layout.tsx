import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { ConfigProvider } from '@/components/dashboard/ConfigContext';

export const metadata: Metadata = {
  title: 'VirusAlert | Global Disease Outbreak Tracker',
  description: 'Interactive real-time disease outbreak tracking dashboard.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased overflow-hidden transition-colors duration-300">
        {/* Aquí está el cerebro envolviendo toda tu aplicación */}
        <ConfigProvider>
          <FirebaseClientProvider>
            {children}
            <Toaster />
          </FirebaseClientProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}