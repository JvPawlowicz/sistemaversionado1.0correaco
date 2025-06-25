import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import type { Patient, EvolutionRecord, Report } from '@/lib/types';
import Link from 'next/link';

export function PatientDetailView({ patient, records, reports }: { patient: Patient, records: EvolutionRecord[], reports: Report[] }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col items-start gap-4 sm:flex-row">
          <Avatar className="h-24 w-24">
            <AvatarImage src={patient.avatarUrl} alt={patient.name} />
            <AvatarFallback className="text-3xl">{patient.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-3xl">{patient.name}</CardTitle>
            <CardDescription className="mt-2 text-base">
              Patient ID: {patient.id}
            </CardDescription>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>DOB: {patient.dob}</span>
              <span>Gender: {patient.gender}</span>
              <span>Phone: {patient.phone}</span>
              <span>Email: {patient.email}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="evolution">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="evolution">Evolution Records</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="profile">Full Profile</TabsTrigger>
        </TabsList>
        <TabsContent value="evolution">
          <Card>
            <CardHeader>
              <CardTitle>Evolution Records</CardTitle>
              <CardDescription>Chronological log of patient progress and sessions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Record
              </Button>
              <div className="space-y-4">
                {records.map(record => (
                  <div key={record.id} className="rounded-lg border bg-secondary p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{record.title}</h3>
                        <span className="text-sm text-muted-foreground">{record.date}</span>
                    </div>
                    <p className="mt-2 text-sm">{record.details}</p>
                    <p className="mt-2 text-xs text-muted-foreground">By: {record.author}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>Official documents and reports related to the patient.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Report
                </Button>
                <ul className="space-y-2">
                    {reports.map(report => (
                        <li key={report.id} className="flex items-center justify-between rounded-lg border p-3">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-primary"/>
                                <div>
                                    <p className="font-medium">{report.title}</p>
                                    <p className="text-sm text-muted-foreground">Generated on {report.date}</p>
                                </div>
                            </div>
                            <Button asChild variant="outline" size="sm">
                                <Link href={report.url}>Download</Link>
                            </Button>
                        </li>
                    ))}
                </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Full Patient Profile</CardTitle>
              <CardDescription>All detailed information for the patient.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Detailed profile information will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
