import { Switch } from "@/components/ui/switch";
import { useFormContext } from "react-hook-form";

export const PublishedSwitch = () => {
    const form = useFormContext();

    return (
        <div className="flex items-center justify-between w-full sm:w-auto rounded-xl border border-gray-200 px-4 py-3 shadow-2xs bg-white gap-6">
            <div>
                <label className="text-xs sm:text-sm font-bold text-gray-900 block">Publish Status</label>
                <span className="text-[11px] text-gray-500">Make product visible on storefront</span>
            </div>
            <Switch
                checked={form.watch('published')}
                onCheckedChange={(checked) => form.setValue('published', checked)}
                className="data-[state=checked]:bg-[#4CD964]"
            />
        </div>
    );
};