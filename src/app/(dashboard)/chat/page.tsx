
'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Send, MessageSquare } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import type { ChatThread, ChatMessage, User } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn, getDisplayAvatarUrl } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { UserPlus } from 'lucide-react';


export default function ChatPage() {
  const { currentUser } = useAuth();
  const { users, loading: usersLoading } = useUser();
  const [threads, setThreads] = React.useState<ChatThread[]>([]);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [activeThreadId, setActiveThreadId] = React.useState<string | null>(null);
  const [loadingThreads, setLoadingThreads] = React.useState(true);
  const [loadingMessages, setLoadingMessages] = React.useState(false);
  const [newMessage, setNewMessage] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);

  const messageEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch user's chat threads
  React.useEffect(() => {
    if (!currentUser) return;
    setLoadingThreads(true);
    const threadsRef = collection(db, 'chatThreads');
    const q = query(
      threadsRef,
      where('participantIds', 'array-contains', currentUser.id)
      // orderBy('lastUpdatedAt', 'desc') // This requires a composite index. We'll sort on the client.
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedThreads = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatThread));
      
      // Sort threads by the most recent message on the client
      fetchedThreads.sort((a, b) => {
          const timeA = a.lastUpdatedAt?.toDate ? a.lastUpdatedAt.toDate().getTime() : 0;
          const timeB = b.lastUpdatedAt?.toDate ? b.lastUpdatedAt.toDate().getTime() : 0;
          return timeB - timeA;
      });
      
      setThreads(fetchedThreads);
      setLoadingThreads(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch messages for active thread
  React.useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    const messagesRef = collection(db, 'chatThreads', activeThreadId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      setMessages(fetchedMessages);
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [activeThreadId]);

  const handleCreateOrSelectThread = async (otherUser: User) => {
    if (!currentUser || currentUser.id === otherUser.id) return;

    const participantIds = [currentUser.id, otherUser.id].sort();
    
    // Check if thread exists
    const threadsRef = collection(db, 'chatThreads');
    const q = query(threadsRef, where('participantIds', '==', participantIds));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const threadDoc = querySnapshot.docs[0];
      setActiveThreadId(threadDoc.id);
    } else {
      // Create new thread
      const newThreadData = {
        participantIds,
        participantNames: {
          [currentUser.id]: currentUser.name,
          [otherUser.id]: otherUser.name,
        },
        participantAvatars: {
           [currentUser.id]: currentUser.avatarUrl,
           [otherUser.id]: otherUser.avatarUrl,
        },
        lastMessage: 'Chat iniciado.',
        lastMessageSender: 'Sistema',
        lastUpdatedAt: serverTimestamp(),
      };
      const newThreadRef = await addDoc(threadsRef, newThreadData);
      setActiveThreadId(newThreadRef.id);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeThreadId || !currentUser) return;
    
    setIsSending(true);
    const messagesRef = collection(db, 'chatThreads', activeThreadId, 'messages');
    await addDoc(messagesRef, {
      threadId: activeThreadId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      content: newMessage,
      createdAt: serverTimestamp(),
    });
    
    const threadRef = doc(db, 'chatThreads', activeThreadId);
    await updateDoc(threadRef, {
      lastMessage: newMessage,
      lastMessageSender: currentUser.name,
      lastUpdatedAt: serverTimestamp(),
    });

    setNewMessage('');
    setIsSending(false);
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1) return `${names[0][0]}${names[names.length - 1][0]}`;
    return name.substring(0, 2);
  };

  const activeThread = threads.find(t => t.id === activeThreadId);

  return (
    <div className="space-y-6">
       <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Comunicação Interna
          </h1>
          <p className="text-muted-foreground">
            Converse com outros membros da equipe.
          </p>
        </div>
        <Card className="grid grid-cols-1 md:grid-cols-[300px_1fr] h-[75vh]">
            <div className="border-r flex flex-col">
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>Conversas</CardTitle>
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon"><UserPlus /></Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[250px]">
                           <Command>
                                <CommandInput placeholder="Buscar usuário..." />
                                <CommandList>
                                    <CommandEmpty>Nenhum usuário.</CommandEmpty>
                                    <CommandGroup>
                                        {users.filter(u => u.id !== currentUser?.id).map(user => (
                                            <CommandItem key={user.id} onSelect={() => handleCreateOrSelectThread(user)}>
                                                {user.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                     </Popover>
                </CardHeader>
                <CardContent className="p-2 flex-1">
                    {loadingThreads ? <Loader2 className="mx-auto my-8 animate-spin" /> : (
                        <ScrollArea className="h-[calc(75vh-100px)]">
                            {threads.map(thread => {
                                const otherParticipantId = thread.participantIds.find(id => id !== currentUser?.id);
                                if (!otherParticipantId) return null;
                                const otherName = thread.participantNames[otherParticipantId];
                                const otherAvatar = thread.participantAvatars[otherParticipantId];

                                return (
                                <button key={thread.id} onClick={() => setActiveThreadId(thread.id)} className={cn("w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors", activeThreadId === thread.id ? 'bg-secondary' : 'hover:bg-secondary/50')}>
                                    <Avatar>
                                        <AvatarImage src={getDisplayAvatarUrl(otherAvatar)} />
                                        <AvatarFallback>{getInitials(otherName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-semibold truncate">{otherName}</p>
                                        <p className="text-sm text-muted-foreground truncate">{thread.lastMessage}</p>
                                    </div>
                                </button>
                                );
                            })}
                        </ScrollArea>
                    )}
                </CardContent>
            </div>
            <div className="flex flex-col h-full">
                {activeThread ? (
                    <>
                        <CardHeader className="flex-row items-center gap-3 border-b">
                           <Avatar>
                                <AvatarImage src={getDisplayAvatarUrl(activeThread.participantAvatars[activeThread.participantIds.find(id => id !== currentUser?.id)!])} />
                                <AvatarFallback>{getInitials(activeThread.participantNames[activeThread.participantIds.find(id => id !== currentUser?.id)!])}</AvatarFallback>
                            </Avatar>
                            <CardTitle>{activeThread.participantNames[activeThread.participantIds.find(id => id !== currentUser?.id)!]}</CardTitle>
                        </CardHeader>
                        <ScrollArea className="flex-1 p-4 bg-muted/30">
                            <div className="space-y-4">
                            {loadingMessages ? <Loader2 className="mx-auto my-8 animate-spin" /> :
                                messages.map(msg => (
                                    <div key={msg.id} className={cn('flex items-end gap-2', msg.senderId === currentUser?.id ? 'justify-end' : 'justify-start')}>
                                        {msg.senderId !== currentUser?.id && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={getDisplayAvatarUrl(activeThread.participantAvatars[msg.senderId])} />
                                                <AvatarFallback>{getInitials(msg.senderName)}</AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className={cn('max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-xl shadow-sm', msg.senderId === currentUser?.id ? 'bg-primary text-primary-foreground' : 'bg-card')}>
                                            <p className="text-sm">{msg.content}</p>
                                            <p className={cn('text-xs mt-1 text-right', msg.senderId === currentUser?.id ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{msg.createdAt ? formatDistanceToNow(msg.createdAt.toDate(), { locale: ptBR, addSuffix: true }) : 'enviando...'}</p>
                                        </div>
                                    </div>
                                ))
                            }
                             <div ref={messageEndRef} />
                            </div>
                        </ScrollArea>
                        <div className="p-4 border-t bg-card">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Digite sua mensagem..." autoComplete="off" disabled={isSending} />
                                <Button type="submit" disabled={isSending || !newMessage.trim()}>
                                    {isSending ? <Loader2 className="animate-spin" /> : <Send />}
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-muted/30">
                        <MessageSquare className="h-16 w-16 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">Selecione uma conversa</h3>
                        <p className="mt-1 text-muted-foreground">Ou clique no ícone &apos;+&apos; acima para iniciar um novo chat.</p>
                    </div>
                )}
            </div>
        </Card>
    </div>
  );
}
