// app/user/layout.tsx
import { UserProvider } from '../../state/userStore';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        {children}
      </div>
    </UserProvider>
  );
}