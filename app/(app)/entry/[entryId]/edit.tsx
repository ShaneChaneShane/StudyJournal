import EntryEditorScreen from "@/components/EntryEditorScreen";
import { useLocalSearchParams } from "expo-router";

export default function EditEntryRoute() {
    const { entryId } = useLocalSearchParams<{ entryId: string }>();
    if (!entryId) return null;

    return <EntryEditorScreen mode="edit" entryId={entryId} />;
}
