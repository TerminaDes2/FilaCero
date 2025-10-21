// app/user/verification.tsx
"use client";
import { UserInfo } from '../../lib/api';
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  Shield,
  Mail,
  Phone
} from 'lucide-react';

interface VerificationSectionProps {
  user: UserInfo;
}

interface VerificationItem {
  id: string;
  label: string;
  status: 'verified' | 'pending' | 'unverified';
  description: string;
  icon: any;
  action?: () => void;
}

export default function VerificationSection({ user }: VerificationSectionProps) {
  const verificationItems: VerificationItem[] = [
    {
      id: 'email',
      label: 'Correo electrónico',
      status: 'verified',
      description: 'Tu correo electrónico está verificado',
      icon: Mail,
    },
    {
      id: 'phone',
      label: 'Número de teléfono',
      status: user.numero_telefono ? 'verified' : 'unverified',
      description: user.numero_telefono ? 'Tu teléfono está verificado' : 'Verifica tu número de teléfono',
      icon: Phone,
    },
    {
      id: 'identity',
      label: 'Verificación de identidad',
      status: 'unverified',
      description: 'Completa tu verificación de identidad',
      icon: Shield,
    },
    {
      id: 'profile',
      label: 'Perfil completo',
      status: user.fecha_nacimiento && user.numero_telefono ? 'verified' : 'pending',
      description: user.fecha_nacimiento && user.numero_telefono ? 'Perfil completo' : 'Completa tu información',
      icon: Shield,
    },
  ];

  const getStatusIcon = (status: VerificationItem['status']) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'unverified':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: VerificationItem['status']) => {
    switch (status) {
      case 'verified':
        return 'text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
      case 'pending':
        return 'text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'unverified':
        return 'text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
    }
  };

  const getStatusText = (status: VerificationItem['status']) => {
    switch (status) {
      case 'verified':
        return 'Verificado';
      case 'pending':
        return 'Pendiente';
      case 'unverified':
        return 'Sin verificar';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Verificación
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Estado de verificación de tu cuenta
        </p>
      </div>

      <div className="p-6 space-y-4">
        {verificationItems.map((item) => {
          const Icon = item.icon;
          
          return (
            <div
              key={item.id}
              className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-slate-600"
            >
              <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg">
                <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.label}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.description}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
                  {getStatusText(item.status)}
                </span>
                {getStatusIcon(item.status)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progreso de verificación */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progreso de verificación
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {verificationItems.filter(item => item.status === 'verified').length}/
            {verificationItems.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className="bg-brand-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${(verificationItems.filter(item => item.status === 'verified').length / verificationItems.length) * 100}%`
            }}
          />
        </div>
      </div>
    </div>
  );
}