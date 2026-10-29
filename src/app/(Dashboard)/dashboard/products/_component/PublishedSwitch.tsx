import { Switch } from "@/components/ui/switch";
import { useFormContext } from "react-hook-form";

export const PublishedSwitch = () => {
    const form = useFormContext();

    return (
        <div className="flex items-center justify-between rounded-xl border px-4 py-2 shadow-sm bg-white">
            <label className="text-sm font-medium text-gray-700">Published</label>
            <Switch
                checked={form.watch('published')}
                onCheckedChange={(checked) => form.setValue('published', checked)}
                className="data-[state=checked]:bg-[#4CD964]"
            />
        </div>
    );
};