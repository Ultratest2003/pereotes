
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from './Header';
import AttestationTab from './AttestationTab';
import HistoryTab from './HistoryTab';
import UsersTab from './UsersTab';
import AdminTab from './AdminTab';
import { ClipboardCheck, History, Users, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const MainApp = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="attestation" className="w-full">
          <TabsList className={`grid w-full max-w-2xl mx-auto mb-6 ${user?.role === 'admin' ? 'grid-cols-4' : 'grid-cols-2'}`}>
            <TabsTrigger value="attestation" className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Переаттестация
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              История
            </TabsTrigger>
            {user?.role === 'admin' && (
              <>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Пользователи
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Администратор
                </TabsTrigger>
              </>
            )}
          </TabsList>
          
          <TabsContent value="attestation">
            <AttestationTab />
          </TabsContent>
          
          <TabsContent value="history">
            <HistoryTab />
          </TabsContent>
          
          {user?.role === 'admin' && (
            <>
              <TabsContent value="users">
                <UsersTab />
              </TabsContent>
              
              <TabsContent value="admin">
                <AdminTab />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default MainApp;
