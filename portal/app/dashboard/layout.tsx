import { AuthGuard } from '../../components/AuthGuard';
import { NavBar } from '../../components/NavBar';
import { PageTransition } from '../../components/PageTransition';
import { Chatbot } from '../../components/Chatbot';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <PageTransition>{children}</PageTransition>
        </main>
        <Chatbot />
      </div>
    </AuthGuard>
  );
}
