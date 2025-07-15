
'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock } from 'lucide-react';
import { ManageAvailabilityDialog } from '@/components/planning/manage-availability-dialog';
import type { User, Availability } from '@/lib/types';
import { getDisplayAvatarUrl } from '@/lib/utils';

const timeToMinutes = (time: string) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

const calculateTotalHours = (availability: Availability[]) => {
    if (!availability) return 0;
    const totalMinutes = availability
        .filter(slot => slot.type === 'Free')
        .reduce((acc, slot) => {
            const start = timeToMinutes(slot.startTime);
            const end = timeToMinutes(slot.endTime);
            return acc + (end - start);
        }, 0);
    return (totalMinutes / 60).toFixed(1);
}

export function AvailabilityManager() {
    const { users, loading: usersLoading, fetchUsers } = useUser();
    const professionals = users.filter(u => u.role === 'Therapist' || u.role === 'Coordinator');
    const [isAvailabilityDialogOpen, setIsAvailabilityDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const handleManageAvailability = (user: User) => {
        setSelectedUser(user);
        setIsAvailabilityDialogOpen(true);
    }

    const getInitials = (name: string) => {
        if (!name) return '';
        const names = name.split(' ');
        if (names.length > 1) {
          return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div className="space-y-4">
            {selectedUser && (
                <ManageAvailabilityDialog
                    isOpen={isAvailabilityDialogOpen}
                    onOpenChange={setIsAvailabilityDialogOpen}
                    user={selectedUser}
                    onAvailabilityUpdated={fetchUsers}
                />
            )}
            {usersLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : professionals.map(pro => {
                const totalHours = calculateTotalHours(pro.availability || []);
                return (
                  <div key={pro.id} className="flex items-center justify-between rounded-md border p-4">
                      <div className="flex items-center gap-4">
                          <Avatar>
                              <AvatarImage src={getDisplayAvatarUrl(pro.avatarUrl)} alt={pro.name} data-ai-hint="person portrait" />
                              <AvatarFallback>{getInitials(pro.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                              <p className="font-semibold">{pro.name}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                  <span>{pro.role}</span>
                                  <span className="text-xs">&bull;</span>
                                  <Clock className="h-3 w-3" />
                                  <span>{totalHours}h livres / semana</span>
                              </p>
                          </div>
                      </div>
                      <Button variant="outline" onClick={() => handleManageAvailability(pro)}>Gerenciar Horários</Button>
                  </div>
                )
            })}
        </div>
    );
}
