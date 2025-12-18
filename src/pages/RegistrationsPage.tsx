import { Users, Calendar, Building } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmployeesTab } from '@/components/registrations/EmployeesTab';
import { HolidaysTab } from '@/components/registrations/HolidaysTab';
import { EventsTab } from '@/components/registrations/EventsTab';

export default function RegistrationsPage() {
    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-display font-bold text-foreground">
                        Cadastros
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        Gerencie colaboradores, feriados e eventos
                    </p>
                </div>
            </div>

            <Tabs defaultValue="employees" className="space-y-4">
                <TabsList className="bg-muted/50 p-1 h-9">
                    <TabsTrigger value="employees" className="gap-2 text-xs h-7 data-[state=active]:bg-background">
                        <Users className="h-3 w-3" />
                        Colaboradores
                    </TabsTrigger>
                    <TabsTrigger value="holidays" className="gap-2 text-xs h-7 data-[state=active]:bg-background">
                        <Calendar className="h-3 w-3" />
                        Feriados
                    </TabsTrigger>
                    <TabsTrigger value="events" className="gap-2 text-xs h-7 data-[state=active]:bg-background">
                        <Building className="h-3 w-3" />
                        Eventos
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="employees">
                    <EmployeesTab />
                </TabsContent>

                <TabsContent value="holidays">
                    <HolidaysTab />
                </TabsContent>

                <TabsContent value="events">
                    <EventsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
