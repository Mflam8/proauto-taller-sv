import React, { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

/**
 * ClienteCombobox — selector de cliente con búsqueda por texto.
 * Ordena los clientes alfabéticamente y permite escribir para filtrar.
 */
export default function ClienteCombobox({ clientes, value, onChange, placeholder = "Buscar cliente..." }) {
  const [open, setOpen] = useState(false);

  const clientesOrdenados = [...(clientes || [])].sort((a, b) =>
    (a.nombre_completo || "").localeCompare(b.nombre_completo || "", "es", { sensitivity: "base" })
  );

  const seleccionado = clientesOrdenados.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm transition-colors",
            "focus:border-[#E31E24] focus:outline-none focus:ring-0",
            !value && "text-muted-foreground"
          )}
        >
          {seleccionado ? (
            <span className="truncate text-left font-medium text-gray-900">
              {seleccionado.nombre_completo}
            </span>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput placeholder="Escriba el nombre del cliente..." className="h-9" />
          </div>
          <CommandList className="max-h-64 overflow-auto">
            <CommandEmpty>No se encontró ningún cliente.</CommandEmpty>
            <CommandGroup>
              {clientesOrdenados.map((cliente) => (
                <CommandItem
                  key={cliente.id}
                  value={cliente.nombre_completo || ""}
                  onSelect={() => {
                    onChange(cliente.id === value ? "" : cliente.id);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === cliente.id ? "opacity-100 text-[#E31E24]" : "opacity-0"
                    )}
                  />
                  <span className="flex-1 truncate">{cliente.nombre_completo}</span>
                  {cliente.telefono && (
                    <span className="text-xs text-gray-400 ml-2">{cliente.telefono}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}