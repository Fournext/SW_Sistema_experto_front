import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import { useSistemaExpertoMutations } from '../hooks/useSistemasExpertos';
import SistemaExpertoForm from '../components/SistemaExpertoForm';
import Card from '@/components/ui/Card';
import type { SistemaExpertoFormData } from '../schemas/sistemaExpertoSchema';

export const CrearSistemaExpertoPage: React.FC = () => {
  const navigate = useNavigate();
  const { crear } = useSistemaExpertoMutations();

  const handleSubmit = async (data: SistemaExpertoFormData) => {
    try {
      const nuevo = await crear.mutateAsync({
        nombre: data.nombre,
        descripcion: data.descripcion,
        activo: data.activo,
      });
      // Redirigir al detalle o listado del nuevo sistema
      navigate(`/sistemas/${nuevo.id}`);
    } catch {
      // El error es manejado por Axios / React Query
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Botón Volver */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/sistemas')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Sistemas Expertos
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
          <PlusCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Nuevo Sistema Experto</h2>
          <p className="text-xs text-slate-500">
            Define los datos generales para crear un nuevo entorno interactivo de aprendizaje.
          </p>
        </div>
      </div>

      <Card>
        <SistemaExpertoForm
          onSubmit={handleSubmit}
          loading={crear.isPending}
          submitButtonText="Crear Sistema Experto"
          onCancel={() => navigate('/sistemas')}
        />
      </Card>
    </div>
  );
};

export default CrearSistemaExpertoPage;
