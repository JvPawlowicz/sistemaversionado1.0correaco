'use client';

import * as React from 'react';
import type { Appointment, TimeBlock, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Lock, User as UserIcon, Users, Edit3, Briefcase, Shield } from 'lucide-react';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { AppointmentActionsDialog } from './appointment-actions-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUser } from '@/contexts/UserContext';
import { useUnit } from '@/contexts/UnitContext';

const HOUR_HEIGHT = 60;

const timeToMinutes = (time: string) => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

function calculateAppointmentLayout<T extends { time: string; endTime: string }>(items: T[]): (T & { layout: { col: number, totalCols: number } })[] {
  if (!items || items.length === 0) {
    return [];
  }

  const sortedItems = [...items].sort((a, b) => {
    const startDiff = timeToMinutes(a.time) - timeToMinutes(b.time);
    if (startDiff !== 0) return startDiff;
    return timeToMinutes(a.endTime) - timeToMinutes(b.endTime);
  });

  let withLayout = sortedItems.map(item => ({
    ...item,
    layout: { col: 0, totalCols: 1 },
  }));

  if (withLayout.length === 0) {
    return [];
  }

  const columns: (T & { layout: { col: number, totalCols: number } })[][] = [];
  let lastEventEnding: number | null = null;

  withLayout.forEach(event => {
    if (lastEventEnding !== null && timeToMinutes(event.time) >= lastEventEnding) {
      packColumns(columns);
      columns.length = 0;
      lastEventEnding = null;
    }

    let placed = false;
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      if (!isOverlapping(col[col.length - 1], event)) {
        col.push(event);
        placed = true;
        break;
      }
    }

    if (!placed) {
      columns.push([event]);
    }
    
    if (lastEventEnding === null || timeToMinutes(event.endTime) > lastEventEnding) {
        lastEventEnding = timeToMinutes(event.endTime);
    }
  });

  if (columns.length > 0) {
      packColumns(columns);
  }

  return withLayout;
}

function packColumns(columns: any[][]) {
  const numColumns = columns.length;
  columns.forEach((col, i) => {
    col.forEach(event => {
      event.layout.totalCols = numColumns;
      event.layout.col = i;
    });
  });
}

function isOverlapping(eventA: { endTime: string }, eventB: { time: string }) {
  return timeToMinutes(eventA.endTime) > timeToMinutes(eventB.time);
}

interface RenderableAppointment extends Appointment {
    isGroup: boolean;
    groupPatientNames?: string[];
}

interface DailyViewProps {
    appointments: Appointment[];
    timeBlocks: TimeBlock[];
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
}

