import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NexusGraph — Git Repo Knowledge Graph',
  description: 'Cloud-synced Git Repo knowledge graph platform for understanding code architecture',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
