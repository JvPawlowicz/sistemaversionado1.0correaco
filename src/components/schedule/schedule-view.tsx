'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DailyView } from './daily-view';
import { MonthlyView } from './monthly-view';
import { appointments } from '@/lib/placeholder-data';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function ScheduleView() {
  const dayViewRef = React.useRef<HTMLDivElement>(null);
  const monthViewRef = React.useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = React.useState('day');
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExportPdf = () => {
    setIsExporting(true);
    const inputRef = activeTab === 'day' ? dayViewRef : monthViewRef;
    const input = inputRef.current;

    if (input) {
      const orientation = activeTab === 'day' ? 'l' : 'p';
      html2canvas(input, { scale: 2, useCORS: true }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF(orientation, 'mm', 'a4', true);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        
        let imgWidth = pdfWidth;
        let imgHeight = pdfWidth / ratio;
        
        if (imgHeight > pdfHeight - 20) { // add some margin
            imgHeight = pdfHeight - 20;
            imgWidth = imgHeight * ratio;
        }
        
        const x = (pdfWidth - imgWidth) / 2;
        const y = 10;

        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        pdf.save('schedule.pdf');
      }).finally(() => {
        setIsExporting(false);
      });
    } else {
        setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
        <Tabs defaultValue="day" className="w-full" onValueChange={setActiveTab}>
            <div className="flex items-center justify-between pb-4">
                <TabsList>
                    <TabsTrigger value="day">Day</TabsTrigger>
                    <TabsTrigger value="month">Month</TabsTrigger>
                </TabsList>
                 <Button onClick={handleExportPdf} disabled={isExporting}>
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Export PDF
                </Button>
            </div>
            <TabsContent value="day" >
                <div ref={dayViewRef}>
                    <DailyView appointments={appointments} />
                </div>
            </TabsContent>
            <TabsContent value="month">
                <div ref={monthViewRef}>
                    <MonthlyView appointments={appointments} />
                </div>
            </TabsContent>
        </Tabs>
    </div>
  );
}
