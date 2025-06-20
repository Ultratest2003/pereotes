
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from './Header';
import AttestationTab from './AttestationTab';
import HistoryTab from './HistoryTab';
import UsersTab from './UsersTab';
import { ClipboardCheck, History, Users } from 'lucide-react';

const MainApp = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="attestation" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-6">
            <TabsTrigger value="attestation" className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Переаттестация
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              История
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Пользователи
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="attestation">
            <AttestationTab />
          </TabsContent>
          
          <TabsContent value="history">
            <HistoryTab />
          </TabsContent>
          
          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MainApp;