export function DailyView({ appointments, timeBlocks, currentDate, setCurrentDate }: DailyViewProps) {
  const hours = Array.from({ length: 13 }, (_, i) => i + 7); // 7 AM to 7 PM

  const { currentUser } = useAuth();
  const { users } = useUser();
  const { units, selectedUnitId } = useUnit();
  const [isActionsDialogOpen, setIsActionsDialogOpen] = React.useState(false);
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const selectedUnit = React.useMemo(() => units.find(u => u.id === selectedUnitId), [units, selectedUnitId]);

  const laidOutAppointments = React.useMemo(() => {
    let appointmentsOnDay = appointments.filter(app => isSameDay(new Date(app.date + 'T00:00:00'), currentDate));
    
    // Filter for Therapist role to only show their appointments
    if (currentUser?.role === 'Therapist') {
        appointmentsOnDay = appointmentsOnDay.filter(app => app.professionalName === currentUser.name);
    }
    
    const processedGroupIds = new Set<string>();
    const renderableAppointments: RenderableAppointment[] = [];
    
    appointmentsOnDay.forEach(app => {
        if (app.groupId) {
            if (processedGroupIds.has(app.groupId)) return;

            const groupAppointments = appointmentsOnDay.filter(a => a.groupId === app.groupId);
            const patientNames = groupAppointments.map(a => a.patientName);
            
            renderableAppointments.push({
                ...app, // Use the first appointment of the group as the base
                isGroup: true,
                groupPatientNames: patientNames,
                patientName: `${groupAppointments.length} Pacientes`,
            });
            processedGroupIds.add(app.groupId);
        } else {
            renderableAppointments.push({ ...app, isGroup: false });
        }
    });

    return calculateAppointmentLayout(renderableAppointments);
  }, [appointments, currentDate, currentUser]);

  const handleNextDay = () => setCurrentDate(addDays(currentDate, 1));
  const handlePrevDay = () => setCurrentDate(subDays(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsActionsDialogOpen(true);
  };
  
  const availabilityColors = {
    Planning: 'bg-blue-500/10 border-blue-500',
    Supervision: 'bg-purple-500/10 border-purple-500',
  };

  return (
    <TooltipProvider>
      <AppointmentActionsDialog
        isOpen={isActionsDialogOpen}
        onOpenChange={setIsActionsDialogOpen}
        appointment={selectedAppointment}
      />
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="capitalize">
              {format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevDay}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleToday}>Hoje</Button>
              <Button variant="outline" size="icon" onClick={handleNextDay}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="flex">
            <div className="w-16 flex-shrink-0">
              {hours.map(hour => (
                <div key={hour} className="h-[60px] text-right pr-2 text-xs text-muted-foreground border-t border-border pt-1">
                  {`${hour.toString().padStart(2, '0')}:00`}
                </div>
              ))}
            </div>
            <div className="flex-grow">
              <div className="relative border-r border-border bg-background">
                  {hours.map((hour, index) => (
                      <div key={hour} className={`h-[60px] ${index > 0 ? 'border-t border-border/70' : ''}`}></div>
                  ))}
                  
                  {users.map(user => 
                    (user.availability || []).map((slot, index) => {
                        if (slot.dayOfWeek !== currentDate.getDay() || slot.type === 'Free') return null;
                        if (currentUser?.role === 'Therapist' && user.id !== currentUser.id) return null;

                        const top = ((timeToMinutes(slot.startTime) - 7 * 60) / 60) * HOUR_HEIGHT + 1;
                        const height = ((timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime)) / 60) * HOUR_HEIGHT - 2;

                        return (
                            <Tooltip key={`${user.id}-${index}`}>
                                <TooltipTrigger asChild>
                                <div
                                    className={cn("absolute p-2 rounded-lg text-muted-foreground overflow-hidden text-xs shadow-sm flex items-center gap-2 z-0", availabilityColors[slot.type as keyof typeof availabilityColors])}
                                    style={{ top: `${top}px`, height: `${height}px`, width: `calc(100% - 4px)`, left: '2px' }}
                                >
                                    {slot.type === 'Planning' && <Edit3 className="h-4 w-4 shrink-0" />}
                                    {slot.type === 'Supervision' && <Briefcase className="h-4 w-4 shrink-0" />}
                                     <div className="flex-1 overflow-hidden">
                                        <p className="font-bold whitespace-nowrap overflow-hidden text-ellipsis">{currentUser?.role !== 'Therapist' ? user.name : slot.type}</p>
                                    </div>
                                </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-semibold">{slot.type} de {user.name}</p>
                                    <p>{slot.startTime} - {slot.endTime}</p>
                                </TooltipContent>
                            </Tooltip>
                        )
                    })
                  )}

                  {timeBlocks.filter(block => isSameDay(new Date(block.date + 'T00:00:00'), currentDate)).map(block => {
                     const top = ((timeToMinutes(block.startTime) - 7 * 60) / 60) * HOUR_HEIGHT + 1;
                     const height = ((timeToMinutes(block.endTime) - timeToMinutes(block.startTime)) / 60) * HOUR_HEIGHT - 2;
                     const isUserSpecific = block.userIds && block.userIds.length > 0;
                     const affectedUsers = isUserSpecific ? users.filter(u => block.userIds!.includes(u.id)).map(u => u.name).join(', ') : '';

                     return (
                        <Tooltip key={block.id}>
                          <TooltipTrigger asChild>
                             <div
                              className="absolute p-2 rounded-lg bg-muted/70 backdrop-blur-sm border-l-4 border-yellow-500 text-muted-foreground overflow-hidden text-xs shadow-sm flex items-center gap-2"
                              style={{ top: `${top}px`, height: `${height}px`, width: `calc(100% - 4px)`, left: '2px', zIndex: 5 }}
                            >
                              <Lock className="h-4 w-4 shrink-0" />
                              <div className="flex-1 overflow-hidden">
                                <p className="font-bold whitespace-nowrap overflow-hidden text-ellipsis">{block.title}</p>
                                {isUserSpecific && <Users className="h-3 w-3 mt-1" />}
                              </div>
                            </div>
                          </TooltipTrigger>
                           <TooltipContent>
                             <p className="font-semibold">{block.title}</p>
                             <p>{block.startTime} - {block.endTime}</p>
                            {isUserSpecific && <p className="text-xs mt-1 max-w-xs">Afeta: {affectedUsers}</p>}
                          </TooltipContent>
                        </Tooltip>
                     )
                  })}

                  {laidOutAppointments.map((app, idx) => {
                    const top = ((timeToMinutes(app.time) - 7 * 60) / 60) * HOUR_HEIGHT + 1;
                    const height = ((timeToMinutes(app.endTime) - timeToMinutes(app.time)) / 60) * HOUR_HEIGHT - 2;
                    const widthPercentage = 100 / app.layout.totalCols;
                    const leftPercentage = app.layout.col * widthPercentage;
                    const canInteract = currentUser && (
                        currentUser.role === 'Admin' ||
                        currentUser.role === 'Coordinator' ||
                        currentUser.role === 'Receptionist' ||
                        (currentUser.role === 'Therapist' && currentUser.name === app.professionalName)
                    );
                    const isPastAndPending = isClient && new Date() > new Date(`${app.date}T${app.endTime}`) && app.status === 'Agendado';
                    const healthPlan = selectedUnit?.healthPlans?.find(p => p.id === app.healthPlanId);

                    return (
                        <Tooltip key={app.id + idx}>
                          <TooltipTrigger asChild>
                            <div
                                onClick={() => canInteract && handleAppointmentClick(app)}
                                className={cn("absolute p-2 rounded-lg text-white overflow-hidden text-xs shadow-md transition-all flex flex-col justify-between border-l-4", canInteract ? "cursor-pointer hover:opacity-80" : "cursor-not-allowed", (app.status === 'Faltou' || app.status === 'Cancelado') && "opacity-60", app.status === 'Cancelado' && "line-through", isPastAndPending && "ring-2 ring-offset-1 ring-yellow-400")}
                                style={{ top: `${top}px`, height: `${height}px`, width: `calc(${widthPercentage}% - 4px)`, left: `calc(${leftPercentage}% + 2px)`, zIndex: 10 + app.layout.col, backgroundColor: app.color, borderColor: healthPlan?.color || app.color }}
                            >
                                <div>
                                    <p className="font-bold whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-1">{app.isGroup && <Users className="h-3 w-3"/>} {app.patientName}</p>
                                    <p className="whitespace-nowrap overflow-hidden text-ellipsis">{app.professionalName}</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="opacity-80">{app.time}</p>
                                    <div className="bg-black/20 text-white text-[10px] px-1.5 rounded-sm">
                                        {app.status}
                                    </div>
                                </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                                {app.isGroup ? (
                                    <>
                                        <p className="font-semibold">Grupo: {app.serviceName}</p>
                                        <p className="text-muted-foreground">Pacientes:</p>
                                        <ul className="list-disc pl-4">
                                            {app.groupPatientNames?.map((name, i) => <li key={i}>{name}</li>)}
                                        </ul>
                                    </>
                                ) : (
                                    <>
                                      <p className="font-semibold">{app.patientName}</p>
                                      {app.healthPlanName && <p className="text-sm flex items-center gap-1"><Shield className="h-3 w-3" /> {app.healthPlanName}</p>}
                                    </>
                                )}
                                <p className="text-xs text-muted-foreground">{app.professionalName}</p>
                          </TooltipContent>
                        </Tooltip>
                    );
                  })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
