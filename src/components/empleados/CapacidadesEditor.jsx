import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CAPACIDADES } from "@/lib/permissions";

export default function CapacidadesEditor({ value = {}, onChange, disabled = false }) {
  const grupos = [...new Set(CAPACIDADES.map((c) => c.grupo))];
  return (
    <div className="col-span-2 border rounded-lg p-3 space-y-3 bg-gray-50">
      <Label>Permisos individuales</Label>
      {disabled && (
        <p className="text-xs text-gray-500">Solo Super Admin puede cambiar los permisos.</p>
      )}
      {grupos.map((grupo) => (
        <div key={grupo}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{grupo}</p>
          <div className="mt-1 space-y-1">
            {CAPACIDADES.filter((c) => c.grupo === grupo).map((c) => (
              <div key={c.key} className="flex items-center justify-between gap-3 py-1">
                <span className="text-sm text-gray-700">{c.label}</span>
                <Switch
                  checked={value[c.key] !== false}
                  disabled={disabled}
                  onCheckedChange={(v) => onChange({ ...value, [c.key]: v })}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}