'use client'

import React from 'react'

type StepSignupProps = {
    onOwnerSelect?: () => void
    onCustomerSelect?: () => void
}

export default function StepSignup({ onOwnerSelect, onCustomerSelect }: StepSignupProps) {
    return (
        <div className="fixed inset-0 w-screen h-screen grid grid-cols-1 md:grid-cols-2">
            {/* Columna Cliente */}
            <button
                type="button"
                className="relative flex flex-col items-center justify-center w-full h-full overflow-hidden group bg-gray-50 hover:bg-gray-100 transition-colors duration-300"
                onClick={onCustomerSelect}
                aria-label="Seleccionar tipo de cuenta: Cliente"
            >
                {/* Imagen de fondo con overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-70 group-hover:opacity-50 transition-opacity duration-300" />
                <img
                    src="/images/clienteprueba.jpg"
                    alt="Persona disfrutando de un café como cliente"
                    className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-300"
                    onError={(e) => {
                        // Fallback si la imagen no carga
                        e.currentTarget.style.display = 'none';
                    }}
                />
                
                {/* Contenido */}
                <div className="relative z-10 flex flex-col items-center justify-center text-center p-8">
                    <span className="font-bold text-brand-700 text-4xl md:text-5xl mb-4 drop-shadow-lg group-hover:scale-105 transition-transform duration-300">
                        Cliente
                    </span>
                    <p className="text-gray-700 text-lg md:text-xl max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Ordena y recoge sin hacer fila
                    </p>
                </div>

                {/* Indicador hover */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center gap-2 text-brand-600 font-medium">
                        <span>Seleccionar</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            </button>

            {/* Columna Dueño */}
            <button
                type="button"
                className="relative flex flex-col items-center justify-center w-full h-full overflow-hidden group bg-orange-50 hover:bg-orange-100 transition-colors duration-300"
                onClick={onOwnerSelect}
                aria-label="Seleccionar tipo de cuenta: Dueño de cafetería"
            >
                {/* Imagen de fondo con overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-100 opacity-70 group-hover:opacity-50 transition-opacity duration-300" />
                <img
                    src="/images/dueñoprueba.jpg"
                    alt="Dueño de cafetería atendiendo a clientes"
                    className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-300"
                    onError={(e) => {
                        // Fallback si la imagen no carga
                        e.currentTarget.style.display = 'none';
                    }}
                />
                
                {/* Contenido */}
                <div className="relative z-10 flex flex-col items-center justify-center text-center p-8">
                    <span className="font-bold text-orange-700 text-4xl md:text-5xl mb-4 drop-shadow-lg group-hover:scale-105 transition-transform duration-300">
                        Dueño
                    </span>
                    <p className="text-gray-700 text-lg md:text-xl max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Gestiona tu cafetería eficientemente
                    </p>
                </div>

                {/* Indicador hover */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center gap-2 text-orange-600 font-medium">
                        <span>Seleccionar</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            </button>
        </div>
    )
}