// src/pages/Components.tsx
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { DataTable } from '../components/ui/data-table';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';
import { 
  ComponentDialog,
  type ComponentType 
} from '../components/ComponentDialog';

type Component = {
  id: number;
  manufacturer: string;
  model: string;
  price: number;
  is_active: boolean;
  created_at: string;
  [key: string]: any;
};

export default function Components() {
  const [activeTab, setActiveTab] = useState<ComponentType>('solar_panels');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);

  const columns = [
    {
      accessorKey: 'manufacturer',
      header: 'Manufacturer'
    },
    {
      accessorKey: 'model',
      header: 'Model'
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => {
        return `R${row.getValue('price')}`
      }
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => {
        return row.getValue('is_active') ? 'Active' : 'Inactive'
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => setEditingComponent(row.original)}
          >
            Edit
          </Button>
        )
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Component Management</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Component
        </Button>
      </div>

      <Tabs defaultValue="solar_panels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="solar_panels">Solar Panels</TabsTrigger>
          <TabsTrigger value="batteries">Batteries</TabsTrigger>
          <TabsTrigger value="inverters">Inverters</TabsTrigger>
        </TabsList>

        <TabsContent value="solar_panels" className="space-y-4">
          <DataTable
            columns={columns}
            data={[]} // We'll add data fetching later
          />
        </TabsContent>

        <TabsContent value="batteries" className="space-y-4">
          <DataTable
            columns={columns}
            data={[]}
          />
        </TabsContent>

        <TabsContent value="inverters" className="space-y-4">
          <DataTable
            columns={columns}
            data={[]}
          />
        </TabsContent>
      </Tabs>

      <ComponentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        type={activeTab}
        component={editingComponent}
      />
    </div>
  );
}