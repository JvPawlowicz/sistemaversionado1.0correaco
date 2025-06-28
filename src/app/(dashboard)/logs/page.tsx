
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, where, Timestamp } from 'firebase/firestore';
import type { Log } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';

export default function LogsPage() {
  const [logs, setLogs] = React.useState<Log[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    const logsCollection = collection(db, 'logs');
    const q = query(logsCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedLogs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Log));
      setLogs(fetchedLogs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching logs: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const filteredLogs = logs.filter(log => 
    log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
       <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Logs do Sistema
        </h1>
        <p className="text-muted-foreground">
          Acompanhe as principais atividades realizadas na plataforma.
        </p>
      </div>
       <Card>
        <CardHeader className="flex-row justify-between items-center">
            <div>
                <CardTitle>Registro de Atividades</CardTitle>
                <CardDescription>Visualização das últimas ações realizadas no sistema.</CardDescription>
            </div>
             <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Buscar nos logs..."
                    className="pl-8 sm:w-[300px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </CardHeader>
        <CardContent>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Ação</TableHead>
                            <TableHead>Detalhes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="animate-spin mx-auto"/></TableCell></TableRow>
                        ) : filteredLogs.length > 0 ? (
                            filteredLogs.map(log => (
                                <TableRow key={log.id}>
                                    <TableCell className="whitespace-nowrap">{log.createdAt ? format(log.createdAt.toDate(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }) : 'N/A'}</TableCell>
                                    <TableCell>{log.actorName}</TableCell>
                                    <TableCell><span className="font-mono text-xs">{log.action}</span></TableCell>
                                    <TableCell>{log.details}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={4} className="h-24 text-center">Nenhum log encontrado.</TableCell></TableRow>
                        )}
                    </TableBody>
                 </Table>
            </div>
        </CardContent>
       </Card>
    </div>
  );
}
